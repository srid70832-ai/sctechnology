import { NextResponse } from "next/server";
import { getGlobalLeaderboard } from "@/lib/hackathons/results-service";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieve public leaderboard data (Hackathon Champions, Student Achievements, and Verified Internship Stipends)
 */
export async function GET(req: Request) {
  try {
    const leaderboardData = await getGlobalLeaderboard();

    return NextResponse.json({
      success: true,
      ...leaderboardData,
    });
  } catch (error: any) {
    console.error("GET Leaderboard Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to load leaderboard" }, { status: 500 });
  }
}
