import { DEFAULT_PLANS } from "@/lib/plans";
import { getAdminDb } from "@/lib/firebase-admin";
import { REAL_WORLD_PROJECTS } from "@/lib/projects-data";

const MINIMUM_PROJECT_PLAN_PRICE = 399;

export interface RealWorldProjectsAccessResult {
  hasAccess: boolean;
  uid: string | null;
  planCode: string;
  planName: string;
  planPrice: number;
  accessType?: "FREE" | "PRO";
  reason: "ADMIN" | "ACTIVE_ENTITLEMENT" | "FREE_PROJECT" | "UNAUTHENTICATED" | "NO_ACTIVE_SUBSCRIPTION" | "INSUFFICIENT_PLAN";
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

export async function hasRealWorldProjectsAccess(
  user: {
    uid?: string | null;
    role?: string | null;
  } | null,
  projectId?: string | null
): Promise<RealWorldProjectsAccessResult> {
  const uid = user?.uid || null;

  // 1. Check if the specific project is marked as FREE
  if (projectId) {
    let isFree = false;
    const adminDb = getAdminDb();
    if (adminDb) {
      try {
        const docSnap = await adminDb.collection("projects").doc(projectId).get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (
            String(data?.accessType || "").toUpperCase() === "FREE" ||
            String(data?.accessLevel || "").toUpperCase() === "FREE" ||
            data?.isFree === true ||
            data?.isPremium === false
          ) {
            isFree = true;
          }
        } else {
          const querySnap = await adminDb.collection("projects").where("slug", "==", projectId).limit(1).get();
          if (!querySnap.empty) {
            const data = querySnap.docs[0].data();
            if (
              String(data?.accessType || "").toUpperCase() === "FREE" ||
              String(data?.accessLevel || "").toUpperCase() === "FREE" ||
              data?.isFree === true ||
              data?.isPremium === false
            ) {
              isFree = true;
            }
          }
        }
      } catch (err) {
        console.warn("Error checking Firestore project free status:", err);
      }
    }

    if (!isFree) {
      const blueprint = REAL_WORLD_PROJECTS.find((p) => p.slug === projectId || p.id === projectId);
      if (
        blueprint &&
        (String(blueprint.accessType || "").toUpperCase() === "FREE" ||
          String(blueprint.accessLevel || "").toUpperCase() === "FREE" ||
          blueprint.isPremium === false)
      ) {
        isFree = true;
      }
    }

    if (isFree) {
      return {
        hasAccess: true,
        uid,
        planCode: "FREE",
        planName: "Free Project Access",
        planPrice: 0,
        accessType: "FREE",
        reason: "FREE_PROJECT",
      };
    }
  }

  // 2. Authentication check for PRO projects
  if (!uid) {
    return {
      hasAccess: false,
      uid: null,
      planCode: "NONE",
      planName: "Unauthenticated",
      planPrice: 0,
      accessType: "PRO",
      reason: "UNAUTHENTICATED",
    };
  }

  // 3. Admin & Super Admin Bypass
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    return {
      hasAccess: true,
      uid,
      planCode: "ADMIN",
      planName: "Admin Access",
      planPrice: Number.MAX_SAFE_INTEGER,
      accessType: "PRO",
      reason: "ADMIN",
    };
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error("Firebase Admin SDK is unavailable");
  }

  // 4. Check direct project purchase or enrollment if projectId is supplied
  if (projectId) {
    const purchaseSnap = await adminDb.collection("projectPurchases")
      .where("userId", "==", uid)
      .where("status", "==", "PAID")
      .get();
    
    for (const doc of purchaseSnap.docs) {
      const data = doc.data();
      if (data.projectId === projectId || data.projectSlug === projectId || doc.id === `${uid}_${projectId}`) {
        return {
          hasAccess: true,
          uid,
          planCode: "DIRECT_PURCHASE",
          planName: data.projectTitle || "Purchased Project",
          planPrice: data.amount || 299,
          accessType: "PRO",
          reason: "ACTIVE_ENTITLEMENT",
        };
      }
    }

    const enrollmentSnap = await adminDb.collection("projectEnrollments")
      .where("studentId", "==", uid)
      .where("paymentStatus", "==", "PAID")
      .get();

    for (const doc of enrollmentSnap.docs) {
      const data = doc.data();
      if (data.projectId === projectId || data.projectSlug === projectId) {
        return {
          hasAccess: true,
          uid,
          planCode: data.planId || "DIRECT_PURCHASE",
          planName: data.projectTitle || "Enrolled Project",
          planPrice: data.activationFee || 299,
          accessType: "PRO",
          reason: "ACTIVE_ENTITLEMENT",
        };
      }
    }
  }

  // 5. Check active subscription
  const subscriptionSnap = await adminDb.collection("subscriptions").doc(uid).get();
  if (!subscriptionSnap.exists) {
    return {
      hasAccess: false,
      uid,
      planCode: "NONE",
      planName: "No active subscription",
      planPrice: 0,
      accessType: "PRO",
      reason: "NO_ACTIVE_SUBSCRIPTION",
    };
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
    accessType: "PRO",
    reason: !active ? "NO_ACTIVE_SUBSCRIPTION" : hasAccess ? "ACTIVE_ENTITLEMENT" : "INSUFFICIENT_PLAN",
  };
}

export function projectAccessError(result: RealWorldProjectsAccessResult) {
  return result.reason === "UNAUTHENTICATED"
    ? { error: "Authentication required", code: "AUTH_REQUIRED" }
    : {
        error: "Real-World Pro Projects require an active Plus, Pro or Career plan.",
        code: "PROJECTS_UPGRADE_REQUIRED",
        planName: result.planName,
        planPrice: result.planPrice,
        accessType: result.accessType || "PRO",
      };
}