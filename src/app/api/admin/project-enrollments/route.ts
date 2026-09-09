import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { ProjectEnrollment, getRemainingDays } from "@/lib/project-lifecycle-service";

export async function GET(req: NextRequest) {
  try {
    const snap = await getDocs(collection(db, "projectEnrollments"));
    const list: ProjectEnrollment[] = [];
    const now = Date.now();

    for (const d of snap.docs) {
      const enr = d.data() as ProjectEnrollment;
      
      // Real-time server auto-lock check on read
      const dead = new Date(enr.deadline).getTime();
      if (
        now > dead && 
        !["SUBMITTED", "EVALUATION_PENDING", "UNDER_REVIEW", "COMPLETED", "LOCKED"].includes(enr.projectStatus)
      ) {
        enr.projectStatus = "LOCKED";
        await updateDoc(doc(db, "projectEnrollments", enr.id), {
          projectStatus: "LOCKED",
          updatedAt: new Date().toISOString(),
        });
      }

      list.push({
        ...enr,
        remainingDays: getRemainingDays(enr.deadline),
      });
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      enrollments: list,
    });
  } catch (err: any) {
    console.error("GET /api/admin/project-enrollments error:", err);
    return NextResponse.json({ error: "Failed to fetch project enrollments" }, { status: 500 });
  }
}
