import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { 
  findUserTeam, 
  removeMemberFromTeam, 
  getTeamsForHackathon 
} from "@/lib/team-storage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * DELETE: Remove a member from the team (by Leader) or leave team (by Member)
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, memberUserId } = await req.json();

    if (!teamId || !memberUserId) {
      return NextResponse.json({ error: "teamId and memberUserId are required" }, { status: 400 });
    }

    const hackathonId = params.id;
    const allTeams = await getTeamsForHackathon(hackathonId);
    const team = allTeams.find((t) => t.id === teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.status !== "ACTIVE") {
      return NextResponse.json({ error: "Team is not active" }, { status: 400 });
    }

    // Check permissions: Either user is leader, or user is removing themselves
    const isLeader = team.leaderId === session.userId;
    const isSelf = session.userId === memberUserId;

    if (!isLeader && !isSelf) {
      return NextResponse.json({ error: "Only the team leader can remove members" }, { status: 403 });
    }

    // Leader cannot remove themselves unless disbanding the team
    if (memberUserId === team.leaderId) {
      return NextResponse.json(
        { error: "The team leader cannot leave the team. Disband the team if you wish to exit." },
        { status: 400 }
      );
    }

    const result = await removeMemberFromTeam(teamId, memberUserId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to remove member" }, { status: 400 });
    }

    // Remove from Prisma registration
    try {
      await prisma.hackathonRegistration.deleteMany({
        where: {
          hackathonId: team.hackathonId,
          userId: memberUserId,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: isSelf ? "You have left the team." : "Member removed successfully.",
      members: result.members,
    });
  } catch (error: any) {
    console.error("Remove Member Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to remove member" }, { status: 500 });
  }
}
