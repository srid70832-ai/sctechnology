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

// Seed/Sync Projects in Cloud Firestore
export async function getVerifiedProjectsFromFirestore(): Promise<ProjectData[]> {
  try {
    const colRef = collection(db, "projects");
    const snap = await getDocs(colRef);

    if (snap.empty) {
      // Auto-populate the 25 verified projects to Cloud Firestore if collection is empty
      console.log("Seeding verified 25 real-world projects to Firestore...");
      for (const p of REAL_WORLD_PROJECTS) {
        await setDoc(doc(db, "projects", p.slug || p.id), {
          ...p,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
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
    const docRef = doc(db, "projects", slugOrId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as ProjectData;
      return { ...data, id: docSnap.id };
    }

    // Query by slug
    const q = query(collection(db, "projects"), where("slug", "==", slugOrId));
    const snap = await getDocs(q);
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
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return { hasAccess: true, planName: "Admin Access", planPrice: 9999 };
  }

  if (!userId) {
    return { hasAccess: false, planName: "Unauthenticated", planPrice: 0 };
  }

  try {
    // 1. Read user subscription from Cloud Firestore
    const subDoc = await getDoc(doc(db, "subscriptions", userId));
    if (subDoc.exists()) {
      const subData = subDoc.data();
      const planCode = (subData.planId || "FREE").toUpperCase();
      const status = subData.status;
      const endDate = subData.endDate?.toMillis ? new Date(subData.endDate.toMillis()) : new Date(subData.endDate || 0);

      // Check if subscription is active and not expired
      const isActive = status === "ACTIVE" && (endDate.getTime() > Date.now() || !subData.endDate);

      if (isActive) {
        // Look up plan price from DEFAULT_PLANS / Firestore
        const defaultPlan = DEFAULT_PLANS.find((p) => p.code === planCode);
        let planPrice = defaultPlan ? defaultPlan.priceMonthly : 0;

        // Fetch custom price if in Firestore
        try {
          const pSnap = await getDocs(query(collection(db, "plans"), where("code", "==", planCode)));
          if (!pSnap.empty) {
            planPrice = pSnap.docs[0].data().priceMonthly ?? planPrice;
          }
        } catch {}

        // RULE: Students with a plan price >= ₹399 can access project source code
        if (planPrice >= 399 || planCode === "PLUS" || planCode === "PRO" || planCode === "CAREER") {
          return { hasAccess: true, planName: subData.planName || `${planCode} Plan`, planPrice };
        } else {
          return { hasAccess: false, planName: `${planCode} Plan (Starter)`, planPrice };
        }
      }
    }

    // 2. Check user profile directly
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const uData = userDoc.data();
      const planCode = (uData.plan || "FREE").toUpperCase();
      if (planCode === "PLUS" || planCode === "PRO" || planCode === "CAREER") {
        return { hasAccess: true, planName: `${planCode} Plan`, planPrice: 399 };
      }
    }
  } catch (err) {
    console.error("Error checking subscription access:", err);
  }

  return { hasAccess: false, planName: "Free / Starter Tier", planPrice: 0 };
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
