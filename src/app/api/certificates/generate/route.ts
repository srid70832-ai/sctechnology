import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  CertificateType, 
  WinnerPosition, 
  generateCertificateId, 
  generateVerificationCode, 
  getCertificateWording,
  CertificateMetadata
} from "@/lib/certificate-system";
import { formatDate } from "@/lib/utils";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to claim or generate your certificate." }, { status: 401 });
    }

    // 1. Validate Student Name from Profile
    const studentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { studentProfile: true },
    });

    const rawName = studentUser?.name || session.name || "";
    const cleanName = rawName.trim();

    if (!cleanName || cleanName.toLowerCase() === "user" || cleanName.toLowerCase() === "student" || cleanName.toLowerCase() === "undefined") {
      return NextResponse.json(
        { 
          error: "Please complete your official name in your Student Profile before generating a certificate.",
          requiresProfileCompletion: true,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const certificateType: CertificateType = body.certificateType || "PARTICIPATION";
    const {
      eventId,
      eventName,
      roundNumber,
      winnerPosition,
      internshipId,
      internshipTitle,
      companyName,
      department,
      startDate,
      endDate,
      completionDate,
      projectId,
      projectName,
      projectDomain,
      technologies,
      courseId,
      courseName,
      courseProvider,
      duration,
      skills,
      promotionUrl,
    } = body;

    // 2. Strict Backend Completion & Verification Gating
    const adminDb = getAdminDb();
    let matchingEnrollmentDocId: string | null = null;

    if (certificateType === "PROJECT") {
      const targetProjId = projectId || "";
      const targetProjName = projectName || "";

      if (!targetProjId && !targetProjName) {
        return NextResponse.json({ error: "Project ID or Project Name is required for project certification." }, { status: 400 });
      }

      if (adminDb) {
        const enrSnap = await adminDb.collection("projectEnrollments")
          .where("studentId", "==", session.userId)
          .get();

        let matchingEnrollment: any = null;
        for (const doc of enrSnap.docs) {
          const data = doc.data();
          if (
            (targetProjId && (data.projectId === targetProjId || data.projectSlug === targetProjId || doc.id === targetProjId)) ||
            (targetProjName && data.projectTitle?.toLowerCase() === targetProjName.toLowerCase())
          ) {
            matchingEnrollment = data;
            matchingEnrollmentDocId = doc.id;
            break;
          }
        }

        if (!matchingEnrollment) {
          return NextResponse.json(
            { 
              error: "Certificate is locked. You have not enrolled in this Real-World Project.",
              isLocked: true 
            }, 
            { status: 403 }
          );
        }

        const isCompleted = matchingEnrollment.projectStatus === "COMPLETED";
        const isApproved = matchingEnrollment.evaluation?.certificateApproved === true || matchingEnrollment.evaluation?.status === "APPROVED";

        if (!isCompleted || !isApproved) {
          const currentStatus = matchingEnrollment.projectStatus || "IN_PROGRESS";
          return NextResponse.json(
            { 
              error: `Certificate is locked (Status: ${currentStatus}). You must submit your project deliverables (GitHub repository + live URL) and receive approval from the SC TECH Evaluation Board before generating your certificate.`,
              isLocked: true,
              projectStatus: currentStatus,
            }, 
            { status: 403 }
          );
        }

        if (matchingEnrollment.certificatePromotionRequired && !matchingEnrollment.promotionUrl && !promotionUrl) {
          return NextResponse.json(
            {
              error: "Certificate promotion step required. Please share your project milestone publicly (LinkedIn/Twitter) and submit the link.",
              requiresPromotion: true,
            },
            { status: 400 }
          );
        }
      }
    }

    // 3. Duplicate Prevention: Check if exact certificate record already exists in Prisma or Firestore
    const existingCerts = await prisma.certificate.findMany({
      where: {
        studentId: session.userId,
        type: certificateType,
      },
    });

    // Check specific match by event/internship/course/project/round
    for (const cert of existingCerts) {
      if (!cert.metadata) continue;
      try {
        const meta: CertificateMetadata = JSON.parse(cert.metadata);
        
        let match = false;
        if (certificateType === "ROUND_1" || certificateType === "ROUND_2") {
          if (meta.eventId === eventId && meta.roundNumber === (roundNumber || (certificateType === "ROUND_1" ? 1 : 2))) {
            match = true;
          }
        } else if (certificateType === "PARTICIPATION" || certificateType === "WINNER") {
          if (meta.eventId === eventId && meta.winnerPosition === winnerPosition) {
            match = true;
          }
        } else if (certificateType === "INTERNSHIP") {
          if (meta.internshipId === internshipId || (internshipTitle && meta.internshipTitle === internshipTitle)) {
            match = true;
          }
        } else if (certificateType === "COURSE") {
          if (meta.courseId === courseId || (courseName && meta.courseName === courseName)) {
            match = true;
          }
        } else if (certificateType === "PROJECT") {
          if (meta.projectId === projectId || (projectName && meta.projectName === projectName)) {
            match = true;
          }
        }

        if (match) {
          return NextResponse.json({
            success: true,
            message: "Certificate already issued for this achievement.",
            alreadyIssued: true,
            certificate: {
              ...cert,
              parsedMetadata: meta,
            },
          });
        }
      } catch {
        // ignore
      }
    }

    // 4. Generate Official Unique Certificate Identifier & Cryptographic Code
    const certificateNo = generateCertificateId(certificateType);
    const verificationCode = generateVerificationCode(certificateNo, session.userId);
    const issueDate = new Date();

    const wording = getCertificateWording(certificateType, {
      studentName: cleanName,
      eventName,
      roundNumber,
      winnerPosition,
      internshipTitle,
      companyName,
      startDate,
      endDate,
      projectName,
      projectDomain,
      technologies,
      courseName,
      courseProvider,
      duration,
      completionDate: completionDate || formatDate(issueDate),
    });

    const metadata: CertificateMetadata = {
      studentName: cleanName,
      studentEmail: studentUser?.email || session.email,
      certificateType,
      achievementType: wording.achievementSummary,
      organization: "SC TECH",
      eventId,
      eventName: eventName || "SC TECH National Innovation Challenge 2026",
      roundNumber: roundNumber || (certificateType === "ROUND_1" ? 1 : certificateType === "ROUND_2" ? 2 : undefined),
      winnerPosition: certificateType === "WINNER" ? (winnerPosition as WinnerPosition) || "Winner" : undefined,
      internshipId,
      internshipTitle,
      companyName: companyName || "SC TECH",
      department,
      duration,
      startDate,
      endDate,
      completionDate: completionDate || formatDate(issueDate),
      projectId,
      projectName,
      projectDomain,
      skills: skills || technologies,
      courseId,
      courseName,
      courseProvider,
      verificationCode,
      templateVersion: "2026.1",
      issuedBy: {
        founder: "Charudeshna",
        coFounder: "Sridharan",
      },
    };

    // 5. Save into Prisma Database
    const newCert = await prisma.certificate.create({
      data: {
        certificateNo,
        studentId: session.userId,
        studentName: cleanName,
        title: wording.headerTitle,
        eventName: eventName || internshipTitle || courseName || projectName || "SC TECH Certification Track",
        type: certificateType,
        issueDate,
        qrCodeData: `http://localhost:3000/verify/${certificateNo}`,
        status: "VERIFIED",
        metadata: JSON.stringify(metadata),
      },
    });

    // 6. Save into Firestore Certificates Collection for instant public verification & wallet sync
    if (adminDb) {
      try {
        const firestoreCertData = {
          id: certificateNo,
          certificateNo,
          studentId: session.userId,
          studentName: cleanName,
          title: wording.headerTitle,
          eventName: eventName || internshipTitle || courseName || projectName || "SC TECH Certification Track",
          type: certificateType,
          issueDate: issueDate.toISOString(),
          status: "VERIFIED",
          metadata: JSON.stringify(metadata),
          parsedMetadata: metadata,
          verificationCode,
          createdAt: issueDate.toISOString(),
          updatedAt: issueDate.toISOString(),
        };

        await adminDb.collection("certificates").doc(certificateNo).set(firestoreCertData, { merge: true });

        // Update Project Enrollment with Certificate Number & Promotion URL
        if (matchingEnrollmentDocId) {
          const updateData: any = {
            certificateId: certificateNo,
            certificateIssuedAt: issueDate.toISOString(),
            updatedAt: issueDate.toISOString(),
          };
          if (promotionUrl) {
            updateData.promotionUrl = promotionUrl;
            updateData.promotionSubmittedAt = issueDate.toISOString();
          }
          await adminDb.collection("projectEnrollments").doc(matchingEnrollmentDocId).set(updateData, { merge: true });
        }
      } catch (fsErr) {
        console.warn("Notice: Firestore certificate mirror write error:", fsErr);
      }
    }

    // 7. Trigger In-App Notification
    try {
      await prisma.notification.create({
        data: {
          userId: session.userId,
          title: "New Certificate Unlocked 🎓",
          message: `Congratulations ${cleanName}! Your official "${wording.headerTitle}" has been issued (ID: ${certificateNo}).`,
          type: "CERTIFICATE",
          link: "/my-certificates",
        },
      });
    } catch {
      // notification log only
    }

    return NextResponse.json({
      success: true,
      message: "Certificate successfully generated and cryptographically verified!",
      certificate: {
        ...newCert,
        parsedMetadata: metadata,
      },
    });
  } catch (error: any) {
    console.error("POST /api/certificates/generate Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate certificate. Please try again." },
      { status: 500 }
    );
  }
}
