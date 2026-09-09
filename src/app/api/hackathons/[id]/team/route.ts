import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getStudentProfile } from "@/lib/firestore";
import { 
  HackathonTeam, 
  generateTeamId, 
  generateJoinCode, 
  generateInviteToken 
} from "@/lib/hackathon-team-models";
import { 
  findUserTeam, 
  getTeamsForHackathon, 
  saveTeamDoc 
} from "@/lib/team-storage";
import { prisma } from "@/lib/prisma";
import { generateRegistrationNo } from "@/lib/utils";
import { isDeadlinePassed } from "@/lib/platform-models";

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
    const userTeam = await findUserTeam(hackathonId, session.userId);

    if (!userTeam) {
      return NextResponse.json({ hasTeam: false, team: null });
    }

    return NextResponse.json({
      hasTeam: true,
      team: userTeam,
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
    const { teamName } = body;

    if (!teamName || !String(teamName).trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    // 1. Fetch hackathon details to check deadlines and mode
    const hackathon = await prisma.hackathon.findFirst({
      where: { OR: [{ id: hackathonId }, { slug: hackathonId }] },
    });

    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
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
          { status: 400 }
        );
      }
      if (t.name.toLowerCase() === String(teamName).trim().toLowerCase()) {
        return NextResponse.json(
          { error: "A team with this name already exists in this hackathon. Please choose another name." },
          { status: 400 }
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
        { status: 400 }
      );
    }

    // 6. Fetch student profile to capture department and college
    const studentProfile = await getStudentProfile(session.userId);

    // 7. Generate IDs and codes
    const teamIdCode = generateTeamId("SC26");
    const joinCode = generateJoinCode();
    const inviteToken = generateInviteToken();
    const regNo = generateRegistrationNo(hackathon.slug || "HACK");

    const firestoreTeamDocId = `team-${hackathon.id || hackathonId}-${teamIdCode.toLowerCase()}`;
    const minTeamSize = (hackathon as any).minTeamSize || 2;
    const maxTeamSize = (hackathon as any).maxTeamSize || hackathon.maxTeamSize || 4;

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
      members: [
        {
          userId: session.userId,
          name: session.name || "Team Leader",
          email: session.email || "",
          role: "LEADER",
          registrationNo: regNo,
          joinedAt: new Date().toISOString(),
          college: studentProfile?.college || null,
          department: studentProfile?.department || null,
        },
      ],
      minTeamSize,
      maxTeamSize,
      round: 1,
      roundStatus: "REGISTERED",
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
          status: "CONFIRMED",
        },
      });
    } catch (prismaErr) {
      console.warn("Prisma registration sync note:", prismaErr);
    }

    return NextResponse.json({
      success: true,
      message: `Team "${newTeam.name}" created successfully!`,
      team: newTeam,
    });
  } catch (error: any) {
    console.error("Create Hackathon Team Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create team" }, { status: 500 });
  }
}
