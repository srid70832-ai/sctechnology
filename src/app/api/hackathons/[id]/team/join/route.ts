import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getStudentProfile } from "@/lib/firestore";
import { HackathonTeam, TeamMemberItem } from "@/lib/hackathon-team-models";
import { 
  findTeamByCodeOrToken, 
  getTeamsForHackathon, 
  saveTeamDoc 
} from "@/lib/team-storage";
import { prisma } from "@/lib/prisma";
import { generateRegistrationNo } from "@/lib/utils";
import { isDeadlinePassed } from "@/lib/platform-models";

export const dynamic = "force-dynamic";

/**
 * POST: Join an existing team using joinCode or inviteToken
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Please log in as a student to join a team" }, { status: 401 });
    }

    const hackathonId = params.id;
    const body = await req.json();
    const { joinCode, inviteToken } = body;

    if (!joinCode && !inviteToken) {
      return NextResponse.json({ error: "Join Code or Invite Token is required" }, { status: 400 });
    }

    // 1. Fetch Hackathon details
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

    // 3. Find target team
    const targetTeam = await findTeamByCodeOrToken(hackathon.id || hackathonId, joinCode, inviteToken);

    if (!targetTeam) {
      return NextResponse.json(
        { error: "Invalid Join Code or Invite Link. Team not found." },
        { status: 404 }
      );
    }

    // 4. Check if user is already in ANY active team for this hackathon
    const allTeams = await getTeamsForHackathon(hackathon.id || hackathonId);
    for (const t of allTeams) {
      if (t.members?.some((m) => m.userId === session.userId)) {
        if (t.id === targetTeam.id) {
          return NextResponse.json(
            { error: "You are already a member of this team." },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: `You are already registered in team "${t.name}" (${t.teamId}) for this hackathon` },
          { status: 400 }
        );
      }
    }

    // 5. Capacity validation
    const maxCapacity = targetTeam.maxTeamSize || 4;
    if (targetTeam.members.length >= maxCapacity) {
      return NextResponse.json(
        { error: `This team has already reached its maximum capacity of ${maxCapacity} members.` },
        { status: 400 }
      );
    }

    // 6. Individual registration duplicate check
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

    // 7. Fetch student profile details
    const studentProfile = await getStudentProfile(session.userId);
    const regNo = generateRegistrationNo(hackathon.slug || "HACK");

    const newMember: TeamMemberItem = {
      userId: session.userId,
      name: session.name || "Team Member",
      email: session.email || "",
      role: "MEMBER",
      registrationNo: regNo,
      joinedAt: new Date().toISOString(),
      college: studentProfile?.college || null,
      department: studentProfile?.department || null,
    };

    const updatedMembers = [...targetTeam.members, newMember];
    const updatedTeam = {
      ...targetTeam,
      members: updatedMembers,
      updatedAt: new Date().toISOString(),
    };

    // Save team
    await saveTeamDoc(updatedTeam);

    // Register member in Prisma
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
      message: `You have successfully joined "${targetTeam.name}"!`,
      team: updatedTeam,
    });
  } catch (error: any) {
    console.error("Join Hackathon Team Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to join team" }, { status: 500 });
  }
}
