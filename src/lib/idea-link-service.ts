import { getAdminDb } from "./firebase-admin";
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

function ideasCollection() {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
  return adminDb.collection(IDEAS_COLLECTION);
}

function connectionsCollection() {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
  return adminDb.collection(CONNECTIONS_COLLECTION);
}

function serializeFirestoreValue(value: any): any {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeFirestoreValue(item)]));
  }
  return value;
}

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

  const cleaned = removeUndefinedValues(newIdea);
  await ideasCollection().doc(ideaId).set(cleaned);

  return { success: true, idea: newIdea };
}

export async function getStudentIdeas(studentId: string): Promise<IdeaSubmission[]> {
  const result: IdeaSubmission[] = [];
  try {
    const snap = await ideasCollection().where("studentId", "==", studentId).get();
    snap.forEach((d) => result.push(serializeFirestoreValue({ id: d.id, ...d.data() }) as IdeaSubmission));
  } catch (err) {
    console.error("Firestore student ideas query failed:", err);
    throw err;
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

export async function getIdeaById(ideaId: string): Promise<IdeaSubmission | null> {
  try {
    const snap = await ideasCollection().doc(ideaId).get();
    if (snap.exists) {
      return serializeFirestoreValue({ id: snap.id, ...snap.data() }) as IdeaSubmission;
    }
  } catch (err) {
    console.error("Firestore idea lookup failed:", err);
    throw err;
  }
  return null;
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
    const snap = await ideasCollection().get();
    snap.forEach((d) => result.push(serializeFirestoreValue({ id: d.id, ...d.data() }) as IdeaSubmission));
  } catch (err) {
    console.error("Firestore getAllIdeas failed:", err);
    throw err;
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

  await ideasCollection().doc(params.ideaId).set(removeUndefinedValues(existing), { merge: true });

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

  await ideasCollection().doc(ideaId).set(removeUndefinedValues(existing), { merge: true });

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

  await ideasCollection().doc(params.ideaId).set(removeUndefinedValues(existing), { merge: true });

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

  await connectionsCollection().doc(connectionId).set(removeUndefinedValues(newConn));

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
      await ideasCollection().doc(idea.id).set(removeUndefinedValues(idea), { merge: true });
    }
  } catch (err) {
    console.error("Audit trail update failed for express interest:", err);
    throw err;
  }

  return newConn;
}

export async function getStudentConnections(studentId: string): Promise<ConnectionRequest[]> {
  const result: ConnectionRequest[] = [];
  try {
    const snap = await connectionsCollection().where("studentId", "==", studentId).get();
    snap.forEach((d) => result.push(serializeFirestoreValue({ id: d.id, ...d.data() }) as ConnectionRequest));
  } catch (err) {
    console.error("Firestore getStudentConnections failed:", err);
    throw err;
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
    const snap = await connectionsCollection().get();
    snap.forEach((d) => result.push(serializeFirestoreValue({ id: d.id, ...d.data() }) as ConnectionRequest));
  } catch (err) {
    console.error("Firestore getAllConnections failed:", err);
    throw err;
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
  let existing: ConnectionRequest | undefined;
  try {
    const snap = await connectionsCollection().doc(params.connectionId).get();
    if (snap.exists) existing = serializeFirestoreValue({ id: snap.id, ...snap.data() }) as ConnectionRequest;
  } catch (err) {
    console.error("Firestore getDoc failed for connection:", err);
    throw err;
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

  await connectionsCollection().doc(params.connectionId).set(removeUndefinedValues(existing), { merge: true });

  return existing;
}
