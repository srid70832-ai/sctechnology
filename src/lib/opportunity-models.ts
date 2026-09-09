export type OpportunityType = "INTERNSHIP" | "HACKATHON" | "JOB";
export type OpportunitySourceType = "INTERNAL" | "EXTERNAL";
export type OpportunityMode = "Remote" | "Hybrid" | "On-site";
export type OpportunityStatus = "ACTIVE" | "EXPIRED" | "ARCHIVED" | "PENDING_REVIEW";

export interface OpportunityItem {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  role?: string;
  description: string;
  location: string;
  mode: OpportunityMode;
  opportunityType: OpportunityType;
  sourceType: OpportunitySourceType;
  sourceName: string;
  sourceUrl: string;
  applyUrl: string;
  skills: string[];
  eligibility?: string | null;
  stipend?: string | number | null;
  isFree?: boolean;
  prize?: string | number | null;
  teamSize?: string | number | null;
  startDate?: string | null;
  endDate?: string | null;
  deadline?: string | null;
  featured?: boolean;
  hidden?: boolean;
  status: OpportunityStatus;
  publishedAt: string;
  fetchedAt: string;
  lastVerifiedAt?: string;
  dedupKey: string;
  tags?: string[];
  category?: string;
}

export interface OpportunitySourceConfig {
  id: string;
  name: string;
  type: OpportunityType;
  endpointUrl: string;
  format: "JSON" | "RSS";
  enabled: boolean;
  lastSyncedAt?: string;
  itemCount?: number;
}

export interface OpportunitySyncResult {
  sourceName: string;
  totalFetched: number;
  newAdded: number;
  updated: number;
  errors: number;
  errorDetails?: string[];
}
