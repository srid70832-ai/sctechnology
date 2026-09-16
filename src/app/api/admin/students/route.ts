import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    // 1. Fetch from Firestore students collection
    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("[ADMIN_STUDENTS] Firebase Admin SDK is unavailable; refusing to return an empty directory");
      return NextResponse.json({ error: "Student directory is temporarily unavailable: Firebase Admin SDK is not configured." }, { status: 503 });
    }

    const firestoreStudents: any[] = [];
    const studentSnapshot = await adminDb.collection("students").get();
    studentSnapshot.forEach((d) => firestoreStudents.push({ id: d.id, ...d.data() }));

    // 2. Fetch from Prisma
    const prismaStudents = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        studentProfile: true,
        hackathonRegistrations: { select: { id: true, hackathonId: true, status: true } },
        subscriptions: { where: { status: "ACTIVE" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    // Merge by email / uid
    const mergedMap = new Map<string, any>();

    for (const ps of prismaStudents) {
      const key = ps.email?.toLowerCase();
      mergedMap.set(key, {
        id: ps.id,
        uid: ps.firebaseUid || ps.id,
        email: ps.email,
          name: ps.name || "Profile not completed",
          college: ps.studentProfile?.college || "Profile not completed",
          department: ps.studentProfile?.department || "Profile not completed",
          year: ps.studentProfile?.year || "Profile not completed",
        skills: ps.studentProfile?.skills ? ps.studentProfile.skills.split(",") : [],
        githubUrl: ps.studentProfile?.github || null,
        linkedinUrl: ps.studentProfile?.linkedin || null,
        resumeUrl: ps.studentProfile?.resumeUrl || null,
          profileScore: ps.studentProfile?.profileScore || 0,
        hackathonsCount: ps.hackathonRegistrations.length,
        plan: ps.subscriptions[0] ? "PLUS / PRO" : "Free Starter",
        createdAt: ps.createdAt,
      });
    }

    for (const fs of firestoreStudents) {
      const key = fs.email?.toLowerCase();
      if (key && mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        mergedMap.set(key, {
          ...existing,
          uid: fs.uid || existing.uid,
          name: fs.fullName || existing.name,
          college: fs.college || existing.college,
          department: fs.department || existing.department,
          year: fs.yearOfStudy || fs.year || existing.year,
          skills: fs.technicalSkills || fs.skills || existing.skills,
          githubUrl: fs.githubUrl || existing.githubUrl,
          linkedinUrl: fs.linkedinUrl || existing.linkedinUrl,
          portfolioUrl: fs.portfolioUrl || null,
          resumeUrl: fs.resumeUrl || existing.resumeUrl,
          profileCompleted: Boolean(fs.profileCompleted),
        });
      } else if (key) {
        mergedMap.set(key, {
          id: fs.uid,
          uid: fs.uid,
          email: fs.email,
          name: fs.fullName || "Profile not completed",
          college: fs.college || "Profile not completed",
          department: fs.department || "Profile not completed",
          year: fs.yearOfStudy || fs.year || "Profile not completed",
          skills: fs.technicalSkills || fs.skills || [],
          githubUrl: fs.githubUrl || null,
          linkedinUrl: fs.linkedinUrl || null,
          portfolioUrl: fs.portfolioUrl || null,
          resumeUrl: fs.resumeUrl || null,
          profileScore: fs.profileCompletionPercentage || 0,
          hackathonsCount: 0,
          plan: "Free Starter",
          createdAt: fs.createdAt || null,
        });
      }
    }

    let students = Array.from(mergedMap.values());

    if (search) {
      students = students.filter(
        (s) =>
          s.name?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.college?.toLowerCase().includes(search) ||
          s.department?.toLowerCase().includes(search) ||
          s.skills?.some((sk: string) => sk.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error: any) {
    console.error("Admin GET Students Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch students" }, { status: 500 });
  }
}
