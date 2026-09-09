export type IdeaStatus = 
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "AI_ANALYZED"
  | "MATCHES_SHARED"
  | "CLOSED";

export type ConnectionStatus = 
  | "INTEREST_SENT"
  | "COMPANY_REVIEW"
  | "CONNECTION_PENDING"
  | "CONNECTED"
  | "CLOSED";

export interface CompanyMatchItem {
  id: string;
  companyName: string;
  industry: string;
  logoUrl?: string;
  matchScore: number; // 0 to 100 (e.g. 92)
  whyItMatches: string;
  companySummary: string;
  relevantBusinessArea?: string;
  officialWebsite: string;
  isApprovedByAdmin: boolean;
  adminNotes?: string;
  approvedAt?: string;
}

export interface IdeaAuditLogItem {
  timestamp: string;
  actor: string;
  actorRole: "STUDENT" | "ADMIN" | "GEMINI_AI";
  action: string;
  details?: string;
}

export interface IdeaSubmission {
  id: string; // e.g. "SCIL-2026-A8F921"
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCollege?: string;
  studentPhone?: string;
  
  // Idea Details
  title: string;
  description: string;
  problem: string;
  solution: string;
  targetUsers: string;
  industry: string;
  technologyUsed: string[];
  businessModel: string;
  expectedImpact: string;
  
  // Optional Links
  pitchDeckUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  
  // Status & Review
  status: IdeaStatus;
  adminNotes?: string;
  adminReviewerName?: string;
  reviewedAt?: string;
  
  // Gemini AI Analysis
  aiAnalysis?: {
    summary: string;
    targetMarketInsights: string;
    businessPotentialScore: number;
    suggestedCompanyCategories: string[];
    generatedMatches: CompanyMatchItem[];
    analyzedAt: string;
    model: string;
  };
  
  // Approved Matches Shared with Student
  approvedMatches?: CompanyMatchItem[];
  
  // Audit Trail
  auditTrail: IdeaAuditLogItem[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionRequest {
  id: string; // e.g. "CONN-SCIL-A8F921-01"
  ideaId: string;
  ideaTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  companyIndustry: string;
  companyWebsite: string;
  studentMessage?: string;
  status: ConnectionStatus;
  adminNotes?: string;
  statusHistory: {
    status: ConnectionStatus;
    updatedAt: string;
    updatedBy: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export function generateIdeaId(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SCIL-${year}-${randomChars}`;
}

export function generateConnectionId(ideaId: string): string {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CONN-${ideaId.replace('SCIL-', '')}-${randomChars}`;
}
