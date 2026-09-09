import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { SubmissionItem, isDeadlinePassed } from "@/lib/platform-models";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAuth(req);
    if (!authorized || !session) return errorResponse;

    const colRef = collection(db, COLLECTIONS.SUBMISSIONS);
    const q = query(
      colRef,
      where("studentId", "==", session.userId),
      orderBy("submittedAt", "desc")
    );

    let snap;
    try {
      snap = await getDocs(q);
    } catch {
      // Fallback query without orderBy if index is building
      const fallbackQ = query(colRef, where("studentId", "==", session.userId));
      snap = await getDocs(fallbackQ);
    }

    const submissions: SubmissionItem[] = [];
    snap.forEach((d) => {
      submissions.push({ id: d.id, ...(d.data() as any) });
    });

    return NextResponse.json({ success: true, count: submissions.length, submissions });
  } catch (error: any) {
    console.error("GET Student Submissions Error:", error);
    return NextResponse.json({ error: "Failed to fetch your submissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAuth(req);
    if (!authorized || !session) return errorResponse;

    const body = await req.json();
    const {
      targetType, // "PROJECT" | "HACKATHON"
      targetId,
      targetTitle,
      githubUrl,
      liveUrl,
      demoVideoUrl,
      description,
      techStack,
      notes,
    } = body;

    if (!targetId || !githubUrl || !description) {
      return NextResponse.json(
        { error: "Target ID, GitHub URL, and description are required." },
        { status: 400 }
      );
    }

    // =========================================================================
    // CRITICAL REQUIREMENT: STRICT SERVER-SIDE DEADLINE ENFORCEMENT
    // =========================================================================
    let targetDeadline: string | Date | null = null;
    let foundTitle = targetTitle || "Project / Challenge";

    if (targetType === "PROJECT") {
      const projSnap = await getDoc(doc(db, COLLECTIONS.PROJECTS, targetId));
      if (projSnap.exists()) {
        const projData = projSnap.data();
        targetDeadline = projData?.deadline || null;
        foundTitle = projData?.title || foundTitle;
      }
    } else if (targetType === "HACKATHON") {
      const hackSnap = await getDoc(doc(db, COLLECTIONS.HACKATHONS, targetId));
      if (hackSnap.exists()) {
        const hackData = hackSnap.data();
        targetDeadline = hackData?.endDate || hackData?.registrationDeadline || null;
        foundTitle = hackData?.title || foundTitle;
      } else {
        // Check prisma
        const prismaHack = await prisma.hackathon.findUnique({ where: { id: targetId } });
        if (prismaHack) {
          targetDeadline = prismaHack.endDate;
          foundTitle = prismaHack.title;
        }
      }
    }

    if (targetDeadline && isDeadlinePassed(targetDeadline)) {
      return NextResponse.json(
        { 
          error: "Submission Closed 🔒 The deadline for this submission has passed. Late submissions are not accepted.",
          deadlinePassed: true,
        },
        { status: 400 }
      );
    }

    const toArray = (input: any) => {
      if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
      if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const submissionId = `sub-${session.userId.slice(-6)}-${targetId.slice(-6)}-${Date.now().toString().slice(-4)}`;
    const subRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);

    const payload: Partial<SubmissionItem> = {
      id: submissionId,
      targetType: targetType || "PROJECT",
      targetId,
      targetTitle: foundTitle,
      studentId: session.userId,
      studentName: session.name,
      studentEmail: session.email,
      githubUrl: String(githubUrl).trim(),
      liveUrl: liveUrl ? String(liveUrl).trim() : null,
      demoVideoUrl: demoVideoUrl ? String(demoVideoUrl).trim() : null,
      description: String(description).trim(),
      techStack: toArray(techStack),
      notes: notes ? String(notes).trim() : null,
      submissionMethod: "WEBSITE",
      status: "PENDING",
      submittedAt: serverTimestamp(),
    };

    await setDoc(subRef, removeUndefinedValues(payload));

    return NextResponse.json({
      success: true,
      message: "Project successfully submitted for evaluation!",
      submissionId,
    });
  } catch (error: any) {
    console.error("POST Submission Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to submit project" }, { status: 500 });
  }
}
