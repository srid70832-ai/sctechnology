import { NextResponse } from "next/server";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";
import { VERIFIED_REAL_COURSE_POOL, loadDiscoveredCourses } from "@/lib/gemini-discovery";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseIdOrSlug = searchParams.get("id");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty") || searchParams.get("level");
    const provider = searchParams.get("provider");
    const isFree = searchParams.get("isFree");
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limitCount = parseInt(searchParams.get("limit") || "24", 10);

    if (courseIdOrSlug) {
      // 1. Fetch single course
      let courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseIdOrSlug)).catch(() => null);
      let courseData: any = null;

      if (courseDoc && courseDoc.exists()) {
        courseData = { id: courseDoc.id, ...courseDoc.data() };
      } else {
        // Query by slug
        const qSlug = query(
          collection(db, COLLECTIONS.COURSES),
          where("slug", "==", courseIdOrSlug)
        );
        const snap = await getDocs(qSlug).catch(() => null);
        if (snap && !snap.empty) {
          courseData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      }

      if (!courseData || (courseData.status !== "PUBLISHED" && !searchParams.get("preview"))) {
        return NextResponse.json({ error: "Course not found or unavailable." }, { status: 404 });
      }

      const realCourseId = courseData.id;

      // 2. Fetch modules if available
      const modQuery = query(
        collection(db, COLLECTIONS.COURSE_MODULES),
        where("courseId", "==", realCourseId)
      );
      const modSnap = await getDocs(modQuery).catch(() => null);
      const modules: any[] = [];
      if (modSnap) {
        modSnap.forEach((d) => modules.push({ id: d.id, ...d.data() }));
      }
      modules.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      return NextResponse.json({
        success: true,
        course: {
          ...courseData,
          modules,
          totalModules: modules.length,
        },
      });
    }

    // List all published courses
    const colRef = collection(db, COLLECTIONS.COURSES);
    let snap: any = null;
    try {
      const q = query(colRef, where("status", "==", "PUBLISHED"));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef).catch(() => null);
    }

    let courses: any[] = [];
    if (snap) {
      snap.forEach((d: any) => {
        const data = d.data();
        if (data.status === "PUBLISHED" || !data.status) {
          courses.push({ id: d.id, ...data });
        }
      });
    }

    // Merge with discovered courses from persistent store
    try {
      const discovered = loadDiscoveredCourses();
      for (const dc of discovered) {
        if (dc.status === "PUBLISHED" && dc.isActive !== false) {
          if (!courses.some((existing) => existing.id === dc.id || existing.courseUrl === dc.courseUrl)) {
            courses.push(dc);
          }
        }
      }
    } catch {
      // continue
    }

    // If still empty, fallback to curated verified pool
    if (courses.length === 0) {
      courses = VERIFIED_REAL_COURSE_POOL.map((c, idx) => ({
        ...c,
        id: `course_seed_${idx + 1}`,
        status: "PUBLISHED",
        isActive: true,
        verified: true,
      }));
    }

    if (category && category !== "All") {
      courses = courses.filter((c) => c.category?.toLowerCase() === category.toLowerCase());
    }

    if (difficulty && difficulty !== "All") {
      courses = courses.filter(
        (c) =>
          c.level?.toLowerCase() === difficulty.toLowerCase() ||
          c.difficulty?.toLowerCase() === difficulty.toLowerCase()
      );
    }

    if (provider && provider !== "All") {
      courses = courses.filter((c) => c.provider?.toLowerCase().includes(provider.toLowerCase()));
    }

    if (isFree === "true") {
      courses = courses.filter((c) => c.isFree === true || c.price === 0);
    }

    if (search) {
      courses = courses.filter((c) => {
        const title = (c.title || "").toLowerCase();
        const desc = (c.description || c.shortDescription || "").toLowerCase();
        const prov = (c.provider || c.instructor || "").toLowerCase();
        const skills = (c.skills || []).map((s: string) => s.toLowerCase());
        return (
          title.includes(search) ||
          desc.includes(search) ||
          prov.includes(search) ||
          skills.some((s: string) => s.includes(search))
        );
      });
    }

    // Pagination
    const total = courses.length;
    const startIndex = (page - 1) * limitCount;
    const paginated = courses.slice(startIndex, startIndex + limitCount);

    return NextResponse.json({
      success: true,
      count: total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount),
      courses: paginated,
    });
  } catch (error: any) {
    console.error("Public GET Courses Error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
