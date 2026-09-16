import { getAdminDb } from "@/lib/firebase-admin";
import { getProjectBySlug } from "@/lib/projects-service";
import { getTasksForProject } from "@/lib/project-tasks-data";
import {
  calculateDeadline,
  getDurationMonths,
  getRemainingDays,
  ProjectDurationOption,
  ProjectEnrollment,
  ProjectLifecycleStatus,
} from "@/lib/project-lifecycle-service";

const ACTIVE_STATUSES: ProjectLifecycleStatus[] = [
  "ACTIVE",
  "SUBMISSION_READY",
  "SUBMITTED",
  "EVALUATION_PENDING",
  "UNDER_REVIEW",
  "REVISION_REQUIRED",
];

export async function activateProjectServer(params: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  projectId: string;
  duration: ProjectDurationOption;
  planId: string;
}) {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Firebase Admin SDK is unavailable");

  const project = await getProjectBySlug(params.projectId);
  if (!project) return { success: false, error: "Project not found or is not published." };

  const storedProject = await adminDb.collection("projects").doc(project.id || params.projectId).get();
  if (storedProject.exists && storedProject.data()?.status && String(storedProject.data()?.status).toUpperCase() !== "PUBLISHED") {
    return { success: false, error: "This project is not currently available for activation." };
  }

  const enrollmentSnapshot = await adminDb.collection("projectEnrollments").where("studentId", "==", params.studentId).get();
  for (const enrollmentDoc of enrollmentSnapshot.docs) {
    const enrollment = enrollmentDoc.data() as ProjectEnrollment;
    if (!ACTIVE_STATUSES.includes(enrollment.projectStatus)) continue;
    if (Date.now() > new Date(enrollment.deadline).getTime() && !["SUBMITTED", "EVALUATION_PENDING", "UNDER_REVIEW", "COMPLETED"].includes(enrollment.projectStatus)) {
      await enrollmentDoc.ref.update({ projectStatus: "LOCKED", updatedAt: new Date().toISOString() });
      continue;
    }
    return { success: false, error: `You already have an active project ("${enrollment.projectTitle}"). Complete or close your current project before activating another.` };
  }

  const now = new Date();
  const startDate = now.toISOString();
  const deadline = calculateDeadline(now, params.duration).toISOString();
  const enrollmentId = `ENR-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const projectId = project.id || params.projectId;
  const blueprints = getTasksForProject(project.slug || params.projectId);
  const batch = adminDb.batch();

  for (const blueprint of blueprints) {
    const taskId = `${params.studentId}_${projectId}_${blueprint.taskNumber}`;
    batch.set(adminDb.collection("userProjectTasks").doc(taskId), {
      id: taskId,
      userId: params.studentId,
      projectId,
      projectSlug: project.slug || params.projectId,
      taskBlueprintId: blueprint.id,
      taskNumber: blueprint.taskNumber,
      title: blueprint.title,
      description: blueprint.description,
      difficulty: blueprint.difficulty,
      isImportant: Boolean(blueprint.isImportant),
      importanceRationale: blueprint.importanceRationale,
      requirements: blueprint.requirements,
      expectedOutput: blueprint.expectedOutput,
      evaluationCriteria: blueprint.evaluationCriteria,
      skills: blueprint.skills,
      status: "ASSIGNED",
      assignedAt: startDate,
      updatedAt: startDate,
    });
  }

  const enrollment: ProjectEnrollment = {
    id: enrollmentId,
    studentId: params.studentId,
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    projectId,
    projectSlug: project.slug || params.projectId,
    projectTitle: project.title,
    projectCategory: project.category,
    projectDifficulty: project.difficulty,
    planId: params.planId,
    paymentType: "PLAN_INCLUDED",
    activationFee: 0,
    paymentStatus: "PAID",
    selectedDuration: params.duration,
    durationMonths: getDurationMonths(params.duration),
    startDate,
    deadline,
    remainingDays: getRemainingDays(deadline),
    projectStatus: "ACTIVE",
    taskProgress: { total: blueprints.length || 8, approved: 0, submitted: 0 },
    stipendStatus: "NOT_ELIGIBLE",
    stipendAmount: 0,
    createdAt: startDate,
    updatedAt: startDate,
  };

  batch.set(adminDb.collection("projectEnrollments").doc(enrollmentId), enrollment);
  await batch.commit();
  return { success: true, enrollment };
}
