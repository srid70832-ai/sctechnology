import { 
  ProjectTaskBlueprint, 
  TaskStatus, 
  TaskDifficulty, 
  getTasksForProject 
} from "./project-tasks-data";
import { prisma } from "./prisma";
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
  serverTimestamp 
} from "firebase/firestore";

export interface TaskSubmissionData {
  githubRepoUrl?: string;
  githubCommitUrl?: string;
  demoUrl?: string;
  explanation: string;
  screenshotUrls?: string[];
  submittedAt: string;
}

export interface TaskEvaluationData {
  status: "APPROVED" | "REJECTED";
  score?: number; // 0 to 100
  feedback: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface UserProjectTask {
  id: string; // e.g. "usr_123_proj_01_task_1"
  userId: string;
  projectId: string;
  projectSlug: string;
  taskBlueprintId: string;
  taskNumber: number;
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  isImportant: boolean;
  importanceRationale?: string;
  requirements: string[];
  expectedOutput: string;
  evaluationCriteria: string[];
  skills: string[];
  status: TaskStatus;
  submission?: TaskSubmissionData;
  evaluation?: TaskEvaluationData;
  assignedAt: string;
  updatedAt: string;
}

export type StipendStatus = 
  | "NOT_ELIGIBLE"
  | "ELIGIBLE"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "PAYMENT_INITIATED"
  | "PAID";

export interface ProjectStipendSummary {
  userId: string;
  projectId: string;
  totalTasks: number; // 8
  completedTasks: number;
  submittedTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  easyCompleted: number; // / 2
  mediumCompleted: number; // / 2
  hardCompleted: number; // / 4
  stipendAmount: number; // ₹5,000 or ₹1,200 or 0
  stipendStatus: StipendStatus;
  stipendStatusLabel: string;
  isEligible: boolean;
  canSubmitPaymentDetails: boolean;
}

/**
 * Calculates real-time stipend eligibility based on SC TECH official rules:
 * - 8 / 8 Approved Tasks = ₹5,000 Stipend
 * - 6 / 8 or 7 / 8 Approved Tasks = ₹1,200 Stipend
 * - <= 5 Approved Tasks = ₹0 (Not Eligible)
 */
export function calculateStipendEligibility(
  userId: string,
  projectId: string,
  tasks: UserProjectTask[],
  currentStipendStatus?: StipendStatus
): ProjectStipendSummary {
  const totalTasks = 8;
  const approvedTasks = tasks.filter((t) => t.status === "APPROVED" || t.status === "COMPLETED").length;
  const submittedTasks = tasks.filter((t) => t.status === "SUBMITTED" || t.status === "UNDER_REVIEW").length;
  const rejectedTasks = tasks.filter((t) => t.status === "REJECTED").length;
  const completedTasks = approvedTasks;

  const easyCompleted = tasks.filter((t) => t.difficulty === "EASY" && (t.status === "APPROVED" || t.status === "COMPLETED")).length;
  const mediumCompleted = tasks.filter((t) => t.difficulty === "MEDIUM" && (t.status === "APPROVED" || t.status === "COMPLETED")).length;
  const hardCompleted = tasks.filter((t) => t.difficulty === "HARD" && (t.status === "APPROVED" || t.status === "COMPLETED")).length;

  let stipendAmount = 0;
  let isEligible = false;

  if (approvedTasks >= 8) {
    stipendAmount = 5000;
    isEligible = true;
  } else if (approvedTasks >= 6) {
    stipendAmount = 1200;
    isEligible = true;
  } else {
    stipendAmount = 0;
    isEligible = false;
  }

  let finalStatus: StipendStatus = currentStipendStatus || (isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE");
  if (!isEligible && finalStatus !== "PAID") {
    finalStatus = "NOT_ELIGIBLE";
  } else if (isEligible && finalStatus === "NOT_ELIGIBLE") {
    finalStatus = "ELIGIBLE";
  }

  let stipendStatusLabel = "Not Eligible";
  if (finalStatus === "PAID") {
    stipendStatusLabel = `₹${stipendAmount.toLocaleString("en-IN")} Disbursed & Paid ✓`;
  } else if (finalStatus === "PAYMENT_INITIATED") {
    stipendStatusLabel = `₹${stipendAmount.toLocaleString("en-IN")} Payment Processing`;
  } else if (finalStatus === "APPROVED") {
    stipendStatusLabel = `₹${stipendAmount.toLocaleString("en-IN")} Approved — Ready for Payout`;
  } else if (finalStatus === "PENDING_VERIFICATION") {
    stipendStatusLabel = `₹${stipendAmount.toLocaleString("en-IN")} Eligible — Pending Bank/Admin Verification`;
  } else if (finalStatus === "ELIGIBLE") {
    stipendStatusLabel = `Eligible for ₹${stipendAmount.toLocaleString("en-IN")} — Submit Payment Details`;
  }

  return {
    userId,
    projectId,
    totalTasks,
    completedTasks,
    submittedTasks,
    approvedTasks,
    rejectedTasks,
    easyCompleted,
    mediumCompleted,
    hardCompleted,
    stipendAmount,
    stipendStatus: finalStatus,
    stipendStatusLabel,
    isEligible,
    canSubmitPaymentDetails: isEligible && finalStatus !== "PAID",
  };
}

/**
 * Initializes or fetches 8 assigned tasks for a user on a given project.
 */
export async function getOrCreateUserProjectTasks(
  userId: string,
  projectIdOrSlug: string
): Promise<{ tasks: UserProjectTask[]; stipendSummary: ProjectStipendSummary }> {
  const blueprints = getTasksForProject(projectIdOrSlug);
  const projectId = blueprints[0]?.id.split("-task-")[0] || projectIdOrSlug;

  try {
    // 1. Check Firestore for existing tasks
    const tasksCol = collection(db, "userProjectTasks");
    const q = query(
      tasksCol,
      where("userId", "==", userId),
      where("projectId", "==", projectId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const existing: UserProjectTask[] = [];
      snap.forEach((d) => existing.push(d.data() as UserProjectTask));
      existing.sort((a, b) => a.taskNumber - b.taskNumber);

      // Check current stipend state
      const stipendSummary = calculateStipendEligibility(userId, projectId, existing);
      return { tasks: existing, stipendSummary };
    }

    // 2. Initialize 8 fresh tasks
    const now = new Date().toISOString();
    const createdTasks: UserProjectTask[] = blueprints.map((b) => ({
      id: `${userId}_${projectId}_${b.taskNumber}`,
      userId,
      projectId,
      projectSlug: projectIdOrSlug,
      taskBlueprintId: b.id,
      taskNumber: b.taskNumber,
      title: b.title,
      description: b.description,
      difficulty: b.difficulty,
      isImportant: !!b.isImportant,
      importanceRationale: b.importanceRationale,
      requirements: b.requirements,
      expectedOutput: b.expectedOutput,
      evaluationCriteria: b.evaluationCriteria,
      skills: b.skills,
      status: "ASSIGNED" as TaskStatus,
      assignedAt: now,
      updatedAt: now,
    }));

    // Save to Firestore
    for (const t of createdTasks) {
      try {
        await setDoc(doc(db, "userProjectTasks", t.id), t);
      } catch (err) {
        console.warn("Could not write task to Firestore:", err);
      }
    }

    const stipendSummary = calculateStipendEligibility(userId, projectId, createdTasks);
    return { tasks: createdTasks, stipendSummary };
  } catch (err) {
    console.error("Error in getOrCreateUserProjectTasks:", err);
    // In-memory fallback
    const now = new Date().toISOString();
    const fallbackTasks: UserProjectTask[] = blueprints.map((b) => ({
      id: `${userId}_${projectId}_${b.taskNumber}`,
      userId,
      projectId,
      projectSlug: projectIdOrSlug,
      taskBlueprintId: b.id,
      taskNumber: b.taskNumber,
      title: b.title,
      description: b.description,
      difficulty: b.difficulty,
      isImportant: !!b.isImportant,
      importanceRationale: b.importanceRationale,
      requirements: b.requirements,
      expectedOutput: b.expectedOutput,
      evaluationCriteria: b.evaluationCriteria,
      skills: b.skills,
      status: "ASSIGNED" as TaskStatus,
      assignedAt: now,
      updatedAt: now,
    }));
    return {
      tasks: fallbackTasks,
      stipendSummary: calculateStipendEligibility(userId, projectId, fallbackTasks),
    };
  }
}
