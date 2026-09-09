import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOpportunities, OPPORTUNITY_COLLECTION } from "@/lib/opportunity-pipeline";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

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

    const docRef = doc(db, OPPORTUNITY_COLLECTION, id);
    const updates: any = { updatedAt: serverTimestamp() };

    if (typeof featured === "boolean") updates.featured = featured;
    if (typeof hidden === "boolean") updates.hidden = hidden;
    if (status) updates.status = status;

    await updateDoc(docRef, updates);

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

    const docRef = doc(db, OPPORTUNITY_COLLECTION, id);
    await deleteDoc(docRef);

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
