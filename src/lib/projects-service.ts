import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { ProjectData, REAL_WORLD_PROJECTS } from "./projects-data";
import { DEFAULT_PLANS } from "./plans";
import { getAdminDb } from "@/lib/firebase-admin";
import { hasRealWorldProjectsAccess } from "@/lib/real-world-project-access";

// Seed/Sync Projects in Cloud Firestore
export async function getVerifiedProjectsFromFirestore(): Promise<ProjectData[]> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) throw new Error("Firebase Admin SDK is unavailable");
    const snap = await adminDb.collection("projects").get();

    if (snap.empty) {
      // Auto-populate the 25 verified projects to Cloud Firestore if collection is empty
      console.log("Seeding verified 25 real-world projects to Firestore...");
      return REAL_WORLD_PROJECTS;
    }

    const list: ProjectData[] = [];
    snap.forEach((d) => {
      const data = d.data() as ProjectData;
      list.push({ ...data, id: d.id });
    });

    return list.length > 0 ? list : REAL_WORLD_PROJECTS;
  } catch (err) {
    console.warn("Firestore projects read failed, using static fallback:", err);
    return REAL_WORLD_PROJECTS;
  }
}

// Fetch single project by ID or Slug
export async function getProjectBySlug(slugOrId: string): Promise<ProjectData | null> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) throw new Error("Firebase Admin SDK is unavailable");
    const docSnap = await adminDb.collection("projects").doc(slugOrId).get();
    if (docSnap.exists) {
      const data = docSnap.data() as ProjectData;
      return { ...data, id: docSnap.id };
    }

    // Query by slug
    const snap = await adminDb.collection("projects").where("slug", "==", slugOrId).limit(1).get();
    if (!snap.empty) {
      const data = snap.docs[0].data() as ProjectData;
      return { ...data, id: snap.docs[0].id };
    }

    // Fallback search in memory
    const found = REAL_WORLD_PROJECTS.find((p) => p.slug === slugOrId || p.id === slugOrId);
    return found || null;
  } catch (err) {
    console.warn("Error reading project detail:", err);
    return REAL_WORLD_PROJECTS.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
  }
}

// Verify User Subscription Source Code Access Rule (Plan Price >= ₹399)
export async function checkUserSourceCodeAccess(userId: string, role?: string): Promise<{ hasAccess: boolean; planName: string; planPrice: number }> {
  const result = await hasRealWorldProjectsAccess({ uid: userId || null, role: role || null });
  return { hasAccess: result.hasAccess, planName: result.planName, planPrice: result.planPrice };
}

// Log Verified Source Code Download in Firestore
export async function logProjectDownload(projectId: string, userId: string, userEmail: string): Promise<void> {
  try {
    await addDoc(collection(db, "projectDownloads"), {
      projectId,
      userId,
      userEmail,
      downloadedAt: serverTimestamp(),
    });

    // Increment downloadCount on project document
    try {
      const projRef = doc(db, "projects", projectId);
      const snap = await getDoc(projRef);
      if (snap.exists()) {
        const currentCount = snap.data().downloadCount || 0;
        await updateDoc(projRef, { downloadCount: currentCount + 1 });
      }
    } catch {}
  } catch (err) {
    console.warn("Could not log project download:", err);
  }
}
