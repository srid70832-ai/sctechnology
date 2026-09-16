import { NextRequest, NextResponse } from "next/server";
import { adminUpdateConnectionStatus } from "@/lib/idea-link-service";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;
    const body = await req.json();
    const { connectionId, status, adminNotes, adminName } = body;

    if (!connectionId || !status) {
      return NextResponse.json({ error: "connectionId and status are required." }, { status: 400 });
    }

    const connection = await adminUpdateConnectionStatus({
      connectionId,
      status,
      adminNotes,
      adminId: session?.userId,
      adminName: adminName || session?.name || "SC TECH Admin",
    });

    return NextResponse.json({
      success: true,
      message: `Connection status updated to ${status}.`,
      connection,
    });
  } catch (err: any) {
    console.error("POST /api/admin/idea-link/connection-status error:", err);
    return NextResponse.json({ error: err.message || "Failed to update connection status" }, { status: 500 });
  }
}
