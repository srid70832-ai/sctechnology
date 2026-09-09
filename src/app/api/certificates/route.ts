import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { findStudentCertificates } from "@/lib/certificate-system";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const certificates = await findStudentCertificates(session.userId);
    return NextResponse.json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    console.error("GET Certificates Error:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
