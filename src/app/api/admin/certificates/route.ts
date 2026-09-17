import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const typeFilter = searchParams.get("type") || "ALL";
    const statusFilter = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limitCount = parseInt(searchParams.get("limit") || "50", 10);

    const allCerts = await prisma.certificate.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    let filtered = allCerts.map((c: any) => {
      let parsedMetadata: CertificateMetadata | undefined = undefined;
      if (c.metadata) {
        try {
          parsedMetadata = JSON.parse(c.metadata);
        } catch {
          // ignore
        }
      }
      return { ...c, parsedMetadata };
    });

    if (typeFilter !== "ALL") {
      filtered = filtered.filter((c: any) => c.type === typeFilter);
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c: any) => c.status === statusFilter);
    }

    if (search) {
      filtered = filtered.filter((c: any) => {
        const no = (c.certificateNo || "").toLowerCase();
        const sName = (c.studentName || c.student?.name || "").toLowerCase();
        const sEmail = (c.student?.email || "").toLowerCase();
        const event = (c.eventName || "").toLowerCase();
        const title = (c.title || "").toLowerCase();
        return (
          no.includes(search) ||
          sName.includes(search) ||
          sEmail.includes(search) ||
          event.includes(search) ||
          title.includes(search)
        );
      });
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limitCount;
    const paginated = filtered.slice(startIndex, startIndex + limitCount);

    return NextResponse.json({
      success: true,
      count: total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount),
      certificates: paginated,
    });
  } catch (error: any) {
    console.error("GET /api/admin/certificates Error:", error);
    return NextResponse.json({ error: "Failed to fetch admin certificates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized || !session) return errorResponse;

    const body = await req.json();
    const action = body.action || "ISSUE_CERTIFICATE";

    // 1. REVOKE CERTIFICATE ACTION
    if (action === "REVOKE_CERTIFICATE") {
      const { certificateNo, reason } = body;
      if (!certificateNo) {
        return NextResponse.json({ error: "certificateNo is required" }, { status: 400 });
      }

      const cert = await prisma.certificate.findFirst({
        where: { OR: [{ certificateNo }, { id: certificateNo }] },
      });

      if (!cert) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
      }

      let meta: CertificateMetadata | any = {};
      if (cert.metadata) {
        try { meta = JSON.parse(cert.metadata); } catch {}
      }

      meta.revocationReason = reason || "Revoked by Administrator";
      meta.revokedAt = new Date().toISOString();

      const updated = await prisma.certificate.update({
        where: { id: cert.id },
        data: {
          status: "REVOKED",
          metadata: JSON.stringify(meta),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Certificate ${cert.certificateNo} has been officially revoked.`,
        certificate: updated,
      });
    }

    // 2. REISSUE / RESTORE CERTIFICATE ACTION
    if (action === "REISSUE_CERTIFICATE") {
      const { certificateNo } = body;
      if (!certificateNo) {
        return NextResponse.json({ error: "certificateNo is required" }, { status: 400 });
      }

      const cert = await prisma.certificate.findFirst({
        where: { OR: [{ certificateNo }, { id: certificateNo }] },
      });

      if (!cert) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
      }

      let meta: CertificateMetadata | any = {};
      if (cert.metadata) {
        try { meta = JSON.parse(cert.metadata); } catch {}
      }

      delete meta.revocationReason;
      delete meta.revokedAt;
      meta.reissuedAt = new Date().toISOString();

      const updated = await prisma.certificate.update({
        where: { id: cert.id },
        data: {
          status: "VERIFIED",
          metadata: JSON.stringify(meta),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Certificate ${cert.certificateNo} has been reissued and verified.`,
        certificate: updated,
      });
    }

    // 3. ADMIN MANUAL ISSUE CERTIFICATE ACTION
    if (action === "ISSUE_CERTIFICATE") {
      const {
        studentId,
        studentEmail,
        studentName: inputName,
        certificateType = "PARTICIPATION",
        eventName,
        roundNumber,
        winnerPosition,
        internshipTitle,
        companyName,
        department,
        startDate,
        endDate,
        completionDate,
        projectName,
        projectDomain,
        technologies,
        courseName,
        courseProvider,
        duration,
        skills,
      } = body;

      let targetUser: any = null;
      if (studentId) {
        targetUser = await prisma.user.findUnique({ where: { id: studentId } });
      } else if (studentEmail) {
        targetUser = await prisma.user.findUnique({ where: { email: studentEmail.trim().toLowerCase() } });
      }

      const finalStudentId = targetUser?.id || session.userId;
      const finalStudentName = (inputName || targetUser?.name || "Verified Student").trim();

      if (!finalStudentName || finalStudentName.toLowerCase() === "undefined" || finalStudentName.toLowerCase() === "user") {
        return NextResponse.json(
          { error: "A valid, non-blank Student Name is required for certificate issuance." },
          { status: 400 }
        );
      }

      const certificateNo = generateCertificateId(certificateType as CertificateType);
      const verificationCode = generateVerificationCode(certificateNo, finalStudentId);
      const issueDate = new Date();

      const wording = getCertificateWording(certificateType as CertificateType, {
        studentName: finalStudentName,
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
        studentName: finalStudentName,
        studentEmail: targetUser?.email || studentEmail,
        certificateType: certificateType as CertificateType,
        achievementType: wording.achievementSummary,
        organization: "SC TECH",
        eventName: eventName || internshipTitle || courseName || projectName || "SC TECH Certification Track",
        roundNumber: roundNumber || (certificateType === "ROUND_1" ? 1 : certificateType === "ROUND_2" ? 2 : undefined),
        winnerPosition: certificateType === "WINNER" ? (winnerPosition as WinnerPosition) || "Winner" : undefined,
        internshipTitle,
        companyName: companyName || "SC TECH",
        department,
        duration,
        startDate,
        endDate,
        completionDate: completionDate || formatDate(issueDate),
        projectName,
        projectDomain,
        skills: skills || technologies,
        courseName,
        courseProvider,
        verificationCode,
        templateVersion: "2026.1",
        issuedBy: {
          founder: "Charudeshna",
          coFounder: "Sridharan",
        },
      };

      const newCert = await prisma.certificate.create({
        data: {
          certificateNo,
          studentId: finalStudentId,
          studentName: finalStudentName,
          title: wording.headerTitle,
          eventName: eventName || internshipTitle || courseName || projectName || "SC TECH Certification Track",
          type: certificateType,
          issueDate,
          qrCodeData: `${process.env.NEXT_PUBLIC_APP_URL || "https://sctechnology.in"}/verify/${certificateNo}`,
          status: "VERIFIED",
          metadata: JSON.stringify(metadata),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Certificate ${certificateNo} successfully issued to ${finalStudentName}!`,
        certificate: {
          ...newCert,
          parsedMetadata: metadata,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/admin/certificates Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process admin certificate action" }, { status: 500 });
  }
}
