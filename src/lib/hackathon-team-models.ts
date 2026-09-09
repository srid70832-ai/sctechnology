import { Timestamp } from "firebase/firestore";

export type RegistrationMode = "INDIVIDUAL_ONLY" | "TEAM_ONLY" | "BOTH";

export type TeamMemberRole = "LEADER" | "MEMBER";

export type RoundStatus = 
  | "REGISTERED" 
  | "ROUND_1_QUALIFIED" 
  | "ROUND_2_QUALIFIED" 
  | "FINALIST" 
  | "WINNER" 
  | "ELIMINATED";

export interface TeamMemberItem {
  userId: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  registrationNo: string;
  joinedAt: any;
  college?: string | null;
  department?: string | null;
}

export interface HackathonTeamSubmission {
  id?: string;
  projectName: string;
  repoUrl: string;
  liveUrl?: string | null;
  videoUrl?: string | null;
  techStack: string[];
  description: string;
  submittedAt: any;
  submittedBy: string; // leader userId
}

export interface HackathonTeam {
  id: string; // Firestore document ID e.g. team-{hackathonId}-{teamCode}
  teamId: string; // Human readable code e.g. SC26-TM-8F29
  hackathonId: string;
  hackathonTitle?: string;
  name: string;
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  joinCode: string; // 6-char code e.g. CW8F29
  inviteToken: string; // Unique URL token for direct invite links
  members: TeamMemberItem[];
  minTeamSize: number;
  maxTeamSize: number;
  round: number;
  roundStatus: RoundStatus;
  submission?: HackathonTeamSubmission | null;
  status: "ACTIVE" | "DISBANDED";
  createdAt: any;
  updatedAt: any;
}

export interface HackathonIndividualRegistration {
  id: string;
  hackathonId: string;
  userId: string;
  name: string;
  email: string;
  registrationNo: string;
  registeredAt: any;
  status: "CONFIRMED";
  round?: number;
  roundStatus?: RoundStatus;
  submission?: HackathonTeamSubmission | null;
}

/**
 * Generates a clean human-readable Team ID:
 * Format: SC26-TM-XXXX (where XXXX is 4 alphanumeric chars)
 */
export function generateTeamId(prefix = "SC26"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-TM-${randomPart}`;
}

/**
 * Generates a 6-character uppercase Join Code:
 * Format: CW8F29
 */
export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a URL-safe unique invite token.
 */
export function generateInviteToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
