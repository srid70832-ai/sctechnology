import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getStudentProfile } from "@/lib/firestore";
import { 
  HackathonTeam, 
  generateTeamId, 
  generateJoinCode, 
  generateInviteToken,
  computeTeamPaymentStatus,
  MemberPaymentStatus
} from "@/lib/hackathon-team-models";
import { 
  findUserTeam, 
  getTeamsForHackathon, 
  saveTeamDoc 
} from "@/lib/team-storage";
import { prisma } from "@/lib/prisma";
import { generateRegistrationNo } from "@/lib/utils";
import { isDeadlinePassed } from "@/lib/platform-models";
import { verifyRazorpayPayment } from "@/lib/payment";
import { processReferralConversion } from "@/lib/referrals/service";
import { resolveHackathon } from "@/lib/hackathons/resolve-hackathon";
import { logHackathonOperation } from "@/lib/hackathons/diagnostics";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieve the authenticated student's team for this hackathon (if any)
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ hasTeam: false, team: null });
    }

    const hackathonId = params.id;
    const hackathon = await resolveHackathon(hackathonId);

    const userTeam = await findUserTeam(hackathon?.id || hackathonId, session.userId);

    if (!userTeam) {
      return NextResponse.json({ hasTeam: false, team: null });
    }

    const entryFee = hackathon?.entryFee || 0;
    const stats = computeTeamPaymentStatus(userTeam, entryFee);

    return NextResponse.json({
      hasTeam: true,
      team: {
        ...userTeam,
        paymentStatus: stats.paymentStatus,
        paidMemberCount: stats.paidMemberCount,
        totalPaidAmount: stats.totalPaidAmount,
        totalRequiredAmount: stats.totalRequiredAmount,
      },
      isLeader: userTeam.leaderId === session.userId,
    });
  } catch (error: any) {
    console.error("GET Hackathon Team Error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

/**
 * POST: Create a new team for this hackathon (User becomes LEADER)
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Please log in as a student to create a team" }, { status: 401 });
    }

    const hackathonId = params.id;
    const body = await req.json();
    const { teamName, orderId, paymentId, signature } = body;

    if (!teamName || !String(teamName).trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    // 1. Fetch hackathon details to check deadlines and mode
    const hackathon = await resolveHackathon(hackathonId);

    if (!hackathon) {
      logHackathonOperation({ channel: "HACKATHON_REGISTRATION", hackathonId, userId: session.userId, route: "/api/hackathons/[id]/team", operation: "resolve-hackathon", result: "not-found" });
      return NextResponse.json({ error: "Hackathon not found", hackathonId }, { status: 404 });
    }

    // 2. Deadline check
    if (isDeadlinePassed(hackathon.registrationDeadline)) {
      return NextResponse.json({ error: "Registration deadline has passed for this hackathon" }, { status: 400 });
    }

    // 3. Registration mode check
    const regMode = (hackathon as any).registrationMode || "BOTH";
    if (regMode === "INDIVIDUAL_ONLY") {
      return NextResponse.json({ error: "This hackathon only permits individual registrations" }, { status: 400 });
    }

    // 4. Duplicate check across teams
    const existingTeams = await getTeamsForHackathon(hackathon.id || hackathonId);

    for (const t of existingTeams) {
      if (t.members?.some((m) => m.userId === session.userId)) {
        return NextResponse.json(
          { error: `You are already registered in team "${t.name}" (${t.teamId}) for this hackathon` },
          { status: 409 }
        );
      }
      if (t.name.toLowerCase() === String(teamName).trim().toLowerCase()) {
        return NextResponse.json(
          { error: "A team with this name already exists in this hackathon. Please choose another name." },
          { status: 409 }
        );
      }
    }

    // 5. Duplicate check for individual registration in Prisma
    const existingPrismaReg = await prisma.hackathonRegistration.findFirst({
      where: {
        hackathonId: hackathon.id || hackathonId,
        userId: session.userId,
      },
    });

    if (existingPrismaReg) {
      return NextResponse.json(
        { error: "You are already registered for this hackathon." },
        { status: 409 }
      );
    }

    // 6. Check payment status for paid hackathons
    const isPaidHackathon = hackathon.entryFee > 0;
    let leaderPaymentStatus: MemberPaymentStatus = isPaidHackathon ? "PENDING" : "NOT_REQUIRED";
    let verifiedPaymentRecordId: string | null = null;

    if (isPaidHackathon && signature && orderId && paymentId) {
      try {
        await verifyRazorpayPayment({ orderId, paymentId, signature });
        leaderPaymentStatus = "PAID";
        try {
          const payment = await prisma.payment.create({
            data: {
              orderId,
              paymentId,
              signature,
              userId: session.userId,
              hackathonId: hackathon.id,
              amount: hackathon.entryFee,
              status: "SUCCESS",
              gateway: "RAZORPAY",
              verifiedAt: new Date(),
            },
          });
          verifiedPaymentRecordId = payment.id;
        } catch {}
      } catch (paymentError) {
        console.warn("Team leader payment was not confirmed:", paymentError);
      }
    }

    // 7. Fetch student profile to capture department and college
    const studentProfile = await getStudentProfile(session.userId);

    // 8. Generate IDs and codes
    const teamIdCode = generateTeamId("SC26");
    const joinCode = generateJoinCode();
    const inviteToken = generateInviteToken();
    const regNo = generateRegistrationNo(hackathon.slug || "HACK");

    const firestoreTeamDocId = `team-${hackathon.id || hackathonId}-${teamIdCode.toLowerCase()}`;
    const minTeamSize = (hackathon as any).minTeamSize || 2;
    const maxTeamSize = (hackathon as any).maxTeamSize || hackathon.maxTeamSize || 4;

    const initialMembers = [
      {
        userId: session.userId,
        name: session.name || "Team Leader",
        email: session.email || "",
        role: "LEADER" as const,
        registrationNo: regNo,
        joinedAt: new Date().toISOString(),
        college: studentProfile?.college || null,
        department: studentProfile?.department || null,
        paymentStatus: leaderPaymentStatus,
        paymentId: paymentId || null,
        orderId: orderId || null,
        paymentAmount: leaderPaymentStatus === "PAID" ? hackathon.entryFee : 0,
        paidAt: leaderPaymentStatus === "PAID" ? new Date().toISOString() : null,
      },
    ];

    const stats = computeTeamPaymentStatus({
      id: firestoreTeamDocId,
      teamId: teamIdCode,
      hackathonId: hackathon.id || hackathonId,
      name: String(teamName).trim(),
      leaderId: session.userId,
      leaderName: session.name || "Team Leader",
      leaderEmail: session.email || "",
      joinCode,
      inviteToken,
      members: initialMembers,
      minTeamSize,
      maxTeamSize,
      round: 1,
      roundStatus: "REGISTERED",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, hackathon.entryFee);

    const newTeam: HackathonTeam = {
      id: firestoreTeamDocId,
      teamId: teamIdCode,
      hackathonId: hackathon.id || hackathonId,
      hackathonTitle: hackathon.title,
      name: String(teamName).trim(),
      leaderId: session.userId,
      leaderName: session.name || "Team Leader",
      leaderEmail: session.email || "",
      joinCode,
      inviteToken,
      members: initialMembers,
      minTeamSize,
      maxTeamSize,
      round: 1,
      roundStatus: "REGISTERED",
      paymentStatus: stats.paymentStatus,
      paidMemberCount: stats.paidMemberCount,
      totalPaidAmount: stats.totalPaidAmount,
      submission: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save team
    await saveTeamDoc(newTeam);

    // Also register the leader in Prisma for relational integrity
    try {
      await prisma.hackathonRegistration.create({
        data: {
          hackathonId: hackathon.id || hackathonId,
          userId: session.userId,
          registrationNo: regNo,
          paymentId: verifiedPaymentRecordId,
          status: leaderPaymentStatus === "PAID" || !isPaidHackathon ? "CONFIRMED" : "PENDING",
        },
      });
    } catch (prismaErr) {
      console.warn("Prisma registration sync note:", prismaErr);
    }

    // Process Referral Conversion if paid
    if (leaderPaymentStatus === "PAID") {
      try {
        await processReferralConversion({
          referredUid: session.userId,
          eventType: "HACKATHON_REGISTERED",
          amount: hackathon.entryFee,
          metadata: {
            hackathonId: hackathon.id,
            hackathonTitle: hackathon.title,
            teamId: newTeam.id,
            teamName: newTeam.name,
          },
        });
      } catch (refErr) {
        console.warn("Leader referral conversion notice:", refErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Team "${newTeam.name}" created successfully!`,
      team: newTeam,
    });
  } catch (error: any) {
    logHackathonOperation({ channel: "HACKATHON_REGISTRATION", hackathonId: params.id, route: "/api/hackathons/[id]/team", operation: "create-team", result: "error" });
    console.error("Create Hackathon Team Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create team" }, { status: 500 });
  }
}
