import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { 
  getTeamsForHackathon, 
  updateTeamRoundStatus 
} from "@/lib/team-storage";
import { HackathonTeam, RoundStatus } from "@/lib/hackathon-team-models";

export const dynamic = "force-dynamic";

/**
 * GET: Admin fetch all teams for a hackathon
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const hackathonId = params.id;
    const teams = await getTeamsForHackathon(hackathonId);

    return NextResponse.json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error: any) {
    console.error("Admin GET Hackathon Teams Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch teams" }, { status: 500 });
  }
}

/**
 * PATCH: Admin update team round qualification status
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const { teamId, roundStatus, round } = body;

    if (!teamId || !roundStatus) {
      return NextResponse.json({ error: "teamId and roundStatus are required" }, { status: 400 });
    }

    const updated = await updateTeamRoundStatus(
      teamId,
      roundStatus as RoundStatus,
      round ? Number(round) : undefined
    );

    if (!updated) {
      return NextResponse.json({ error: "Team not found or failed to update" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Team updated to ${roundStatus}`,
      teamId,
      roundStatus,
    });
  } catch (error: any) {
    console.error("Admin PATCH Hackathon Team Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update team" }, { status: 500 });
  }
}
