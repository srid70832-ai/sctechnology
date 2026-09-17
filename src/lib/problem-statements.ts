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
  onSnapshot,
  serverTimestamp, 
  Timestamp,
  Unsubscribe
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
  hackathonId?: string | null;
  hackathonTitle?: string;
  problemCode?: string; // e.g. "PS-01", "AI-HLT-01"
  title: string;
  category?: string;
  problemCategory?: string;
  domain?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  description?: string;
  shortDescription: string;
  fullProblemDescription?: string;
  background?: string;
  targetUsers?: string;
  existingChallenges?: string;
  expectedOutcome?: string;
  expectedSolution?: string;
  objectives?: string[];
  requirements?: string[];
  proposedSolutionAreas?: string[];
  requiredSkills?: string[];
  technologySuggestions?: string[];
  constraints?: string;
  eligibility?: string;
  teamSizeMin?: number;
  teamSizeMax?: number;
  submissionRequirements?: string;
  evaluationCriteria?: EvaluationCriterion[];
  resources?: string[];
  suggestedDeliverables?: string;
  organization?: string;
  organizationType?: "GOVERNMENT" | "INDUSTRY" | "NON_PROFIT" | "ACADEMIC" | "SC_TECH_ORIGINAL";
  location?: string;
  deadline?: string;
  sourceUrl?: string;
  sourceName?: string;
  isAiGenerated?: boolean;
  verificationStatus?: "VERIFIED" | "REQUIRES_VERIFICATION" | "SC_TECH_ORIGINAL";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | "PENDING_REVIEW" | "CLOSED";
  scheduledReleaseAt?: string | null;
  publishedAt?: string | null;
  displayOrder?: number;
  createdBy?: string;
  updatedBy?: string;
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
  { category: "Problem Understanding & Architecture", maxMarks: 20, description: "Depth of solution comprehension and system design." },
  { category: "Technical Implementation & Code Quality", maxMarks: 30, description: "Quality, completeness, and robustness of implementation." },
  { category: "Innovation & Practical Impact", maxMarks: 25, description: "Novelty of approach and real-world utility." },
  { category: "UI/UX & Deliverable Presentation", maxMarks: 25, description: "Usability, documentation, and live demo execution." },
];

// Helper: Slugify title
export function generateSlug(title: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-4)}`;
}

// 1. Get Published & Released Problem Statements for Students
export async function getPublishedProblemStatements(filters?: {
  hackathonId?: string;
  domain?: string;
  difficulty?: string;
  search?: string;
}): Promise<ProblemStatement[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.hackathonId) params.set("hackathonId", filters.hackathonId);
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

  // Fallback to client Firestore query for published & released problem statements
  try {
    const colRef = collection(db, "problemStatements");
    let q = query(colRef, where("status", "==", "PUBLISHED"));
    if (filters?.hackathonId) {
      q = query(colRef, where("hackathonId", "==", filters.hackathonId), where("status", "==", "PUBLISHED"));
    }
    const snap = await getDocs(q);
    const now = Date.now();
    const list: ProblemStatement[] = [];
    snap.forEach((d) => {
      const data = d.data() as ProblemStatement;
      // Filter out unreleased scheduled problems on client if present
      if (data.scheduledReleaseAt && new Date(data.scheduledReleaseAt).getTime() > now) {
        return;
      }
      list.push({ id: d.id, ...data });
    });
    // Sort by displayOrder ascending, then createdAt descending
    list.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
    return list;
  } catch (err) {
    console.error("Error fetching published problem statements:", err);
    return [];
  }
}

// 2. Real-Time Listener for Student Hackathon Problem Statements
export function subscribeToHackathonProblemStatements(
  hackathonId: string,
  onUpdate: (problems: ProblemStatement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, "problemStatements");
    const q = query(
      colRef,
      where("hackathonId", "==", hackathonId),
      where("status", "==", "PUBLISHED")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const list: ProblemStatement[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ProblemStatement;
          if (data.scheduledReleaseAt && new Date(data.scheduledReleaseAt).getTime() > now) {
            return;
          }
          list.push({ id: docSnap.id, ...data });
        });
        list.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
        onUpdate(list);
      },
      (err) => {
        console.warn("Real-time problem statement sync notice:", err);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn("Failed to attach onSnapshot listener:", err);
    return () => {};
  }
}

// 3. Get Single Problem Statement by ID or Slug
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

// 4. Admin: Get All Problem Statements (Drafts, Published, Scheduled, etc.)
export async function getAllProblemStatementsAdmin(
  statusFilter?: string, 
  hackathonId?: string,
  token?: string
): Promise<ProblemStatement[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }
  if (hackathonId && hackathonId !== "ALL") {
    params.set("hackathonId", hackathonId);
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

// 5. Save Problem Statement (Create / Update / Publish / Schedule)
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

// 6. Update Status (Publish, Schedule, Draft, Archive)
export async function updateProblemStatus(
  id: string, 
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | "PENDING_REVIEW" | "CLOSED",
  adminUid: string,
  token?: string,
  scheduledReleaseAt?: string | null
): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const payload: any = { status };
    if (status === "SCHEDULED" && scheduledReleaseAt) {
      payload.scheduledReleaseAt = scheduledReleaseAt;
    } else if (status === "PUBLISHED") {
      payload.publishedAt = new Date().toISOString();
    }

    const res = await fetch(`/api/problem-statements/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
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

// 7. Delete Problem Statement
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
