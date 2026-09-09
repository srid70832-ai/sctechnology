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
import { removeUndefinedValues } from "./firestore";
import { 
  IdeaSubmission, 
  IdeaStatus, 
  ConnectionRequest, 
  ConnectionStatus, 
  CompanyMatchItem, 
  generateIdeaId, 
  generateConnectionId 
} from "./idea-link-models";

const IDEAS_COLLECTION = "scIdeaLinkIdeas";
const CONNECTIONS_COLLECTION = "scIdeaLinkConnections";

// Global persistent state cache for high-velocity & failover persistence
const g = globalThis as unknown as {
  _scIdeaLinkIdeas?: Map<string, IdeaSubmission>;
  _scIdeaLinkConnections?: Map<string, ConnectionRequest>;
};
if (!g._scIdeaLinkIdeas) g._scIdeaLinkIdeas = new Map<string, IdeaSubmission>();
if (!g._scIdeaLinkConnections) g._scIdeaLinkConnections = new Map<string, ConnectionRequest>();

const memoryIdeasMap = g._scIdeaLinkIdeas;
const memoryConnectionsMap = g._scIdeaLinkConnections;

export async function submitIdea(params: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCollege?: string;
  studentPhone?: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  targetUsers: string;
  industry: string;
  technologyUsed: string[];
  businessModel: string;
  expectedImpact: string;
  pitchDeckUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
}): Promise<{ success: boolean; idea: IdeaSubmission }> {
  const ideaId = generateIdeaId();
  const now = new Date().toISOString();

  const newIdea: IdeaSubmission = {
    id: ideaId,
    studentId: params.studentId,
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    studentCollege: params.studentCollege || "",
    studentPhone: params.studentPhone || "",
    title: params.title.trim(),
    description: params.description.trim(),
    problem: params.problem.trim(),
    solution: params.solution.trim(),
    targetUsers: params.targetUsers.trim(),
    industry: params.industry.trim(),
    technologyUsed: params.technologyUsed || [],
    businessModel: params.businessModel.trim(),
    expectedImpact: params.expectedImpact.trim(),
    pitchDeckUrl: params.pitchDeckUrl?.trim() || undefined,
    demoUrl: params.demoUrl?.trim() || undefined,
    githubUrl: params.githubUrl?.trim() || undefined,
    status: "SUBMITTED",
    auditTrail: [
      {
        timestamp: now,
        actor: params.studentName,
        actorRole: "STUDENT",
        action: "IDEA_SUBMITTED",
        details: "Startup idea submitted for SC TECH evaluation and industry matching.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  memoryIdeasMap.set(ideaId, newIdea);

  try {
    const docRef = doc(db, IDEAS_COLLECTION, ideaId);
    const cleaned = removeUndefinedValues(newIdea);
    await setDoc(docRef, cleaned);
  } catch (err) {
    console.warn("Firestore save failed for idea, stored in memory cache:", err);
  }

  return { success: true, idea: newIdea };
}

export async function getStudentIdeas(studentId: string): Promise<IdeaSubmission[]> {
  const result: IdeaSubmission[] = [];
  try {
    const q = query(collection(db, IDEAS_COLLECTION), where("studentId", "==", studentId));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const item = d.data() as IdeaSubmission;
      memoryIdeasMap.set(item.id, item);
      result.push(item);
    });
  } catch (err) {
    console.warn("Firestore query failed, using memory cache:", err);
  }

  // Merge with memory cache
  const cachedIdeas = Array.from(memoryIdeasMap.values());
  for (let i = 0; i < cachedIdeas.length; i++) {
    const idea = cachedIdeas[i];
    if (idea.studentId === studentId && !result.some((r) => r.id === idea.id)) {
      result.push(idea);
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

export async function getIdeaById(ideaId: string): Promise<IdeaSubmission | null> {
  if (memoryIdeasMap.has(ideaId)) {
    return memoryIdeasMap.get(ideaId)!;
  }
  try {
    const docRef = doc(db, IDEAS_COLLECTION, ideaId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const item = snap.data() as IdeaSubmission;
      memoryIdeasMap.set(item.id, item);
      return item;
    }
  } catch (err) {
    console.warn("Firestore getDoc failed, looking in memory cache:", err);
  }
  return memoryIdeasMap.get(ideaId) || null;
}

export async function getAllIdeasForAdmin(): Promise<{
  ideas: IdeaSubmission[];
  metrics: {
    totalIdeas: number;
    pendingReview: number;
    approvedIdeas: number;
    rejectedIdeas: number;
    aiAnalyzed: number;
    matchesShared: number;
  };
}> {
  const result: IdeaSubmission[] = [];
  try {
    const snap = await getDocs(collection(db, IDEAS_COLLECTION));
    snap.forEach((d) => {
      const item = d.data() as IdeaSubmission;
      memoryIdeasMap.set(item.id, item);
      result.push(item);
    });
  } catch (err) {
    console.warn("Firestore getAllIdeas failed, loading memory cache:", err);
  }

  const cachedIdeas = Array.from(memoryIdeasMap.values());
  for (let i = 0; i < cachedIdeas.length; i++) {
    const idea = cachedIdeas[i];
    if (!result.some((r) => r.id === idea.id)) {
      result.push(idea);
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const metrics = {
    totalIdeas: result.length,
    pendingReview: result.filter((i) => i.status === "SUBMITTED" || i.status === "UNDER_REVIEW").length,
    approvedIdeas: result.filter((i) => i.status === "APPROVED" || i.status === "AI_ANALYZED" || i.status === "MATCHES_SHARED").length,
    rejectedIdeas: result.filter((i) => i.status === "REJECTED").length,
    aiAnalyzed: result.filter((i) => i.status === "AI_ANALYZED" || i.status === "MATCHES_SHARED").length,
    matchesShared: result.filter((i) => i.status === "MATCHES_SHARED").length,
  };

  return { ideas: result, metrics };
}

export async function adminReviewIdea(params: {
  ideaId: string;
  decision: "APPROVED" | "REJECTED" | "UNDER_REVIEW";
  adminNotes?: string;
  adminId?: string;
  adminName?: string;
}): Promise<IdeaSubmission> {
  const existing = await getIdeaById(params.ideaId);
  if (!existing) {
    throw new Error(`Idea with ID ${params.ideaId} not found.`);
  }

  const now = new Date().toISOString();
  const reviewer = params.adminName || "Admin Team";

  existing.status = params.decision as IdeaStatus;
  existing.adminNotes = params.adminNotes || "";
  existing.adminReviewerName = reviewer;
  existing.reviewedAt = now;
  existing.updatedAt = now;

  existing.auditTrail.push({
    timestamp: now,
    actor: reviewer,
    actorRole: "ADMIN",
    action: `IDEA_${params.decision}`,
    details: params.adminNotes || `Idea marked as ${params.decision}.`,
  });

  memoryIdeasMap.set(existing.id, existing);

  try {
    const docRef = doc(db, IDEAS_COLLECTION, params.ideaId);
    const cleaned = removeUndefinedValues(existing);
    await updateDoc(docRef, cleaned as any);
  } catch (err) {
    console.warn("Firestore updateDoc failed, updated memory cache:", err);
  }

  return existing;
}

export async function saveAiAnalysisToIdea(
  ideaId: string,
  analysisData: {
    summary: string;
    targetMarketInsights: string;
    businessPotentialScore: number;
    suggestedCompanyCategories: string[];
    generatedMatches: CompanyMatchItem[];
    model?: string;
  }
): Promise<IdeaSubmission> {
  const existing = await getIdeaById(ideaId);
  if (!existing) {
    throw new Error(`Idea with ID ${ideaId} not found.`);
  }

  const now = new Date().toISOString();
  existing.aiAnalysis = {
    summary: analysisData.summary,
    targetMarketInsights: analysisData.targetMarketInsights,
    businessPotentialScore: analysisData.businessPotentialScore,
    suggestedCompanyCategories: analysisData.suggestedCompanyCategories,
    generatedMatches: analysisData.generatedMatches,
    analyzedAt: now,
    model: analysisData.model || "gemini-1.5-flash",
  };
  existing.status = "AI_ANALYZED";
  existing.updatedAt = now;

  existing.auditTrail.push({
    timestamp: now,
    actor: "Gemini 1.5 Flash",
    actorRole: "GEMINI_AI",
    action: "AI_ANALYSIS_COMPLETED",
    details: `Discovered ${analysisData.generatedMatches.length} authentic company/ecosystem synergy matches.`,
  });

  memoryIdeasMap.set(existing.id, existing);

  try {
    const docRef = doc(db, IDEAS_COLLECTION, ideaId);
    const cleaned = removeUndefinedValues(existing);
    await updateDoc(docRef, cleaned as any);
  } catch (err) {
    console.warn("Firestore updateDoc failed for AI analysis, saved to memory cache:", err);
  }

  return existing;
}

export async function adminShareCompanyMatches(params: {
  ideaId: string;
  selectedCompanies: CompanyMatchItem[];
  adminNotes?: string;
  adminId?: string;
  adminName?: string;
}): Promise<IdeaSubmission> {
  const existing = await getIdeaById(params.ideaId);
  if (!existing) {
    throw new Error(`Idea with ID ${params.ideaId} not found.`);
  }

  const now = new Date().toISOString();
  const reviewer = params.adminName || "SC TECH Admin";

  const approvedWithNotes = params.selectedCompanies.map((c) => ({
    ...c,
    isApprovedByAdmin: true,
    adminNotes: params.adminNotes || c.adminNotes,
    approvedAt: now,
  }));

  existing.approvedMatches = approvedWithNotes;
  existing.status = "MATCHES_SHARED";
  existing.adminNotes = params.adminNotes || existing.adminNotes;
  existing.updatedAt = now;

  existing.auditTrail.push({
    timestamp: now,
    actor: reviewer,
    actorRole: "ADMIN",
    action: "MATCHES_SHARED_WITH_STUDENT",
    details: `Approved and shared ${approvedWithNotes.length} verified company matches with student.`,
  });

  memoryIdeasMap.set(existing.id, existing);

  try {
    const docRef = doc(db, IDEAS_COLLECTION, params.ideaId);
    const cleaned = removeUndefinedValues(existing);
    await updateDoc(docRef, cleaned as any);
  } catch (err) {
    console.warn("Firestore updateDoc failed for share matches, saved to memory cache:", err);
  }

  return existing;
}

export async function createConnectionRequest(params: {
  ideaId: string;
  ideaTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  companyIndustry: string;
  companyWebsite: string;
  message?: string;
}): Promise<ConnectionRequest> {
  const connectionId = generateConnectionId(params.ideaId);
  const now = new Date().toISOString();

  const newConn: ConnectionRequest = {
    id: connectionId,
    ideaId: params.ideaId,
    ideaTitle: params.ideaTitle,
    studentId: params.studentId,
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    companyName: params.companyName,
    companyIndustry: params.companyIndustry,
    companyWebsite: params.companyWebsite,
    studentMessage: params.message?.trim() || "",
    status: "INTEREST_SENT",
    statusHistory: [
      {
        status: "INTEREST_SENT",
        updatedAt: now,
        updatedBy: params.studentName,
        note: params.message?.trim() || "Student expressed interest in connecting.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  memoryConnectionsMap.set(connectionId, newConn);

  try {
    const docRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    const cleaned = removeUndefinedValues(newConn);
    await setDoc(docRef, cleaned);
  } catch (err) {
    console.warn("Firestore setDoc failed for connection, saved in memory cache:", err);
  }

  // Also log into Idea audit trail
  try {
    const idea = await getIdeaById(params.ideaId);
    if (idea) {
      idea.auditTrail.push({
        timestamp: now,
        actor: params.studentName,
        actorRole: "STUDENT",
        action: "EXPRESSED_INTEREST",
        details: `Expressed interest in connecting with ${params.companyName}.`,
      });
      idea.updatedAt = now;
      memoryIdeasMap.set(idea.id, idea);
      const docRef = doc(db, IDEAS_COLLECTION, idea.id);
      await updateDoc(docRef, removeUndefinedValues(idea) as any);
    }
  } catch (err) {
    console.warn("Audit trail update failed for express interest:", err);
  }

  return newConn;
}

export async function getStudentConnections(studentId: string): Promise<ConnectionRequest[]> {
  const result: ConnectionRequest[] = [];
  try {
    const q = query(collection(db, CONNECTIONS_COLLECTION), where("studentId", "==", studentId));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const item = d.data() as ConnectionRequest;
      memoryConnectionsMap.set(item.id, item);
      result.push(item);
    });
  } catch (err) {
    console.warn("Firestore getStudentConnections failed:", err);
  }

  const cachedConns = Array.from(memoryConnectionsMap.values());
  for (let i = 0; i < cachedConns.length; i++) {
    const conn = cachedConns[i];
    if (conn.studentId === studentId && !result.some((r) => r.id === conn.id)) {
      result.push(conn);
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

export async function getAllConnectionsForAdmin(): Promise<{
  connections: ConnectionRequest[];
  metrics: {
    totalRequests: number;
    interestSent: number;
    companyReview: number;
    connectionPending: number;
    connected: number;
    closed: number;
  };
}> {
  const result: ConnectionRequest[] = [];
  try {
    const snap = await getDocs(collection(db, CONNECTIONS_COLLECTION));
    snap.forEach((d) => {
      const item = d.data() as ConnectionRequest;
      memoryConnectionsMap.set(item.id, item);
      result.push(item);
    });
  } catch (err) {
    console.warn("Firestore getAllConnections failed:", err);
  }

  const cachedConns = Array.from(memoryConnectionsMap.values());
  for (let i = 0; i < cachedConns.length; i++) {
    const conn = cachedConns[i];
    if (!result.some((r) => r.id === conn.id)) {
      result.push(conn);
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const metrics = {
    totalRequests: result.length,
    interestSent: result.filter((c) => c.status === "INTEREST_SENT").length,
    companyReview: result.filter((c) => c.status === "COMPANY_REVIEW").length,
    connectionPending: result.filter((c) => c.status === "CONNECTION_PENDING").length,
    connected: result.filter((c) => c.status === "CONNECTED").length,
    closed: result.filter((c) => c.status === "CLOSED").length,
  };

  return { connections: result, metrics };
}

export async function adminUpdateConnectionStatus(params: {
  connectionId: string;
  status: ConnectionStatus;
  adminNotes?: string;
  adminId?: string;
  adminName?: string;
}): Promise<ConnectionRequest> {
  let existing = memoryConnectionsMap.get(params.connectionId);
  if (!existing) {
    try {
      const docRef = doc(db, CONNECTIONS_COLLECTION, params.connectionId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        existing = snap.data() as ConnectionRequest;
      }
    } catch (err) {
      console.warn("Firestore getDoc failed for connection:", err);
    }
  }

  if (!existing) {
    throw new Error(`Connection request with ID ${params.connectionId} not found.`);
  }

  const now = new Date().toISOString();
  const updater = params.adminName || "SC TECH Venture Partner";

  existing.status = params.status;
  existing.adminNotes = params.adminNotes || existing.adminNotes;
  existing.updatedAt = now;

  existing.statusHistory.push({
    status: params.status,
    updatedAt: now,
    updatedBy: updater,
    note: params.adminNotes || `Status updated to ${params.status}`,
  });

  memoryConnectionsMap.set(existing.id, existing);

  try {
    const docRef = doc(db, CONNECTIONS_COLLECTION, params.connectionId);
    const cleaned = removeUndefinedValues(existing);
    await updateDoc(docRef, cleaned as any);
  } catch (err) {
    console.warn("Firestore updateDoc failed for connection status:", err);
  }

  return existing;
}
