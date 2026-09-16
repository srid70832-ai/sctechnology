import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { CourseItem, CourseModuleItem, CourseLessonItem, slugify } from "@/lib/platform-models";
import { notifyIndexNow, publicContentUrl } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (courseId) {
      // Return single course with full modules and lessons
      const courseDoc = await getDoc(doc(db, COLLECTIONS.COURSES, courseId));
      if (!courseDoc.exists()) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }

      const course = { id: courseDoc.id, ...(courseDoc.data() as any) };

      // Fetch modules
      const modQuery = query(
        collection(db, COLLECTIONS.COURSE_MODULES),
        where("courseId", "==", courseId)
      );
      const modSnap = await getDocs(modQuery);
      const modules: any[] = [];
      modSnap.forEach((d) => modules.push({ id: d.id, ...d.data() }));
      modules.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      // Fetch lessons
      const lessQuery = query(
        collection(db, COLLECTIONS.COURSE_LESSONS),
        where("courseId", "==", courseId)
      );
      const lessSnap = await getDocs(lessQuery);
      const lessons: any[] = [];
      lessSnap.forEach((d) => lessons.push({ id: d.id, ...d.data() }));
      lessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      // Attach lessons to corresponding modules
      const modulesWithLessons = modules.map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.moduleId === m.id),
      }));

      return NextResponse.json({
        success: true,
        course: { ...course, modules: modulesWithLessons },
      });
    }

    // List all courses
    const colRef = collection(db, COLLECTIONS.COURSES);
    let snap;
    try {
      const q = query(colRef, orderBy("createdAt", "desc"));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef);
    }

    const courses: CourseItem[] = [];
    snap.forEach((d) => {
      courses.push({ id: d.id, ...(d.data() as any) });
    });

    return NextResponse.json({ success: true, count: courses.length, courses });
  } catch (error: any) {
    console.error("Admin GET Courses Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const { type } = body; // "COURSE" | "MODULE" | "LESSON"

    const toArray = (input: any) => {
      if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
      if (typeof input === "string") return input.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    // 1. MANAGE MODULE
    if (type === "MODULE") {
      const { id, courseId, title, description, orderIndex } = body;
      if (!courseId || !title) {
        return NextResponse.json({ error: "courseId and title are required for a module." }, { status: 400 });
      }
      const moduleId = id || `mod-${Date.now()}`;
      const modRef = doc(db, COLLECTIONS.COURSE_MODULES, moduleId);
      const isNew = !(await getDoc(modRef)).exists();

      const payload: Partial<CourseModuleItem> = {
        id: moduleId,
        courseId,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        orderIndex: Number(orderIndex) || 0,
        updatedAt: serverTimestamp(),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      };

      await setDoc(modRef, removeUndefinedValues(payload), { merge: true });
      return NextResponse.json({ success: true, moduleId, message: "Module saved successfully." });
    }

    // 2. MANAGE LESSON
    if (type === "LESSON") {
      const { id, courseId, moduleId, title, description, videoUrl, notes, resources, githubUrl, assignment, orderIndex } = body;
      if (!courseId || !moduleId || !title) {
        return NextResponse.json({ error: "courseId, moduleId, and title are required for a lesson." }, { status: 400 });
      }
      const lessonId = id || `less-${Date.now()}`;
      const lessRef = doc(db, COLLECTIONS.COURSE_LESSONS, lessonId);
      const isNew = !(await getDoc(lessRef)).exists();

      const payload: Partial<CourseLessonItem> = {
        id: lessonId,
        courseId,
        moduleId,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        notes: notes ? String(notes) : null,
        resources: toArray(resources),
        githubUrl: githubUrl ? String(githubUrl).trim() : null,
        assignment: assignment ? String(assignment).trim() : null,
        orderIndex: Number(orderIndex) || 0,
        updatedAt: serverTimestamp(),
        ...(isNew ? { createdAt: serverTimestamp() } : {}),
      };

      await setDoc(lessRef, removeUndefinedValues(payload), { merge: true });
      return NextResponse.json({ success: true, lessonId, message: "Lesson saved successfully." });
    }

    // 3. MANAGE COURSE (DEFAULT)
    const {
      id,
      title,
      slug,
      thumbnail,
      shortDescription,
      fullDescription,
      category,
      difficulty,
      duration,
      skills,
      instructor,
      isFree,
      price,
      status,
      resources,
    } = body;

    if (!title || !shortDescription || !instructor) {
      return NextResponse.json(
        { error: "Title, short description, and instructor are required for a course." },
        { status: 400 }
      );
    }

    const courseSlug = slug || slugify(title);
    const courseId = id || `course-${courseSlug}-${Date.now().toString().slice(-4)}`;
    const courseRef = doc(db, COLLECTIONS.COURSES, courseId);
    const isNew = !(await getDoc(courseRef)).exists();

    const payload: Partial<CourseItem> = {
      id: courseId,
      slug: courseSlug,
      title: String(title).trim(),
      thumbnail: thumbnail ? String(thumbnail).trim() : null,
      shortDescription: String(shortDescription).trim(),
      fullDescription: fullDescription ? String(fullDescription).trim() : String(shortDescription).trim(),
      category: category || "Full Stack",
      difficulty: difficulty || "BEGINNER",
      duration: duration || "8 Weeks",
      skills: toArray(skills),
      instructor: String(instructor).trim(),
      isFree: Boolean(isFree ?? true),
      price: Number(price) >= 0 ? Number(price) : 0,
      status: status || "PUBLISHED",
      resources: toArray(resources),
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: session?.email || "ADMIN" } : {}),
    };

    await setDoc(courseRef, removeUndefinedValues(payload), { merge: true });
    if (payload.status === "PUBLISHED") {
      notifyIndexNow(publicContentUrl("courses", courseSlug));
    }
    return NextResponse.json({
      success: true,
      courseId,
      message: isNew ? "Course created successfully." : "Course updated successfully.",
    });
  } catch (error: any) {
    console.error("Admin POST Course Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save course" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "COURSE";

    if (!id) {
      return NextResponse.json({ error: "ID is required for deletion." }, { status: 400 });
    }

    if (type === "MODULE") {
      await deleteDoc(doc(db, COLLECTIONS.COURSE_MODULES, id));
    } else if (type === "LESSON") {
      await deleteDoc(doc(db, COLLECTIONS.COURSE_LESSONS, id));
    } else {
      await deleteDoc(doc(db, COLLECTIONS.COURSES, id));
      notifyIndexNow(publicContentUrl("courses", id));
    }

    return NextResponse.json({ success: true, message: `${type} deleted successfully.` });
  } catch (error: any) {
    console.error("Admin DELETE Course Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete" }, { status: 500 });
  }
}
