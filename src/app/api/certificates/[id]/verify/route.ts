import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const certNo = decodeURIComponent(params.id);

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ certificateNo: certNo }, { id: certNo }],
      },
      include: {
        student: {
          select: { name: true, email: true },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({
        verified: false,
        error: "Certificate not found or invalid",
      }, { status: 404 });
    }

    return NextResponse.json({
      verified: true,
      certificate: {
        id: certificate.id,
        certificateNo: certificate.certificateNo,
        studentName: certificate.studentName,
        title: certificate.title,
        eventName: certificate.eventName,
        type: certificate.type,
        issueDate: certificate.issueDate,
        status: certificate.status,
        metadata: JSON.parse(certificate.metadata || "{}"),
        issuedBy: "SC TECH Examination & Award Board",
      },
    });
  } catch (error) {
    console.error("Verify Certificate Error:", error);
    return NextResponse.json({ verified: false, error: "Verification failed" }, { status: 500 });
  }
}
