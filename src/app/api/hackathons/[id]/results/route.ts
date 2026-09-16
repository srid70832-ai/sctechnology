import { NextResponse } from "next/server";
import { getHackathonResults } from "@/lib/hackathons/results-service";
import { prisma } from "@/lib/prisma";
import { resolveHackathon } from "@/lib/hackathons/resolve-hackathon";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieve public published official results for a hackathon
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const hackathonId = params.id;
    const hackathon = await resolveHackathon(hackathonId);

    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const results = await getHackathonResults(hackathon.id);

    return NextResponse.json({
      success: true,
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        slug: hackathon.slug,
        bannerUrl: hackathon.bannerUrl,
        prizePool: hackathon.prizePool,
        startDate: hackathon.startDate,
        endDate: hackathon.endDate,
      },
      hasResults: !!results && results.status === "PUBLISHED",
      results: results && results.status === "PUBLISHED" ? results : null,
    });
  } catch (error: any) {
    console.error("GET Hackathon Results Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch results" }, { status: 500 });
  }
}
