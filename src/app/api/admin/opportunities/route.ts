import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOpportunities, OPPORTUNITY_COLLECTION } from "@/lib/opportunity-pipeline";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limitCount = parseInt(searchParams.get("limit") || "50", 10);
    const type = (searchParams.get("type") || "ALL") as any;
    const sourceType = (searchParams.get("sourceType") || "ALL") as any;
    const search = searchParams.get("search") || "";

    const data = await getOpportunities({
      page,
      limitCount,
      type,
      sourceType,
      search,
      includeHidden: true, // Admin can see hidden and expired items
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("GET /api/admin/opportunities Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch admin opportunities" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const { id, featured, hidden, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not initialized" }, { status: 500 });
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (typeof featured === "boolean") updates.featured = featured;
    if (typeof hidden === "boolean") updates.hidden = hidden;
    if (status) updates.status = status;

    await adminDb.collection(OPPORTUNITY_COLLECTION).doc(id).update(updates);

    return NextResponse.json({
      success: true,
      message: "Opportunity updated successfully",
      updated: { id, featured, hidden, status },
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/opportunities Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not initialized" }, { status: 500 });
    }

    await adminDb.collection(OPPORTUNITY_COLLECTION).doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Opportunity deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/opportunities Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
