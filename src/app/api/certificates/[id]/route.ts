import { NextResponse } from "next/server";
import { findCertificateByNo } from "@/lib/certificate-system";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const certId = decodeURIComponent(params.id).trim();
    const cert = await findCertificateByNo(certId);

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      certificate: cert,
    });
  } catch (error: any) {
    console.error("GET /api/certificates/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificate details" },
      { status: 500 }
    );
  }
}
