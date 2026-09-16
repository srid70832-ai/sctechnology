import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { 
  discoverDailyInternships, 
  getDiscoveryTelemetry, 
  loadDiscoveredInternships,
  saveDiscoveredInternships,
  DiscoveredInternship, 
  VERIFIED_REAL_INTERNSHIP_POOL, 
  generateInternshipDedupKey 
} from "@/lib/gemini-discovery";
import { removeUndefinedValues } from "@/lib/firestore";
import { notifyIndexNow, publicContentUrl } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "ALL";
    const searchQuery = (searchParams.get("search") || "").toLowerCase().trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limitCount = parseInt(searchParams.get("limit") || "50", 10);

    const items: DiscoveredInternship[] = loadDiscoveredInternships();

    // Filter items
    let filtered = items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (searchQuery) {
        const matchTitle = item.title?.toLowerCase().includes(searchQuery);
        const matchComp = item.company?.toLowerCase().includes(searchQuery);
        const matchSkills = item.skills?.some((s) => s.toLowerCase().includes(searchQuery));
        if (!matchTitle && !matchComp && !matchSkills) return false;
      }
      return true;
    });

    // Sort newest first
    filtered.sort((a, b) => new Date(b.fetchedAt || 0).getTime() - new Date(a.fetchedAt || 0).getTime());

    // Pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limitCount;
    const paginated = filtered.slice(startIndex, startIndex + limitCount);

    // Get telemetry
    const telemetry = await getDiscoveryTelemetry();

    return NextResponse.json({
      success: true,
      internships: paginated,
      total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount),
      telemetry,
    });
  } catch (error: any) {
    console.error("GET /api/admin/internships/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch discovered internships" },
      { status: 500 }
    );
  }
}

/**
 * Admin "Fetch Internships Now" trigger
 */
export async function POST(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    // Discover 5 real internships
    const result = await discoverDailyInternships(5);
    const telemetry = await getDiscoveryTelemetry();

    return NextResponse.json({
      success: true,
      message: result.message,
      added: result.added,
      skippedDuplicates: result.skippedDuplicates,
      items: result.items,
      telemetry,
    });
  } catch (error: any) {
    console.error("POST /api/admin/internships/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to execute manual internship discovery" },
      { status: 500 }
    );
  }
}

/**
 * Admin updates: Approve, Reject, Feature, Edit, Publish/Unpublish
 */
export async function PATCH(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const { id, action, title, description, skills, stipend, deadline, featured, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Internship ID is required" }, { status: 400 });
    }

    const docRef = doc(db, "internships", id);
    const updates: any = { updatedAt: serverTimestamp() };

    if (action === "APPROVE") {
      updates.status = "PUBLISHED";
      updates.isActive = true;
      updates.verificationStatus = "VERIFIED";
      updates.approvedBy = session?.userId;
      updates.publishedAt = new Date().toISOString();
    } else if (action === "REJECT") {
      updates.status = "REJECTED";
      updates.isActive = false;
      updates.verificationStatus = "REJECTED";
    } else if (action === "UNPUBLISH") {
      updates.status = "PENDING_REVIEW";
      updates.isActive = false;
    } else if (action === "FEATURE") {
      updates.featured = Boolean(featured);
    }

    if (title) updates.title = String(title).trim();
    if (description) updates.description = String(description).trim();
    if (skills) updates.skills = skills;
    if (stipend !== undefined) updates.stipend = stipend;
    if (deadline !== undefined) updates.deadline = deadline;
    if (status) updates.status = status;

    // Update persistent store
    const items = loadDiscoveredInternships();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      if (updates.status) items[idx].status = updates.status;
      if (updates.isActive !== undefined) items[idx].isActive = updates.isActive;
      if (updates.verificationStatus) items[idx].verificationStatus = updates.verificationStatus;
      if (updates.featured !== undefined) items[idx].featured = updates.featured;
      if (updates.title) items[idx].title = updates.title;
      if (updates.description) items[idx].description = updates.description;
      if (updates.skills) items[idx].skills = updates.skills;
      if (updates.stipend !== undefined) items[idx].stipend = updates.stipend;
      if (updates.deadline !== undefined) items[idx].deadline = updates.deadline;
      saveDiscoveredInternships(items);
    }

    await updateDoc(docRef, removeUndefinedValues(updates)).catch(() => null);

    if (updates.status === "PUBLISHED" || action === "UNPUBLISH") {
      notifyIndexNow(publicContentUrl("internships", id));
    }

    return NextResponse.json({
      success: true,
      message: `Internship ${id} updated successfully.`,
      updates,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/internships/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update internship" },
      { status: 500 }
    );
  }
}

/**
 * Admin delete
 */
export async function DELETE(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Internship ID is required" }, { status: 400 });
    }

    // Delete from persistent store
    const items = loadDiscoveredInternships();
    const filtered = items.filter((i) => i.id !== id);
    saveDiscoveredInternships(filtered);

    await deleteDoc(doc(db, "internships", id)).catch(() => null);
    notifyIndexNow(publicContentUrl("internships", id));

    return NextResponse.json({
      success: true,
      message: "Internship deleted successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/internships/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete internship" },
      { status: 500 }
    );
  }
}
