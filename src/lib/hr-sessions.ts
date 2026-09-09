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
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";

export interface HRSession {
  id?: string;
  title: string;
  speakerName: string;
  speakerRole?: string;
  companyName?: string;
  speakerAvatar?: string | null;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in minutes
  sessionType: "Webinar" | "1-on-1 Mock Interview" | "Panel Discussion" | "Q&A Session";
  meetingPlatform: "Google Meet" | "Zoom" | "Microsoft Teams" | "Other";
  meetingLink?: string; // Private, only revealed during join window
  eligibility: "ALL" | "PLAN_BASED" | "SPECIFIC_STUDENTS";
  allowedPlans?: string[]; // e.g. ["PRO", "CAREER"]
  allocatedUserIds?: string[]; // Specific student Firebase UIDs
  maxParticipants?: number;
  registrationDeadline?: string;
  status: "DRAFT" | "PUBLISHED" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "LIVE" | "COMPLETED" | "CANCELLED";
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface HRSessionRegistration {
  id?: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: any;
  status: "REGISTERED" | "CANCELLED" | "ATTENDED" | "ABSENT";
}

// 1. Admin: Create HR Session
export async function createHRSession(data: Omit<HRSession, "id" | "createdAt" | "updatedAt">, adminUid: string): Promise<string | null> {
  try {
    const colRef = collection(db, "hrSessions");
    const docRef = await addDoc(colRef, {
      ...data,
      status: data.status || "DRAFT",
      allowedPlans: data.allowedPlans || [],
      allocatedUserIds: data.allocatedUserIds || [],
      createdBy: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create Audit Log
    await addDoc(collection(db, "auditLogs"), {
      actorUid: adminUid,
      action: "HR_SESSION_CREATED",
      resourceId: docRef.id,
      timestamp: serverTimestamp(),
      metadata: { title: data.title, speaker: data.speakerName },
    });

    return docRef.id;
  } catch (err) {
    console.error("Error creating HR session:", err);
    return null;
  }
}

// 2. Admin: Update HR Session
export async function updateHRSession(sessionId: string, data: Partial<HRSession>, adminUid: string): Promise<boolean> {
  try {
    const docRef = doc(db, "hrSessions", sessionId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Audit log
    await addDoc(collection(db, "auditLogs"), {
      actorUid: adminUid,
      action: "HR_SESSION_UPDATED",
      resourceId: sessionId,
      timestamp: serverTimestamp(),
      metadata: data,
    });

    return true;
  } catch (err) {
    console.error("Error updating HR session:", err);
    return false;
  }
}

// 3. Admin: Allocate Students & Send Notifications
export async function allocateHRSession(
  sessionId: string,
  allocatedUserIds: string[],
  allowedPlans: string[],
  eligibility: "ALL" | "PLAN_BASED" | "SPECIFIC_STUDENTS",
  adminUid: string,
  sessionTitle: string
): Promise<boolean> {
  try {
    const sessionRef = doc(db, "hrSessions", sessionId);
    await updateDoc(sessionRef, {
      allocatedUserIds,
      allowedPlans,
      eligibility,
      status: "PUBLISHED",
      updatedAt: serverTimestamp(),
    });

    // Dispatch real Firestore notifications to allocated students
    if (allocatedUserIds.length > 0) {
      const notifCol = collection(db, "notifications");
      for (const uid of allocatedUserIds) {
        await addDoc(notifCol, {
          userId: uid,
          title: "New HR Session Available",
          message: `You've been invited to join "${sessionTitle}".`,
          type: "HR_SESSION",
          read: false,
          link: `/hr-sessions/${sessionId}`,
          createdAt: serverTimestamp(),
        });
      }
    }

    // Audit log
    await addDoc(collection(db, "auditLogs"), {
      actorUid: adminUid,
      action: "HR_SESSION_ALLOCATED",
      resourceId: sessionId,
      timestamp: serverTimestamp(),
      metadata: { allocatedCount: allocatedUserIds.length, allowedPlans, eligibility },
    });

    return true;
  } catch (err) {
    console.error("Error allocating HR session:", err);
    return false;
  }
}

// 4. Student: Fetch Eligible / Allocated Sessions
export async function getEligibleHRSessions(userId?: string, userPlan = "STARTER"): Promise<HRSession[]> {
  try {
    const colRef = collection(db, "hrSessions");
    const q = query(colRef, orderBy("date", "asc"));
    const snap = await getDocs(q);

    const sessions: HRSession[] = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data() as HRSession;
      const id = docSnap.id;

      // Filter out DRAFT for students
      if (d.status === "DRAFT") return;

      // Check eligibility
      let isEligible = false;
      if (d.eligibility === "ALL") {
        isEligible = true;
      } else if (d.eligibility === "PLAN_BASED" && d.allowedPlans?.includes(userPlan.toUpperCase())) {
        isEligible = true;
      } else if (userId && d.allocatedUserIds?.includes(userId)) {
        isEligible = true;
      }

      if (isEligible) {
        sessions.push({
          ...d,
          id,
          // Hide sensitive meetingLink from catalog list
          meetingLink: undefined,
        });
      }
    });

    return sessions;
  } catch (err) {
    console.error("Error getting eligible HR sessions:", err);
    return [];
  }
}

// 5. Student: Register for HR Session
export async function registerForHRSession(
  sessionId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check for existing registration
    const regCol = collection(db, "hrSessionRegistrations");
    const existingQ = query(regCol, where("sessionId", "==", sessionId), where("userId", "==", userId));
    const snap = await getDocs(existingQ);

    if (!snap.empty) {
      return { success: false, error: "You are already registered for this session." };
    }

    await addDoc(regCol, {
      sessionId,
      userId,
      userName,
      userEmail,
      registeredAt: serverTimestamp(),
      status: "REGISTERED",
      attendanceStatus: "REGISTERED",
    });

    // Create student notification
    await addDoc(collection(db, "notifications"), {
      userId,
      title: "HR Session Registration Confirmed",
      message: "Your seat is confirmed! You can join when the session goes live.",
      type: "HR_SESSION",
      read: false,
      link: `/hr-sessions/${sessionId}`,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error registering for HR session:", err);
    return { success: false, error: err.message || "Registration failed" };
  }
}

// 6. Check if user is registered for a session
export async function checkSessionRegistration(sessionId: string, userId: string): Promise<boolean> {
  try {
    const regCol = collection(db, "hrSessionRegistrations");
    const q = query(regCol, where("sessionId", "==", sessionId), where("userId", "==", userId));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}
