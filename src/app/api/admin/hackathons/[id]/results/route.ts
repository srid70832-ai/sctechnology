import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeamsForHackathon } from "@/lib/team-storage";
import { 
  saveHackathonResults, 
  getHackathonResults 
} from "@/lib/hackathons/results-service";
import { notifyIndexNow, publicContentUrl } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

/**
 * GET: Admin load registered teams, submissions, and existing result draft
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse, session } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const hackathonId = params.id;
    const hackathon = await prisma.hackathon.findFirst({
      where: { OR: [{ id: hackathonId }, { slug: hackathonId }] },
    });

    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    // 1. Fetch all active teams
    const teams = await getTeamsForHackathon(hackathon.id);

    // 2. Fetch individual submissions from Prisma (for solo participants)
    const soloRegistrations = await prisma.hackathonRegistration.findMany({
      where: {
        hackathonId: hackathon.id,
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, studentProfile: true },
        },
        submission: true,
      },
    });

    // 3. Fetch existing results (Draft or Published)
    const existingResults = await getHackathonResults(hackathon.id);

    return NextResponse.json({
      success: true,
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        slug: hackathon.slug,
        prizePool: hackathon.prizePool,
        status: hackathon.status,
      },
      teams,
      soloRegistrations,
      existingResults,
    });
  } catch (error: any) {
    console.error("Admin GET Hackathon Results Portal Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch data" }, { status: 500 });
  }
}

/**
 * POST: Admin save draft or publish official winners
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse, session } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const hackathonId = params.id;
    const body = await req.json();
    const { winners, announcementNotes, isPublish = false } = body;

    if (!winners || !Array.isArray(winners) || winners.length === 0) {
      return NextResponse.json({ error: "At least one winning team/participant must be selected" }, { status: 400 });
    }

    const res = await saveHackathonResults({
      hackathonId,
      winners,
      announcementNotes,
      isPublish: Boolean(isPublish),
      adminUid: session?.userId,
      adminEmail: session?.email,
    });

    if (isPublish) {
      notifyIndexNow([
        publicContentUrl("hackathons", hackathonId),
        `/hackathons/${encodeURIComponent(hackathonId)}/results`,
      ]);
    }

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Admin POST Hackathon Results Publish Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save results" }, { status: 500 });
  }
}
