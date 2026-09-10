import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// Collection references
export const COLLECTIONS = {
  USERS: "users",
  STUDENTS: "students",
  STUDENT_PROFILES: "students", // Canonical students collection
  COMPANIES: "companies",
  INTERNSHIPS: "internships",
  APPLICATIONS: "internshipApplications",
  HACKATHONS: "hackathons",
  HACKATHON_TEAMS: "hackathonTeams",
  HACKATHON_REGISTRATIONS: "hackathonRegistrations",
  HACKATHON_SUBMISSIONS: "hackathonSubmissions",
  PROBLEM_STATEMENTS: "problemStatements",
  PROJECTS: "projects",
  COURSES: "courses",
  COURSE_MODULES: "courseModules",
  COURSE_LESSONS: "courseLessons",
  SUBMISSIONS: "submissions",
  CERTIFICATES: "certificates",
  FEEDBACK: "feedback",
  NOTIFICATIONS: "notifications",
  PLANS: "plans",
  SUBSCRIPTIONS: "subscriptions",
  PAYMENTS: "payments",
  HACKATHON_RESULTS: "hackathonResults",
  STUDENT_ACHIEVEMENTS: "studentAchievements",
  INTERNSHIP_ACHIEVEMENTS: "internshipAchievements",
  AUDIT_LOGS: "auditLogs",
};

export interface StudentProfileData {
  uid: string;
  fullName: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  mobileNumber?: string;
  college?: string;
  department?: string;
  yearOfStudy?: string;
  year?: string;
  technicalSkills?: string[];
  skills?: string[];
  careerGoals?: string[];
  experienceLevel?: "Beginner" | "Intermediate" | "Advanced";
  internshipPreferences?: string[];
  preferredDomains?: string[];
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  resumeStoragePath?: string | null;
  resumeUploadedAt?: any;
  bio?: string;
  profileCompleted?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  onboardingCompletedAt?: any;
  profileCompletionPercentage?: number;
  updatedAt?: any;
  createdAt?: any;
}

export interface FeedbackData {
  userId?: string;
  uid?: string;
  userName?: string;
  userEmail?: string;
  email?: string;
  rating: number;
  category?: string;
  message: string;
  page?: string;
  pageUrl?: string;
  anonymous?: boolean;
  status?: "NEW" | "REVIEWED" | "RESOLVED";
  createdAt?: any;
}

/**
 * Normalizes a string input: returns trimmed string if non-empty, otherwise null.
 * Firestore accepts null but rejects undefined.
 */
export const cleanStringOrNull = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return String(value).trim() || null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * Recursively removes all undefined fields from an object or nested array/object.
 * Firestore rejects writes containing 'undefined' with:
 * 'Unsupported field value: undefined'
 */
export function removeUndefinedValues<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === "object" && item !== null ? removeUndefinedValues(item) : item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === "object" && !(value instanceof Date) && typeof (value as any).toDate !== "function") {
      cleaned[key] = removeUndefinedValues(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

// User & Profile helpers
export async function getStudentProfile(uid: string): Promise<StudentProfileData | null> {
  try {
    const studentDocRef = doc(db, "students", uid);
    const studentSnap = await getDoc(studentDocRef);
    if (studentSnap.exists()) {
      return studentSnap.data() as StudentProfileData;
    }
    return null;
  } catch (err) {
    console.error("Error fetching student profile from Firestore:", err);
    return null;
  }
}

export async function saveStudentProfile(uid: string, data: Partial<StudentProfileData>): Promise<boolean> {
  try {
    const studentDocRef = doc(db, "students", uid);
    const cleanedPayload = removeUndefinedValues({
      ...data,
      uid,
      updatedAt: serverTimestamp(),
    });
    await setDoc(studentDocRef, cleanedPayload, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving student profile to Firestore (students/):", err);
    return false;
  }
}

export async function submitFeedback(data: Omit<FeedbackData, "createdAt" | "status">): Promise<string | null> {
  try {
    const colRef = collection(db, COLLECTIONS.FEEDBACK);
    const cleanedData = removeUndefinedValues({
      ...data,
      status: "NEW",
      createdAt: serverTimestamp(),
    });
    const docRef = await addDoc(colRef, cleanedData);
    return docRef.id;
  } catch (err) {
    console.error("Error submitting feedback to Firestore:", err);
    return null;
  }
}

export async function saveFirestoreDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    const cleaned = removeUndefinedValues({
      ...data,
      id: docId,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.error(`Error saving document to ${collectionName}/${docId}:`, err);
    return false;
  }
}

export async function getFirestoreDoc<T = any>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as T;
    }
    return null;
  } catch (err) {
    console.error(`Error getting document from ${collectionName}/${docId}:`, err);
    return null;
  }
}

export async function deleteFirestoreDoc(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Error deleting document ${collectionName}/${docId}:`, err);
    return false;
  }
}

export async function queryFirestoreDocs<T = any>(
  collectionName: string,
  ...queryConstraints: any[]
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...queryConstraints);
    const snap = await getDocs(q);
    const results: T[] = [];
    snap.forEach((d) => {
      results.push({ id: d.id, ...d.data() } as T);
    });
    return results;
  } catch (err) {
    console.error(`Error querying collection ${collectionName}:`, err);
    return [];
  }
}

