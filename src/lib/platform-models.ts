export interface CompanyItem {
  id: string;
  name: string;
  logoUrl?: string | null;
  description: string;
  website?: string | null;
  hrName?: string | null;
  hrEmail?: string | null;
  hrContact?: string | null;
  requiredSkills: string[];
  eligibility?: string | null;
  location: string;
  jobType: "Internship" | "Full-time" | "Contract" | "Part-time";
  applicationUrl: string;
  deadline?: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  problemStatement: string;
  requirements: string[];
  features: string[];
  technologyStack: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedDuration: string;
  skillsRequired: string[];
  githubRepoUrl: string;
  liveDemoUrl?: string | null;
  documentationUrl?: string | null;
  bannerUrl?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  submissionMethod: "WEBSITE" | "GOOGLE_FORM";
  googleFormUrl?: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface HackathonRound {
  id: string;
  roundNumber: number;
  name: string;
  description: string;
  problemStatementIds: string[];
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  maxScore: number;
  status: "UPCOMING" | "ACTIVE" | "EVALUATION" | "COMPLETED";
  submissionMethod: "WEBSITE" | "GOOGLE_FORM";
  evaluationCriteria?: string | null;
}

export interface HackathonItem {
  id: string;
  title: string;
  slug: string;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  shortDescription: string;
  fullDescription: string;
  startDate: string;
  startTime?: string | null;
  endDate: string;
  endTime?: string | null;
  registrationDeadline: string;
  registrationFee: number;
  maxParticipants: number;
  registrationMode?: "INDIVIDUAL_ONLY" | "TEAM_ONLY" | "BOTH";
  minTeamSize?: number;
  maxTeamSize?: number;
  prizePool: number;
  prizes?: string[];
  rules: string[];
  guidelines?: string | null;
  judgingCriteria?: string | null;
  contactDetails?: string | null;
  submissionMethod: "WEBSITE" | "GOOGLE_FORM";
  googleFormUrl?: string | null;
  problemStatementIds?: string[];
  rounds?: HackathonRound[];
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "CLOSED";
  participantsCount?: number;
  submissionsCount?: number;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface CourseItem {
  id: string;
  slug: string;
  title: string;
  thumbnail?: string | null;
  shortDescription: string;
  fullDescription: string;
  category: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  duration: string;
  skills: string[];
  instructor: string;
  isFree: boolean;
  price?: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  resources?: string[];
  moduleCount?: number;
  lessonCount?: number;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface CourseModuleItem {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface CourseLessonItem {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  notes?: string | null;
  resources?: string[];
  githubUrl?: string | null;
  assignment?: string | null;
  orderIndex: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface SubmissionItem {
  id: string;
  targetType: "PROJECT" | "HACKATHON";
  targetId: string;
  targetTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  githubUrl: string;
  liveUrl?: string | null;
  demoVideoUrl?: string | null;
  description: string;
  techStack?: string[];
  notes?: string | null;
  submissionMethod: "WEBSITE" | "GOOGLE_FORM";
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  adminNotes?: string | null;
  aiEvaluation?: {
    technicalQualityScore: number;
    problemUnderstandingScore: number;
    innovationScore: number;
    completenessScore: number;
    documentationScore: number;
    requirementComplianceScore: number;
    overallScore: number;
    aiAssistanceIndicator: string;
    aiAssistanceRationale: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendation: "SHORTLIST" | "REVIEW_REQUIRED" | "REJECT";
    feedbackSummary: string;
    evaluatedAt?: string;
  } | null;
  roundNumber?: number;
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string | null;
}

/**
 * Validates whether a deadline date has passed based on current server UTC time.
 */
export function isDeadlinePassed(deadline?: string | Date | null): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return false;
  return Date.now() > deadlineDate.getTime();
}

/**
 * Formats a Date or ISO string into Indian Standard Time (IST).
 */
export function formatISTDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "No Deadline";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
}

/**
 * Standard slug generator.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
