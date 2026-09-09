import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { discoverDailyInternships, discoverDailyCourses, getDiscoveryTelemetry } from "@/lib/gemini-discovery";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Authenticate execution: Allow Admin session or CRON_SECRET authorization header
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    
    let isAuthorized = false;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else {
      const session = await getServerSession(req);
      if (session?.role === "ADMIN" || session?.role === "SUPER_ADMIN") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges or valid CRON_SECRET required." },
        { status: 401 }
      );
    }

    // 2. Discover 5 Daily Real Internships
    const internshipResult = await discoverDailyInternships(5);

    // 3. Discover 3 Daily Real Online Courses
    const courseResult = await discoverDailyCourses(3);

    // 4. Retrieve fresh telemetry summary
    const telemetry = await getDiscoveryTelemetry();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      internships: {
        added: internshipResult.added,
        skippedDuplicates: internshipResult.skippedDuplicates,
        message: internshipResult.message,
      },
      courses: {
        added: courseResult.added,
        skippedDuplicates: courseResult.skippedDuplicates,
        message: courseResult.message,
      },
      telemetry,
    });
  } catch (error: any) {
    console.error("Cron Daily Discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Daily discovery routine failed." },
      { status: 500 }
    );
  }
}

// Support GET for standard web cron jobs (e.g. Vercel Cron)
export async function GET(req: Request) {
  return POST(req);
}
