import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";

export interface InternshipItem {
  id?: string;
  slug?: string;
  title: string;
  role?: string;
  companyName: string;
  companyLogoUrl?: string | null;
  description: string;
  location: string;
  mode: "Remote" | "Hybrid" | "On-site";
  skills: string[];
  sourceUrl: string;
  sourceName: string;
  category: string;
  stipend?: number | string | null;
  duration?: string;
  applicationDeadline?: string;
  status: "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "EXPIRED";
  sourceType: "ADMIN" | "DISCOVERED";
  externalApplication: boolean;
  discoveredAt?: any;
  approvedBy?: string;
  approvedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface SearchQueryItem {
  id?: string;
  query: string;
  category: string;
  active: boolean;
  createdAt?: any;
}

export interface DiscoveryRunItem {
  id?: string;
  runAt: any;
  executedBy: string;
  queriesProcessed: number;
  resultsFound: number;
  newResults: number;
  duplicates: number;
  errors: number;
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS";
}

export const DEFAULT_SEARCH_QUERIES: Omit<SearchQueryItem, "id">[] = [
  { query: "Full Stack Developer Internship India 2026", category: "Full Stack", active: true },
  { query: "React Node.js Frontend Developer Internship", category: "Frontend", active: true },
  { query: "Python Backend Software Engineer Intern", category: "Backend", active: true },
  { query: "AI Machine Learning Engineering Intern", category: "AI / ML", active: true },
  { query: "Data Science and Analytics Intern", category: "Data Science", active: true },
  { query: "Cloud DevOps Engineering Intern", category: "Cloud / DevOps", active: true },
  { query: "Cybersecurity Analyst Intern", category: "Cybersecurity", active: true },
];

// 1. Fetch or initialize Search Queries
export async function getSearchQueries(): Promise<SearchQueryItem[]> {
  try {
    const colRef = collection(db, "internshipSearchQueries");
    const snap = await getDocs(colRef);

    if (snap.empty) {
      const seeded: SearchQueryItem[] = [];
      for (const q of DEFAULT_SEARCH_QUERIES) {
        const dRef = await addDoc(colRef, {
          ...q,
          createdAt: serverTimestamp(),
        });
        seeded.push({ id: dRef.id, ...q });
      }
      return seeded;
    }

    const list: SearchQueryItem[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as SearchQueryItem) });
    });
    return list;
  } catch (err) {
    console.error("Error getting search queries:", err);
    return [];
  }
}

// 2. Add Search Query
export async function addSearchQuery(queryText: string, category: string): Promise<boolean> {
  try {
    const colRef = collection(db, "internshipSearchQueries");
    await addDoc(colRef, {
      query: queryText.trim(),
      category: category.trim(),
      active: true,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

// 3. Delete Search Query
export async function deleteSearchQuery(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "internshipSearchQueries", id));
    return true;
  } catch {
    return false;
  }
}

// 4. Save Discovered Internship with Deduplication
export async function saveDiscoveredInternship(item: Omit<InternshipItem, "id" | "createdAt" | "updatedAt">): Promise<{ saved: boolean; isNew: boolean }> {
  try {
    const colRef = collection(db, "internships");

    // Deduplication check by sourceUrl
    const urlQ = query(colRef, where("sourceUrl", "==", item.sourceUrl));
    const urlSnap = await getDocs(urlQ);

    if (!urlSnap.empty) {
      // Update existing record
      const existingDoc = urlSnap.docs[0];
      await updateDoc(existingDoc.ref, {
        ...item,
        updatedAt: serverTimestamp(),
      });
      return { saved: true, isNew: false };
    }

    // Deduplication check by normalized title + company
    const compQ = query(
      colRef, 
      where("companyName", "==", item.companyName), 
      where("title", "==", item.title)
    );
    const compSnap = await getDocs(compQ);

    if (!compSnap.empty) {
      await updateDoc(compSnap.docs[0].ref, {
        ...item,
        updatedAt: serverTimestamp(),
      });
      return { saved: true, isNew: false };
    }

    // Create new document with PENDING_REVIEW status
    const slug = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    await addDoc(colRef, {
      ...item,
      slug,
      status: "PENDING_REVIEW",
      sourceType: "DISCOVERED",
      externalApplication: true,
      discoveredAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { saved: true, isNew: true };
  } catch (err) {
    console.error("Error saving discovered internship:", err);
    return { saved: false, isNew: false };
  }
}

// 5. Admin Approve Internship
export async function approveInternship(id: string, adminUid: string): Promise<boolean> {
  try {
    const docRef = doc(db, "internships", id);
    await updateDoc(docRef, {
      status: "PUBLISHED",
      approvedBy: adminUid,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create Audit Log
    await addDoc(collection(db, "auditLogs"), {
      actorUid: adminUid,
      action: "INTERNSHIP_APPROVED",
      resourceId: id,
      timestamp: serverTimestamp(),
    });

    return true;
  } catch (err) {
    console.error("Error approving internship:", err);
    return false;
  }
}

// 6. Admin Reject Internship
export async function rejectInternship(id: string, adminUid: string): Promise<boolean> {
  try {
    const docRef = doc(db, "internships", id);
    await updateDoc(docRef, {
      status: "REJECTED",
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "auditLogs"), {
      actorUid: adminUid,
      action: "INTERNSHIP_REJECTED",
      resourceId: id,
      timestamp: serverTimestamp(),
    });

    return true;
  } catch (err) {
    console.error("Error rejecting internship:", err);
    return false;
  }
}

// 7. Get Discovered Internships for Admin Review
export async function getDiscoveredInternships(statusFilter?: string): Promise<InternshipItem[]> {
  try {
    const colRef = collection(db, "internships");
    let q = query(colRef, orderBy("createdAt", "desc"));
    if (statusFilter && statusFilter !== "ALL") {
      q = query(colRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    }

    const snap = await getDocs(q);
    const list: InternshipItem[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as InternshipItem) });
    });
    return list;
  } catch (err) {
    console.error("Error fetching discovered internships:", err);
    return [];
  }
}

// 8. Get Published Internships for Students
export async function getPublishedInternships(): Promise<InternshipItem[]> {
  try {
    const colRef = collection(db, "internships");
    const q = query(colRef, where("status", "==", "PUBLISHED"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: InternshipItem[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as InternshipItem) });
    });
    return list;
  } catch (err) {
    console.error("Error fetching published internships:", err);
    return [];
  }
}
