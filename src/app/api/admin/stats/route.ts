import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    let prismaStudentsCount = 0;
    let prismaCompaniesCount = 0;
    let prismaInternshipsCount = 0;
    let prismaHackathons: any[] = [];
    let prismaProblemStatementsCount = 0;
    let prismaProjectsCount = 0;
    let applicationsCount = 0;
    let registrationsCount = 0;
    let payments: any[] = [];
    let recentUsers: any[] = [];
    let recentPayments: any[] = [];
    let recentLogs: any[] = [];

    try {
      const results = await Promise.all([
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.company.count(),
        prisma.internship.count(),
        prisma.hackathon.findMany({ select: { status: true, startDate: true, endDate: true } }),
        prisma.problemStatement.count(),
        prisma.project.count(),
        prisma.internshipApplication.count(),
        prisma.hackathonRegistration.count(),
        prisma.payment.findMany({ where: { status: "SUCCESS" } }),
        prisma.user.findMany({ take: 6, orderBy: { createdAt: "desc" } }),
        prisma.payment.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true, email: true } }, plan: true },
        }),
        prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: { actor: { select: { name: true, email: true, role: true } } },
        }),
      ]);

      prismaStudentsCount = results[0] || 0;
      prismaCompaniesCount = results[1] || 0;
      prismaInternshipsCount = results[2] || 0;
      prismaHackathons = results[3] || [];
      prismaProblemStatementsCount = results[4] || 0;
      prismaProjectsCount = results[5] || 0;
      applicationsCount = results[6] || 0;
      registrationsCount = results[7] || 0;
      payments = results[8] || [];
      recentUsers = results[9] || [];
      recentPayments = results[10] || [];
      recentLogs = results[11] || [];
    } catch (err) {
      console.warn("Prisma stats query failed on serverless runtime:", err);
    }

    // Query Firestore collections if available
    let firestoreStudentsCount = 0;
    let firestoreCompaniesCount = 0;
    let firestoreProjectsCount = 0;
    let firestoreHackathons: any[] = [];
    let firestoreCoursesCount = 0;
    let firestoreSubmissions: any[] = [];
    let firestoreProblemStatementsCount = 0;
    let firestoreOpportunitiesCount = 0;

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("[ADMIN_STATS] Firebase Admin SDK is unavailable; refusing to return synthetic metrics");
      return NextResponse.json({ error: "Admin metrics are temporarily unavailable: Firebase Admin SDK is not configured." }, { status: 503 });
    }

    try {
      const [
        usersSnap,
        companiesSnap,
        projectsSnap,
        hackathonsSnap,
        coursesSnap,
        submissionsSnap,
        problemsSnap,
        opportunitiesSnap,
      ] = await Promise.all([
        adminDb.collection(COLLECTIONS.USERS).get(),
        adminDb.collection(COLLECTIONS.COMPANIES).get(),
        adminDb.collection(COLLECTIONS.PROJECTS).get(),
        adminDb.collection(COLLECTIONS.HACKATHONS).get(),
        adminDb.collection(COLLECTIONS.COURSES).get(),
        adminDb.collection(COLLECTIONS.SUBMISSIONS).get(),
        adminDb.collection(COLLECTIONS.PROBLEM_STATEMENTS).get(),
        adminDb.collection(COLLECTIONS.INTERNSHIPS).get(),
      ]);

      firestoreStudentsCount = usersSnap.docs.filter((d) => d.data().role === "STUDENT").length;
      firestoreCompaniesCount = companiesSnap.size;
      firestoreProjectsCount = projectsSnap.size;
      firestoreHackathons = hackathonsSnap.docs.map((d) => d.data());
      firestoreCoursesCount = coursesSnap.size;
      firestoreSubmissions = submissionsSnap.docs.map((d) => d.data());
      firestoreProblemStatementsCount = problemsSnap.size;
      firestoreOpportunitiesCount = opportunitiesSnap.size;
    } catch (firestoreErr) {
      console.error("Firestore count fetch failed in stats:", firestoreErr);
      return NextResponse.json({ error: "Admin metrics could not be read from Firestore." }, { status: 500 });
    }

    const totalStudents = Math.max(prismaStudentsCount, firestoreStudentsCount);
    const totalCompanies = Math.max(prismaCompaniesCount, firestoreCompaniesCount);
    const totalInternships = Math.max(prismaInternshipsCount, firestoreOpportunitiesCount);
    const totalProjects = Math.max(prismaProjectsCount, firestoreProjectsCount);
    const totalCourses = firestoreCoursesCount;
    const totalProblemStatements = Math.max(prismaProblemStatementsCount, firestoreProblemStatementsCount);
    const totalSubmissions = Math.max(applicationsCount + registrationsCount, firestoreSubmissions.length);
    const pendingSubmissions = firestoreSubmissions.filter((s: any) => s.status === "PENDING" || s.status === "UNDER_REVIEW").length;

    const totalRevenue = payments
      .filter((payment: any) => payment.status === "SUCCESS" || payment.status === "CAPTURED")
      .reduce((acc: number, payment: any) => acc + Number(payment.amount || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        totalInternships,
        totalHackathons: Math.max(prismaHackathons.length, firestoreHackathons.length),
        activeHackathons: prismaHackathons.filter((h: any) => h.status === "ONGOING" || h.status === "ACTIVE").length,
        upcomingHackathons: prismaHackathons.filter((h: any) => h.status === "UPCOMING").length,
        totalProjects,
        totalCourses,
        totalProblemStatements,
        totalSubmissions,
        pendingSubmissions,
        totalRevenue,
        totalOpportunities: firestoreOpportunitiesCount,
      },
      recentUsers,
      recentPayments,
      recentLogs,
    });
  } catch (err: any) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
