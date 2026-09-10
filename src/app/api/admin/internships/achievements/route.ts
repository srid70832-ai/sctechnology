import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  verifyAndPublishInternshipAchievement,
  getGlobalLeaderboard 
} from "@/lib/hackathons/results-service";

export const dynamic = "force-dynamic";

/**
 * GET: Admin fetch all selected internship applications and current achievements
 */
export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    // Fetch selected / completed applications
    const applications = await prisma.internshipApplication.findMany({
      where: {
        status: { in: ["SELECTED", "COMPLETED"] },
      },
      include: {
        student: {
          select: { id: true, name: true, email: true, studentProfile: true },
        },
        internship: {
          include: { company: true },
        },
        offer: true,
        evaluation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const leaderboard = await getGlobalLeaderboard();

    return NextResponse.json({
      success: true,
      applications,
      verifiedAchievements: leaderboard.internshipAchievements,
    });
  } catch (error: any) {
    console.error("Admin GET Internship Achievements Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch achievements" }, { status: 500 });
  }
}

/**
 * POST: Admin verify and publish internship stipend achievement
 */
export async function POST(req: Request) {
  try {
    const { authorized, errorResponse, session } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const {
      studentUid,
      studentName,
      studentEmail,
      studentCollege,
      internshipId,
      companyName,
      role,
      duration = "6 Weeks",
      stipendAmount,
      stipendCurrency = "INR",
      stipendVerified = true,
      completionVerified = true,
    } = body;

    if (!studentUid || !internshipId || !companyName || !role) {
      return NextResponse.json({ error: "Missing required internship achievement fields" }, { status: 400 });
    }

    const result = await verifyAndPublishInternshipAchievement({
      studentUid,
      studentName,
      studentEmail,
      studentCollege,
      internshipId,
      companyName,
      role,
      duration,
      stipendAmount: Number(stipendAmount) || 0,
      stipendCurrency,
      stipendVerified: Boolean(stipendVerified),
      completionVerified: Boolean(completionVerified),
      adminEmail: session?.email || "admin@sctech.com",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Admin POST Verify Internship Error:", error);
    return NextResponse.json({ error: error?.message || "Verification failed" }, { status: 500 });
  }
}
