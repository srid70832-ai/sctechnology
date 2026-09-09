import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const [
      prismaStudentsCount,
      prismaCompaniesCount,
      prismaInternshipsCount,
      prismaHackathons,
      prismaProblemStatementsCount,
      prismaProjectsCount,
      applicationsCount,
      registrationsCount,
      payments,
      recentUsers,
      recentPayments,
      recentLogs,
    ] = await Promise.all([
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

    // Query Firestore collections if available
    let firestoreStudentsCount = 0;
    let firestoreCompaniesCount = 0;
    let firestoreProjectsCount = 0;
    let firestoreHackathons: any[] = [];
    let firestoreCoursesCount = 0;
    let firestoreSubmissions: any[] = [];
    let firestoreProblemStatementsCount = 0;
    let firestoreOpportunitiesCount = 0;

    try {
      const [studSnap, compSnap, projSnap, hackSnap, courseSnap, subSnap, probSnap, oppSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.STUDENTS)),
        getDocs(collection(db, COLLECTIONS.COMPANIES)),
        getDocs(collection(db, COLLECTIONS.PROJECTS)),
        getDocs(collection(db, COLLECTIONS.HACKATHONS)),
        getDocs(collection(db, COLLECTIONS.COURSES)),
        getDocs(collection(db, COLLECTIONS.SUBMISSIONS)),
        getDocs(collection(db, "problemStatements")),
        getDocs(collection(db, "opportunities")),
      ]);

      firestoreStudentsCount = studSnap.size;
      firestoreCompaniesCount = compSnap.size;
      firestoreProjectsCount = projSnap.size;
      hackSnap.forEach((d) => firestoreHackathons.push(d.data()));
      firestoreCoursesCount = courseSnap.size;
      subSnap.forEach((d) => firestoreSubmissions.push(d.data()));
      firestoreProblemStatementsCount = probSnap.size;
      firestoreOpportunitiesCount = oppSnap.size;
    } catch (fsErr) {
      console.warn("Firestore stats query partial notice:", fsErr);
    }

    const totalStudents = Math.max(prismaStudentsCount, firestoreStudentsCount);
    const totalCompanies = Math.max(prismaCompaniesCount, firestoreCompaniesCount);
    const totalProjects = Math.max(prismaProjectsCount, firestoreProjectsCount);
    const totalCourses = firestoreCoursesCount;
    const totalProblemStatements = Math.max(prismaProblemStatementsCount, firestoreProblemStatementsCount);
    const totalOpportunities = firestoreOpportunitiesCount;

    // Calculate hackathons breakdown
    const now = new Date();
    let activeHackathons = 0;
    let upcomingHackathons = 0;
    let completedHackathons = 0;

    if (firestoreHackathons.length > 0) {
      firestoreHackathons.forEach((h) => {
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        if (h.status === "CLOSED" || now > end) {
          completedHackathons++;
        } else if (now < start) {
          upcomingHackathons++;
        } else {
          activeHackathons++;
        }
      });
    } else {
      prismaHackathons.forEach((h) => {
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        if (h.status === "COMPLETED" || now > end) {
          completedHackathons++;
        } else if (now < start) {
          upcomingHackathons++;
        } else {
          activeHackathons++;
        }
      });
    }

    const totalHackathons = Math.max(prismaHackathons.length, firestoreHackathons.length);
    const totalSubmissions = firestoreSubmissions.length;
    const pendingSubmissions = firestoreSubmissions.filter((s) => s.status === "PENDING" || s.status === "UNDER_REVIEW").length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalStudents,
        totalCompanies,
        totalHRs: totalCompanies,
        totalInternships: prismaInternshipsCount,
        totalApplications: applicationsCount,
        totalProjects,
        totalHackathons,
        activeHackathons,
        upcomingHackathons,
        completedHackathons,
        totalCourses,
        totalProblemStatements,
        totalOpportunities,
        totalRegistrations: registrationsCount,
        totalSubmissions,
        pendingSubmissions,
        totalRevenue,
      },
      recentUsers,
      recentPayments,
      recentLogs,
    });
  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch admin statistics" }, { status: 500 });
  }
}
