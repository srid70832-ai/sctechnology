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

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error("[ADMIN_STUDENTS] Firebase Admin SDK is unavailable; refusing to return an empty directory");
      return NextResponse.json(
        { success: false, error: "Student directory is temporarily unavailable: Firebase Admin SDK is not configured.", students: [], total: 0 },
        { status: 503 }
      );
    }

    // 1. Fetch from Firestore students collection
    const firestoreStudents: any[] = [];
    try {
      const studentSnapshot = await adminDb.collection("students").get();
      studentSnapshot.forEach((d) => {
        firestoreStudents.push({ id: d.id, uid: d.id, ...d.data() });
      });
    } catch (fsErr) {
      console.warn("[ADMIN_STUDENTS] Error fetching students collection:", fsErr);
    }

    // 2. Fetch from Firestore users collection (to include registered students who haven't completed onboarding)
    try {
      const userSnapshot = await adminDb.collection("users").get();
      userSnapshot.forEach((d) => {
        const udata = d.data();
        if (udata.role === "STUDENT" || !udata.role) {
          firestoreStudents.push({
            id: d.id,
            uid: d.id,
            email: udata.email,
            fullName: udata.name || udata.displayName,
            role: udata.role || "STUDENT",
            photoURL: udata.photoURL || udata.avatarUrl,
            createdAt: udata.createdAt,
            ...udata,
          });
        }
      });
    } catch (uErr) {
      console.warn("[ADMIN_STUDENTS] Error fetching users collection:", uErr);
    }

    // 3. Fetch from Prisma in a safe try/catch block
    let prismaStudents: any[] = [];
    try {
      prismaStudents = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
          studentProfile: true,
          hackathonRegistrations: { select: { id: true, hackathonId: true, status: true } },
          subscriptions: { where: { status: "ACTIVE" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (prismaErr) {
      console.warn("[ADMIN_STUDENTS] Prisma query notice (falling back to Firestore):", prismaErr);
    }

    // Merge by email or UID
    const mergedMap = new Map<string, any>();

    for (const ps of prismaStudents) {
      const key = (ps.email?.toLowerCase().trim()) || ps.firebaseUid || ps.id;
      if (!key) continue;
      mergedMap.set(key, {
        id: ps.id,
        uid: ps.firebaseUid || ps.id,
        email: ps.email,
        name: ps.name || ps.studentProfile?.username || "Student",
        displayName: ps.name || "Student",
        college: ps.studentProfile?.college || "Profile not completed",
        department: ps.studentProfile?.department || "Profile not completed",
        year: ps.studentProfile?.year || "Profile not completed",
        skills: ps.studentProfile?.skills
          ? ps.studentProfile.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        githubUrl: ps.studentProfile?.github || null,
        linkedinUrl: ps.studentProfile?.linkedin || null,
        portfolioUrl: ps.studentProfile?.portfolio || null,
        resumeUrl: ps.studentProfile?.resumeUrl || null,
        profileScore: ps.studentProfile?.profileScore || 0,
        profileCompletion: ps.studentProfile?.profileScore || 0,
        photoURL: ps.avatarUrl || null,
        hackathonsCount: ps.hackathonRegistrations?.length || 0,
        plan: ps.subscriptions?.[0] ? "PLUS / PRO" : "Free Starter",
        createdAt: ps.createdAt,
      });
    }

    for (const fs of firestoreStudents) {
      const key = (fs.email?.toLowerCase().trim()) || fs.uid || fs.id;
      if (!key) continue;

      const rawSkills = fs.technicalSkills || fs.skills;
      const skillsArray = Array.isArray(rawSkills)
        ? rawSkills
        : typeof rawSkills === "string"
        ? rawSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        mergedMap.set(key, {
          ...existing,
          uid: fs.uid || existing.uid,
          name: fs.fullName || fs.displayName || fs.name || existing.name,
          displayName: fs.fullName || fs.displayName || fs.name || existing.displayName,
          college: fs.college || existing.college,
          department: fs.department || existing.department,
          year: fs.yearOfStudy || fs.year || existing.year,
          skills: skillsArray.length > 0 ? skillsArray : existing.skills,
          githubUrl: fs.githubUrl || fs.github || existing.githubUrl,
          linkedinUrl: fs.linkedinUrl || fs.linkedin || existing.linkedinUrl,
          portfolioUrl: fs.portfolioUrl || fs.portfolio || existing.portfolioUrl,
          resumeUrl: fs.resumeUrl || fs.resume || existing.resumeUrl,
          photoURL: fs.photoURL || fs.avatarUrl || existing.photoURL,
          profileScore: fs.profileCompletionPercentage || fs.profileScore || existing.profileScore,
          profileCompletion: fs.profileCompletionPercentage || fs.profileScore || existing.profileCompletion,
          profileCompleted: Boolean(fs.profileCompleted || existing.profileCompleted),
        });
      } else {
        mergedMap.set(key, {
          id: fs.uid || fs.id,
          uid: fs.uid || fs.id,
          email: fs.email || "No email provided",
          name: fs.fullName || fs.displayName || fs.name || "Student",
          displayName: fs.fullName || fs.displayName || fs.name || "Student",
          college: fs.college || "Profile not completed",
          department: fs.department || "Profile not completed",
          year: fs.yearOfStudy || fs.year || "Profile not completed",
          skills: skillsArray,
          githubUrl: fs.githubUrl || fs.github || null,
          linkedinUrl: fs.linkedinUrl || fs.linkedin || null,
          portfolioUrl: fs.portfolioUrl || fs.portfolio || null,
          resumeUrl: fs.resumeUrl || fs.resume || null,
          photoURL: fs.photoURL || fs.avatarUrl || null,
          profileScore: fs.profileCompletionPercentage || fs.profileScore || 0,
          profileCompletion: fs.profileCompletionPercentage || fs.profileScore || 0,
          hackathonsCount: fs.hackathonsCount || 0,
          plan: fs.plan || "Free Starter",
          createdAt: fs.createdAt || null,
        });
      }
    }

    let students = Array.from(mergedMap.values());

    if (search) {
      students = students.filter(
        (s) =>
          s.name?.toLowerCase().includes(search) ||
          s.displayName?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.college?.toLowerCase().includes(search) ||
          s.department?.toLowerCase().includes(search) ||
          (Array.isArray(s.skills) && s.skills.some((sk: string) => typeof sk === "string" && sk.toLowerCase().includes(search)))
      );
    }

    return NextResponse.json({
      success: true,
      students,
      total: students.length,
      count: students.length,
    });
  } catch (error: any) {
    console.error("Admin GET Students Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch students", students: [], total: 0 },
      { status: 500 }
    );
  }
}
