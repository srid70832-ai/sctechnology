import { SessionPayload } from "./auth";

export type Role = "STUDENT" | "ADMIN" | "SUPER_ADMIN" | "JUDGE" | "HR" | "COMPANY";

export const PERMISSIONS = {
  ADMIN_ACCESS: ["ADMIN", "SUPER_ADMIN"],
  COMPANY_ACCESS: ["COMPANY", "HR", "ADMIN", "SUPER_ADMIN"],
  JUDGE_ACCESS: ["JUDGE", "ADMIN", "SUPER_ADMIN"],
  STUDENT_ACCESS: ["STUDENT", "ADMIN", "SUPER_ADMIN"],
};

export function hasPermission(userRole: string, allowedRoles: string[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return allowedRoles.includes(userRole);
}

export function requireRole(session: SessionPayload | null, allowedRoles: string[]): boolean {
  if (!session) return false;
  return hasPermission(session.role, allowedRoles);
}
