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

export interface EvaluationCriterion {
  category: string;
  maxMarks: number;
  description: string;
}

export interface ProblemStatement {
  id?: string;
  problemStatementId?: string;
  slug?: string;
  title: string;
  shortDescription: string;
  fullProblemDescription: string;
  background: string;
  problemCategory: string;
  domain: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  organization: string;
  organizationType: "GOVERNMENT" | "INDUSTRY" | "NON_PROFIT" | "ACADEMIC" | "SC_TECH_ORIGINAL";
  location: string;
  targetUsers: string;
  existingChallenges: string;
  expectedOutcome: string;
  proposedSolutionAreas: string[];
  requiredSkills: string[];
  technologySuggestions: string[];
  constraints: string;
  eligibility: string;
  teamSizeMin: number;
  teamSizeMax: number;
  submissionRequirements: string;
  evaluationCriteria: EvaluationCriterion[];
  deadline: string;
  sourceUrl?: string;
  sourceName?: string;
  isAiGenerated?: boolean;
  verificationStatus?: "VERIFIED" | "REQUIRES_VERIFICATION" | "SC_TECH_ORIGINAL";
  createdBy: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  createdAt?: any;
  updatedAt?: any;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: "LEADER" | "MEMBER";
}

export interface ProblemTeam {
  id?: string;
  teamId?: string;
  problemStatementId: string;
  problemTitle?: string;
  teamName: string;
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  memberIds: string[];
  members: TeamMember[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ProblemProject {
  id?: string;
  projectId?: string;
  problemStatementId: string;
  problemTitle?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  teamId?: string;
  teamName?: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  documentationUrl?: string;
  videoUrl?: string;
  sourceCodeUrl?: string;
  presentationUrl?: string;
  submissionStatus: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "SHORTLISTED" | "REJECTED" | "WINNER";
  submittedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface ProblemEvaluation {
  id?: string;
  evaluationId?: string;
  projectId: string;
  problemStatementId: string;
  judgeId: string;
  judgeName?: string;
  scores: { [criterion: string]: number };
  totalScore: number;
  feedback: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SavedProblem {
  id?: string;
  userId: string;
  problemStatementId: string;
  problemTitle: string;
  domain: string;
  difficulty: string;
  createdAt?: any;
}

export interface AiGenerationAudit {
  id?: string;
  generationId?: string;
  userId: string;
  type: "PROBLEM_STATEMENT_GENERATION" | "PROJECT_ANALYSIS";
  input: any;
  output: any;
  model: string;
  createdAt?: any;
}

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  { category: "Problem Understanding", maxMarks: 15, description: "Depth of comprehension of the domain problem and target user pain points." },
  { category: "Innovation & Uniqueness", maxMarks: 15, description: "Novelty of approach compared to existing legacy systems." },
  { category: "Technical Implementation", maxMarks: 20, description: "Code quality, architecture design, and robustness of implementation." },
  { category: "Feasibility & Practicality", maxMarks: 15, description: "Viability of real-world deployment and operational cost." },
  { category: "UI/UX & Accessibility", maxMarks: 10, description: "Intuitive interface, accessibility standards, and clean experience." },
  { category: "Scalability & Performance", maxMarks: 15, description: "Capability to handle high data throughput and concurrent load." },
  { category: "Presentation & Demo", maxMarks: 10, description: "Clarity of demonstration, documentation, and live demo reliability." },
];

// Helper: Slugify title
export function generateSlug(title: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-4)}`;
}

// 1. Get Published Problem Statements for Students
export async function getPublishedProblemStatements(filters?: {
  domain?: string;
  difficulty?: string;
  search?: string;
}): Promise<ProblemStatement[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.domain && filters.domain !== "All") params.set("domain", filters.domain);
    if (filters?.difficulty && filters.difficulty !== "All") params.set("difficulty", filters.difficulty);
    if (filters?.search && filters.search.trim()) params.set("search", filters.search.trim());

    const res = await fetch(`/api/problem-statements?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.statements || data.problemStatements || [];
    }
  } catch (err) {
    console.warn("API fetch problem statements notice:", err);
  }

  // Fallback to client Firestore query for published problem statements
  try {
    const colRef = collection(db, "problemStatements");
    const q = query(colRef, where("status", "==", "PUBLISHED"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: ProblemStatement[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as ProblemStatement) });
    });
    return list;
  } catch (err) {
    console.error("Error fetching published problem statements:", err);
    return [];
  }
}

// 2. Get Problem Statement by ID or Slug
export async function getProblemStatementById(idOrSlug: string): Promise<ProblemStatement | null> {
  try {
    const res = await fetch(`/api/problem-statements/${encodeURIComponent(idOrSlug)}`);
    if (res.ok) {
      const data = await res.json();
      return data.statement || data.problemStatement || null;
    }
  } catch (err) {
    console.warn("API fetch single problem statement notice:", err);
  }

  // Fallback to Firestore
  try {
    const docRef = doc(db, "problemStatements", idOrSlug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as ProblemStatement) };
    }
    const colRef = collection(db, "problemStatements");
    const q = query(colRef, where("slug", "==", idOrSlug), limit(1));
    const slugSnap = await getDocs(q);
    if (!slugSnap.empty) {
      return { id: slugSnap.docs[0].id, ...(slugSnap.docs[0].data() as ProblemStatement) };
    }
    return null;
  } catch (err) {
    console.error("Error fetching problem statement:", err);
    return null;
  }
}

// 3. Admin: Get All Problem Statements (Drafts, Published, etc.)
export async function getAllProblemStatementsAdmin(statusFilter?: string, token?: string): Promise<ProblemStatement[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/problem-statements?${params.toString()}`, { headers });
  if (res.ok) {
    const data = await res.json();
    return data.statements || data.problemStatements || [];
  }

  const errData = await res.json().catch(() => ({}));
  throw new Error(errData.error || `Server responded with status ${res.status}`);
}

// 4. Save Problem Statement (Create / Update)
export async function saveProblemStatement(
  data: Partial<ProblemStatement>,
  adminUid: string,
  existingId?: string,
  token?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    if (existingId) {
      const res = await fetch(`/api/problem-statements/${encodeURIComponent(existingId)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success !== false) {
        return { success: true, id: existingId };
      }
      return { success: false, error: resData.error || "Failed to update problem statement" };
    } else {
      const res = await fetch(`/api/problem-statements`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success !== false) {
        return { success: true, id: resData.id };
      }
      return { success: false, error: resData.error || "Failed to create problem statement" };
    }
  } catch (err: any) {
    console.error("API save problem statement error:", err);
    return { success: false, error: err?.message || "Network error while saving problem statement" };
  }
}

// 5. Update Status (Publish, Archive, etc.)
export async function updateProblemStatus(
  id: string, 
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "CLOSED" | "ARCHIVED",
  adminUid: string,
  token?: string
): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/problem-statements/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const resData = await res.json().catch(() => ({}));
      return resData.success !== false;
    }
    return false;
  } catch (err) {
    console.error("API update problem status error:", err);
    return false;
  }
}

// 6. Delete Problem Statement
export async function deleteProblemStatement(id: string, adminUid: string, token?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/problem-statements/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      const resData = await res.json().catch(() => ({}));
      return resData.success !== false;
    }
    return false;
  } catch (err) {
    console.error("API delete problem statement error:", err);
    return false;
  }
}

