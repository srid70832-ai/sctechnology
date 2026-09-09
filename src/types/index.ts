export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN" | "JUDGE" | "HR" | "COMPANY";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  studentProfile?: any;
  activeSubscription?: any;
}

export interface PlanItem {
  id: string;
  name: string;
  code: string;
  price: number;
  interval: string;
  tagline?: string | null;
  features: string[];
  projectAccess: boolean;
  certificateAccess: boolean;
  hrSessionAccess: boolean;
  isPopular: boolean;
}

export interface InternshipItem {
  id: string;
  title: string;
  role: string;
  slug: string;
  companyName: string;
  companyLogo?: string | null;
  description: string;
  skills: string[];
  responsibilities?: string[];
  requirements?: string[];
  location: string;
  mode: string;
  duration: string;
  stipend: number;
  openings: number;
  deadline: string;
  applied?: boolean;
}

export interface HackathonItem {
  id: string;
  title: string;
  slug: string;
  tagLine?: string | null;
  description: string;
  problemStatement?: string | null;
  problemReleasedAt?: string | null;
  problemPublished: boolean;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  rules?: string[];
  faqs?: { q: string; a: string }[];
  isRegistered?: boolean;
  participantsCount?: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  features?: string[];
  techStack: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  isPremium: boolean;
  thumbnail?: string | null;
  demoUrl?: string | null;
  githubUrl?: string | null;
  downloadCount: number;
}
