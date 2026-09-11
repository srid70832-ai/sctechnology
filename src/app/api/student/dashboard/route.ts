import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      user,
      profile,
      activeSubscription,
      projectCount,
      completedProjectCount,
      certificateCount,
      hackathonCount,
      hrSessionCount,
      upcomingHackathon,
      upcomingHRSession,
      recommendedInternships,
      notifications,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      }),
      prisma.studentProfile.findUnique({
        where: { userId: session.userId },
      }),
      prisma.subscription.findFirst({
        where: { userId: session.userId, status: "ACTIVE", endDate: { gte: new Date() } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count(),
      prisma.projectDownloadLog.count({ where: { userId: session.userId } }),
      prisma.certificate.count({ where: { studentId: session.userId } }),
      prisma.hackathonRegistration.count({ where: { userId: session.userId } }),
      prisma.sessionRegistration.count({ where: { userId: session.userId } }),
      prisma.hackathon.findFirst({
        where: { status: "UPCOMING" },
        orderBy: { startDate: "asc" },
      }),
      prisma.hRSession.findFirst({
        where: { status: "UPCOMING" },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.internship.findMany({
        where: { status: "ACTIVE" },
        include: { company: true },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    let profileCompletion = 25;
    if (profile?.mobile) profileCompletion += 15;
    if (profile?.skills) profileCompletion += 20;
    if (profile?.resumeUrl) profileCompletion += 20;
    if (profile?.github || profile?.linkedin) profileCompletion += 20;
    profileCompletion = Math.min(100, profileCompletion);

    const eventsList = [
      upcomingHackathon && {
        id: upcomingHackathon.id,
        title: upcomingHackathon.title,
        date: upcomingHackathon.startDate,
        type: "Hackathon",
        link: `/hackathons/${upcomingHackathon.slug}`,
      },
      upcomingHRSession && {
        id: upcomingHRSession.id,
        title: upcomingHRSession.title,
        date: upcomingHRSession.scheduledAt,
        type: "HR Session",
        link: `/hr-sessions`,
      },
    ].filter(Boolean);

    return NextResponse.json({
      user: {
        name: user?.name || session.name,
        email: user?.email || session.email,
        avatarUrl: user?.avatarUrl,
        role: user?.role,
      },
      stats: {
        activePlan: activeSubscription ? activeSubscription.plan.name : "Free Starter",
        planValidUntil: activeSubscription ? activeSubscription.endDate : null,
        totalProjects: projectCount,
        completedProjects: completedProjectCount,
        totalCertificates: certificateCount,
        totalHackathons: hackathonCount,
        totalHRSessions: hrSessionCount,
      },
      events: eventsList,
      recommendedInternships: recommendedInternships.map((item: any) => ({
        id: item.id,
        title: item.title,
        companyName: item.company.name,
        companyLogo: item.company.logoUrl,
        location: item.location,
        mode: item.mode,
        duration: item.duration,
        stipend: item.stipend,
        slug: item.slug,
      })),
      progress: {
        profileCompletion,
        hasProfileDetails: !!profile?.college,
        hasSkills: !!profile?.skills,
        hasResume: !!profile?.resumeUrl,
        hasProjects: completedProjectCount > 0,
      },
      notifications,
      unreadNotificationsCount: notifications.filter((n: any) => !n.isRead).length,
    });
  } catch (error) {
    console.error("Student Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
