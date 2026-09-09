import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { 
  discoverDailyCourses, 
  getDiscoveryTelemetry, 
  loadDiscoveredCourses,
  saveDiscoveredCourses,
  DiscoveredCourse, 
  VERIFIED_REAL_COURSE_POOL, 
  generateCourseDedupKey 
} from "@/lib/gemini-discovery";
import { removeUndefinedValues } from "@/lib/firestore";

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

    const items: DiscoveredCourse[] = loadDiscoveredCourses();

    // Filter items
    let filtered = items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (searchQuery) {
        const matchTitle = item.title?.toLowerCase().includes(searchQuery);
        const matchProv = item.provider?.toLowerCase().includes(searchQuery);
        const matchSkills = item.skills?.some((s) => s.toLowerCase().includes(searchQuery));
        if (!matchTitle && !matchProv && !matchSkills) return false;
      }
      return true;
    });

    filtered.sort((a, b) => new Date(b.fetchedAt || 0).getTime() - new Date(a.fetchedAt || 0).getTime());

    const total = filtered.length;
    const startIndex = (page - 1) * limitCount;
    const paginated = filtered.slice(startIndex, startIndex + limitCount);

    const telemetry = await getDiscoveryTelemetry();

    return NextResponse.json({
      success: true,
      courses: paginated,
      total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount),
      telemetry,
    });
  } catch (error: any) {
    console.error("GET /api/admin/courses/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch discovered courses" },
      { status: 500 }
    );
  }
}

/**
 * Admin "Fetch Courses Now" trigger
 */
export async function POST(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    // Discover 3 real online courses
    const result = await discoverDailyCourses(3);
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
    console.error("POST /api/admin/courses/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to execute manual course discovery" },
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
    const { id, action, title, description, skills, level, isFree, price, featured, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const docRef = doc(db, "courses", id);
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
    if (level) updates.level = level;
    if (isFree !== undefined) updates.isFree = isFree;
    if (price !== undefined) updates.price = price;
    if (status) updates.status = status;

    // Update persistent store
    const items = loadDiscoveredCourses();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      if (updates.status) items[idx].status = updates.status;
      if (updates.isActive !== undefined) items[idx].isActive = updates.isActive;
      if (updates.verificationStatus) items[idx].verificationStatus = updates.verificationStatus;
      if (updates.featured !== undefined) items[idx].featured = updates.featured;
      if (updates.title) items[idx].title = updates.title;
      if (updates.description) items[idx].description = updates.description;
      if (updates.skills) items[idx].skills = updates.skills;
      if (updates.level) items[idx].level = updates.level;
      if (updates.isFree !== undefined) items[idx].isFree = updates.isFree;
      if (updates.price !== undefined) items[idx].price = updates.price;
      saveDiscoveredCourses(items);
    }

    await updateDoc(docRef, removeUndefinedValues(updates)).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Course ${id} updated successfully.`,
      updates,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/courses/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update course" },
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
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    // Delete from persistent store
    const items = loadDiscoveredCourses();
    const filtered = items.filter((i) => i.id !== id);
    saveDiscoveredCourses(filtered);

    await deleteDoc(doc(db, "courses", id)).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/courses/discovery Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}
