import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    // 1. Fetch from Firestore students collection
    const firestoreStudents: any[] = [];
    try {
      const colRef = collection(db, COLLECTIONS.STUDENTS);
      const snap = await getDocs(colRef);
      snap.forEach((d) => {
        firestoreStudents.push({ id: d.id, ...d.data() });
      });
    } catch (fsErr) {
      console.warn("Error fetching Firestore students:", fsErr);
    }

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
        name: ps.name,
        college: ps.studentProfile?.college || "Not Specified",
        department: ps.studentProfile?.department || "Not Specified",
        year: ps.studentProfile?.year || "Not Specified",
        skills: ps.studentProfile?.skills ? ps.studentProfile.skills.split(",") : [],
        githubUrl: ps.studentProfile?.github || null,
        linkedinUrl: ps.studentProfile?.linkedin || null,
        resumeUrl: ps.studentProfile?.resumeUrl || null,
        profileScore: ps.studentProfile?.profileScore || 85,
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
          name: fs.fullName || "Student",
          college: fs.college || "Not Specified",
          department: fs.department || "Not Specified",
          year: fs.yearOfStudy || fs.year || "Not Specified",
          skills: fs.technicalSkills || fs.skills || [],
          githubUrl: fs.githubUrl || null,
          linkedinUrl: fs.linkedinUrl || null,
          portfolioUrl: fs.portfolioUrl || null,
          resumeUrl: fs.resumeUrl || null,
          profileScore: fs.profileCompletionPercentage || 70,
          hackathonsCount: 0,
          plan: "Free Starter",
          createdAt: fs.createdAt || new Date(),
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
