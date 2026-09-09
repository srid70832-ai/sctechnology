import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { formatDate } from "./utils";
import { getOrCreateUserProjectTasks, calculateStipendEligibility } from "./project-tasks-service";

export type ProjectDurationOption = "1_MONTH" | "2_MONTHS" | "3_MONTHS" | "4_MONTHS";

export type ProjectLifecycleStatus = 
  | "ACTIVE"
  | "SUBMISSION_READY"
  | "SUBMITTED"
  | "EVALUATION_PENDING"
  | "UNDER_REVIEW"
  | "REVISION_REQUIRED"
  | "EVALUATED"
  | "COMPLETED"
  | "EXPIRED"
  | "LOCKED"
  | "CANCELLED";

export interface ProjectSubmissionPayload {
  githubRepoUrl: string;
  githubCommitUrl?: string;
  liveDemoUrl: string;
  documentationText?: string;
  architectureNotes?: string;
  screenshots?: string[];
  submittedAt: string;
}

export interface ProjectEvaluationReport {
  score: number; // 0 to 100
  status: "APPROVED" | "REVISION_REQUIRED" | "REJECTED";
  strengths: string;
  weaknesses: string;
  improvements: string;
  technicalRemarks: string;
  taskWiseFeedback?: Record<string, string>;
  evaluationDocumentUrl?: string;
  evaluatorName: string;
  evaluatorRole: string;
  stipendApproved: boolean;
  stipendAmount: number; // 5000 | 1200 | 0
  certificateApproved: boolean;
  evaluatedAt: string;
}

export interface ProjectEnrollment {
  id: string; // e.g. "ENR_2026_XXXXXX"
  studentId: string;
  studentName: string;
  studentEmail: string;
  projectId: string;
  projectSlug: string;
  projectTitle: string;
  projectCategory: string;
  projectDifficulty: string;
  planId: string; // e.g. "PRO", "PLUS", "STARTER", "CUSTOM"
  paymentId?: string;
  paymentType: "PLAN_INCLUDED" | "NEXT_PROJECT_ACTIVATION" | "DIRECT_ENROLLMENT";
  activationFee: number; // 0 for plan-included, 99 for next project activation
  paymentStatus: "PAID" | "FREE_TIER" | "PENDING";
  selectedDuration: ProjectDurationOption;
  durationMonths: number; // 1, 2, 3, 4
  startDate: string; // ISO String
  deadline: string; // ISO String
  remainingDays: number;
  projectStatus: ProjectLifecycleStatus;
  taskProgress: {
    total: number; // 8
    approved: number;
    submitted: number;
  };
  submission?: ProjectSubmissionPayload;
  evaluation?: ProjectEvaluationReport;
  stipendStatus: "NOT_ELIGIBLE" | "ELIGIBLE" | "PENDING_VERIFICATION" | "APPROVED" | "PAID";
  stipendAmount: number;
  receiptId?: string;
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculates deadline from start date and duration option.
 * Max duration = 4 months.
 */
export function calculateDeadline(startDate: Date, duration: ProjectDurationOption): Date {
  const deadline = new Date(startDate.getTime());
  switch (duration) {
    case "1_MONTH":
      deadline.setMonth(deadline.getMonth() + 1);
      break;
    case "2_MONTHS":
      deadline.setMonth(deadline.getMonth() + 2);
      break;
    case "3_MONTHS":
      deadline.setMonth(deadline.getMonth() + 3);
      break;
    case "4_MONTHS":
      deadline.setMonth(deadline.getMonth() + 4);
      break;
    default:
      deadline.setMonth(deadline.getMonth() + 1);
  }
  return deadline;
}

export function getDurationMonths(duration: ProjectDurationOption): number {
  switch (duration) {
    case "1_MONTH": return 1;
    case "2_MONTHS": return 2;
    case "3_MONTHS": return 3;
    case "4_MONTHS": return 4;
    default: return 1;
  }
}

export function getRemainingDays(deadlineStr: string): number {
  const now = Date.now();
  const dead = new Date(deadlineStr).getTime();
  const diff = dead - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Generate unique enrollment ID: ENR-2026-XXXXXX
 */
export function generateEnrollmentId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ENR-2026-${rand}`;
}

/**
 * Check if student has an active project.
 * Enforces rule: ONE STUDENT = ONE ACTIVE PROJECT AT A TIME.
 */
export async function getActiveEnrollmentForStudent(
  studentId: string
): Promise<ProjectEnrollment | null> {
  try {
    const q = query(
      collection(db, "projectEnrollments"),
      where("studentId", "==", studentId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const activeStatuses: ProjectLifecycleStatus[] = [
      "ACTIVE",
      "SUBMISSION_READY",
      "SUBMITTED",
      "EVALUATION_PENDING",
      "UNDER_REVIEW",
      "REVISION_REQUIRED",
    ];

    const now = Date.now();
    for (const d of snap.docs) {
      const enr = d.data() as ProjectEnrollment;
      if (activeStatuses.includes(enr.projectStatus)) {
        // Check for server-side auto-lock / deadline expiration
        const dead = new Date(enr.deadline).getTime();
        if (now > dead && !["SUBMITTED", "EVALUATION_PENDING", "UNDER_REVIEW", "COMPLETED"].includes(enr.projectStatus)) {
          // Auto lock expired project
          await updateDoc(doc(db, "projectEnrollments", enr.id), {
            projectStatus: "LOCKED",
            updatedAt: new Date().toISOString(),
          });
          continue; // Slot is now freed
        }

        return {
          ...enr,
          remainingDays: getRemainingDays(enr.deadline),
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Error in getActiveEnrollmentForStudent:", err);
    return null;
  }
}

/**
 * Activate a project for a student.
 * Validates:
 * 1. Single active project rule.
 * 2. Next Project Activation Fee of ₹99 if student had a previous completed/closed project cycle.
 */
export async function activateProjectForStudent(params: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  projectId: string;
  projectSlug: string;
  projectTitle: string;
  projectCategory: string;
  projectDifficulty: string;
  planId?: string;
  duration: ProjectDurationOption;
  isNextProjectActivation?: boolean;
  paymentReference?: string;
}): Promise<{ success: boolean; enrollment?: ProjectEnrollment; error?: string }> {
  const {
    studentId,
    studentName,
    studentEmail,
    projectId,
    projectSlug,
    projectTitle,
    projectCategory,
    projectDifficulty,
    planId = "PRO",
    duration,
    isNextProjectActivation = false,
    paymentReference,
  } = params;

  // 1. Check if student already has an active project
  const currentActive = await getActiveEnrollmentForStudent(studentId);
  if (currentActive) {
    return {
      success: false,
      error: `You already have an active project ("${currentActive.projectTitle}"). Complete or close your current project before activating another.`,
    };
  }

  // 2. Compute Dates
  const now = new Date();
  const startDate = now.toISOString();
  const deadlineDate = calculateDeadline(now, duration);
  const deadline = deadlineDate.toISOString();
  const durationMonths = getDurationMonths(duration);
  const enrollmentId = generateEnrollmentId();

  // 3. Initialize 8 assigned tasks
  await getOrCreateUserProjectTasks(studentId, projectSlug || projectId);

  // 4. Create Enrollment Record
  const newEnrollment: ProjectEnrollment = {
    id: enrollmentId,
    studentId,
    studentName,
    studentEmail,
    projectId,
    projectSlug,
    projectTitle,
    projectCategory,
    projectDifficulty,
    planId,
    paymentId: paymentReference || `PAY-${enrollmentId}`,
    paymentType: isNextProjectActivation ? "NEXT_PROJECT_ACTIVATION" : "PLAN_INCLUDED",
    activationFee: isNextProjectActivation ? 99 : 0,
    paymentStatus: "PAID",
    selectedDuration: duration,
    durationMonths,
    startDate,
    deadline,
    remainingDays: getRemainingDays(deadline),
    projectStatus: "ACTIVE",
    taskProgress: {
      total: 8,
      approved: 0,
      submitted: 0,
    },
    stipendStatus: "NOT_ELIGIBLE",
    stipendAmount: 0,
    createdAt: startDate,
    updatedAt: startDate,
  };

  try {
    await setDoc(doc(db, "projectEnrollments", enrollmentId), newEnrollment);
    return { success: true, enrollment: newEnrollment };
  } catch (err: any) {
    console.error("Error creating project enrollment:", err);
    return { success: false, error: err.message || "Failed to create enrollment record" };
  }
}

/**
 * Fetch all project history for a student.
 */
export async function getStudentProjectHistory(studentId: string): Promise<ProjectEnrollment[]> {
  try {
    const q = query(
      collection(db, "projectEnrollments"),
      where("studentId", "==", studentId)
    );
    const snap = await getDocs(q);
    const list: ProjectEnrollment[] = [];
    snap.forEach((d) => list.push(d.data() as ProjectEnrollment));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error("Error fetching student project history:", err);
    return [];
  }
}
