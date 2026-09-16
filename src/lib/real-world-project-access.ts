import { DEFAULT_PLANS } from "@/lib/plans";
import { getAdminDb } from "@/lib/firebase-admin";

const MINIMUM_PROJECT_PLAN_PRICE = 399;

export interface RealWorldProjectsAccessResult {
  hasAccess: boolean;
  uid: string | null;
  planCode: string;
  planName: string;
  planPrice: number;
  reason: "ADMIN" | "ACTIVE_ENTITLEMENT" | "UNAUTHENTICATED" | "NO_ACTIVE_SUBSCRIPTION" | "INSUFFICIENT_PLAN";
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    return new Date(Number((value as { _seconds: number })._seconds) * 1000);
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function subscriptionIsActive(subscription: Record<string, any>): boolean {
  if (String(subscription.status || "").toUpperCase() !== "ACTIVE") return false;

  const expiresAt = toDate(subscription.expiresAt || subscription.endDate);
  return Boolean(expiresAt && expiresAt.getTime() > Date.now());
}

export async function hasRealWorldProjectsAccess(user: {
  uid?: string | null;
  role?: string | null;
} | null): Promise<RealWorldProjectsAccessResult> {
  const uid = user?.uid || null;
  if (!uid) {
    return { hasAccess: false, uid: null, planCode: "NONE", planName: "Unauthenticated", planPrice: 0, reason: "UNAUTHENTICATED" };
  }

  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    return { hasAccess: true, uid, planCode: "ADMIN", planName: "Admin Access", planPrice: Number.MAX_SAFE_INTEGER, reason: "ADMIN" };
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error("Firebase Admin SDK is unavailable");
  }

  const subscriptionSnap = await adminDb.collection("subscriptions").doc(uid).get();
  if (!subscriptionSnap.exists) {
    return { hasAccess: false, uid, planCode: "NONE", planName: "No active subscription", planPrice: 0, reason: "NO_ACTIVE_SUBSCRIPTION" };
  }

  const subscription = subscriptionSnap.data() || {};
  const planCode = String(subscription.planId || subscription.planCode || "FREE").toUpperCase();
  const planSnap = await adminDb.collection("plans").where("code", "==", planCode).limit(1).get();
  const firestorePlan = planSnap.empty ? null : planSnap.docs[0].data();
  const defaultPlan = DEFAULT_PLANS.find((plan) => plan.code === planCode);
  const planPrice = Number(firestorePlan?.priceMonthly ?? defaultPlan?.priceMonthly ?? subscription.amount ?? 0);
  const planName = String(subscription.planName || firestorePlan?.name || defaultPlan?.name || planCode);
  const active = subscriptionIsActive(subscription);
  const hasAccess = active && planPrice >= MINIMUM_PROJECT_PLAN_PRICE;

  return {
    hasAccess,
    uid,
    planCode,
    planName,
    planPrice,
    reason: !active ? "NO_ACTIVE_SUBSCRIPTION" : hasAccess ? "ACTIVE_ENTITLEMENT" : "INSUFFICIENT_PLAN",
  };
}

export function projectAccessError(result: RealWorldProjectsAccessResult) {
  return result.reason === "UNAUTHENTICATED"
    ? { error: "Authentication required", code: "AUTH_REQUIRED" }
    : { error: "Real-World Projects are available with Plus, Pro or Career plans.", code: "PROJECTS_UPGRADE_REQUIRED", planName: result.planName, planPrice: result.planPrice };
}