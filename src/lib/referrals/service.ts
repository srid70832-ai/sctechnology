import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment 
} from "firebase/firestore";

export interface ReferralProgramSettings {
  enabled: boolean;
  signupDiscountPercent: number;
  referralDiscountPercent: number;
  subscriptionRewardPercent: number;
  minimumSubscriptionAmount: number;
  maxRewardPerUser: number;
  allowHackathonReferral: boolean;
  allowFreeHackathonReferral: boolean;
  allowPaidHackathonReferral: boolean;
  freeHackathonRewardAmount: number;
  paidHackathonRewardPercent: number;
  allowDiscountStacking: boolean;
  updatedAt?: any;
  updatedBy?: string;
}

export const DEFAULT_REFERRAL_SETTINGS: ReferralProgramSettings = {
  enabled: true,
  signupDiscountPercent: 30,
  referralDiscountPercent: 35,
  subscriptionRewardPercent: 40,
  minimumSubscriptionAmount: 0,
  maxRewardPerUser: 10000,
  allowHackathonReferral: true,
  allowFreeHackathonReferral: true,
  allowPaidHackathonReferral: true,
  freeHackathonRewardAmount: 0,
  paidHackathonRewardPercent: 20,
  allowDiscountStacking: false,
};

export interface ReferralRecord {
  id: string;
  referralCode: string;
  referrerUid: string;
  referrerName: string;
  referrerEmail: string;
  referredUid: string;
  referredName: string;
  referredEmail: string;
  source: "WEBSITE" | "HACKATHON" | "SUBSCRIPTION";
  status: "CLICKED" | "SIGNED_UP" | "PROFILE_COMPLETED" | "HACKATHON_REGISTERED" | "SUBSCRIPTION_PURCHASED" | "REWARDED" | "CANCELLED";
  rewardStatus: "NONE" | "PENDING" | "REWARDED" | "CANCELLED";
  rewardAmount: number;
  eligibleAmount: number;
  rewardPercent: number;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: any;
  convertedAt?: any;
}

export interface UserReferralStats {
  userId: string;
  referralCode: string;
  referralUrl: string;
  referredBy?: string | null;
  referrerUid?: string | null;
  totalClicks: number;
  totalSignups: number;
  hackathonRegistrations: number;
  paidConversions: number;
  totalRewardsEarned: number;
  pendingRewards: number;
  createdAt?: any;
}

// Global persistent in-memory maps for high-velocity lookups & failover resilience
const g = globalThis as unknown as {
  _sctechUserReferrals?: Map<string, UserReferralStats>;
  _sctechReferrals?: Map<string, ReferralRecord>;
  _sctechReferralClicks?: any[];
  _sctechReferralSettings?: ReferralProgramSettings;
};

if (!g._sctechUserReferrals) g._sctechUserReferrals = new Map<string, UserReferralStats>();
if (!g._sctechReferrals) g._sctechReferrals = new Map<string, ReferralRecord>();
if (!g._sctechReferralClicks) g._sctechReferralClicks = [];
if (!g._sctechReferralSettings) g._sctechReferralSettings = { ...DEFAULT_REFERRAL_SETTINGS };

/**
 * Generates a clean, unique referral code for a user (e.g. SCTECH-A8K92)
 */
export function generateReferralCode(seed?: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  if (seed) {
    const cleanSeed = seed.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    randomPart = cleanSeed.slice(0, 3);
  }
  while (randomPart.length < 5) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SCTECH-${randomPart.slice(0, 5)}`;
}

/**
 * Fetch Admin-configured Referral Program Settings
 */
export async function getReferralSettings(): Promise<ReferralProgramSettings> {
  try {
    if (db) {
      const docRef = doc(db, "settings", "referralProgram");
      const snap = await getDoc(docRef);
      if (snap && typeof snap.exists === "function" && snap.exists()) {
        g._sctechReferralSettings = { ...DEFAULT_REFERRAL_SETTINGS, ...snap.data() } as ReferralProgramSettings;
        return g._sctechReferralSettings;
      } else if (snap && typeof snap.exists === "function" && !snap.exists()) {
        await setDoc(docRef, {
          ...DEFAULT_REFERRAL_SETTINGS,
          updatedAt: serverTimestamp(),
          updatedBy: "SYSTEM",
        }).catch(() => {});
      }
    }
  } catch (err) {
    // Graceful fallback to memory
  }

  return g._sctechReferralSettings || DEFAULT_REFERRAL_SETTINGS;
}

/**
 * Update Admin Referral Program Settings
 */
export async function updateReferralSettings(
  adminUid: string,
  adminEmail: string,
  newSettings: Partial<ReferralProgramSettings>
): Promise<ReferralProgramSettings> {
  const updated = {
    ...DEFAULT_REFERRAL_SETTINGS,
    ...g._sctechReferralSettings,
    ...newSettings,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || adminUid,
  };

  g._sctechReferralSettings = updated;

  try {
    if (db) {
      const docRef = doc(db, "settings", "referralProgram");
      await setDoc(docRef, { ...updated, updatedAt: serverTimestamp() }, { merge: true });

      await addDoc(collection(db, "referralAuditLogs"), {
        actorId: adminUid,
        actorEmail: adminEmail,
        action: "SETTINGS_UPDATED",
        details: newSettings,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }
  } catch (err) {}

  return updated;
}

/**
 * Get or automatically create a user's unique referral code & record
 */
export async function getOrCreateUserReferral(
  userId: string,
  name?: string,
  email?: string
): Promise<UserReferralStats> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Check in-memory store
  if (g._sctechUserReferrals?.has(userId)) {
    return g._sctechUserReferrals.get(userId)!;
  }

  try {
    if (db) {
      const userRefDoc = doc(db, "userReferrals", userId);
      const snap = await getDoc(userRefDoc);

      if (snap && typeof snap.exists === "function" && snap.exists()) {
        const data = snap.data();
        const record: UserReferralStats = {
          userId,
          referralCode: data.referralCode,
          referralUrl: `${baseUrl}/ref/${data.referralCode}`,
          referredBy: data.referredBy || null,
          referrerUid: data.referrerUid || null,
          totalClicks: data.totalClicks || 0,
          totalSignups: data.totalSignups || 0,
          hackathonRegistrations: data.hackathonRegistrations || 0,
          paidConversions: data.paidConversions || 0,
          totalRewardsEarned: data.totalRewardsEarned || 0,
          pendingRewards: data.pendingRewards || 0,
          createdAt: data.createdAt,
        };
        g._sctechUserReferrals?.set(userId, record);
        return record;
      }
    }
  } catch (err) {}

  // Create new record
  const referralCode = generateReferralCode(email || name || userId);
  const newRecord: UserReferralStats = {
    userId,
    referralCode,
    referralUrl: `${baseUrl}/ref/${referralCode}`,
    referredBy: null,
    referrerUid: null,
    totalClicks: 0,
    totalSignups: 0,
    hackathonRegistrations: 0,
    paidConversions: 0,
    totalRewardsEarned: 0,
    pendingRewards: 0,
    createdAt: new Date().toISOString(),
  };

  g._sctechUserReferrals?.set(userId, newRecord);

  try {
    if (db) {
      const userRefDoc = doc(db, "userReferrals", userId);
      await setDoc(userRefDoc, { ...newRecord, createdAt: serverTimestamp() }, { merge: true }).catch(() => {});
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, { referralCode, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
    }
  } catch (err) {}

  return newRecord;
}

/**
 * Record a click when /ref/<code> is visited
 */
export async function recordReferralClick({
  referralCode,
  source = "WEBSITE",
  targetUrl = "/",
  ip = "",
  userAgent = "",
}: {
  referralCode: string;
  source?: string;
  targetUrl?: string;
  ip?: string;
  userAgent?: string;
}) {
  if (!referralCode) return { success: false, error: "Missing referral code" };

  const cleanCode = referralCode.trim().toUpperCase();

  // Find referrer in memory or firestore
  let referrerUid: string | null = null;
  for (const [uid, stats] of Array.from(g._sctechUserReferrals?.entries() || [])) {
    if (stats.referralCode === cleanCode) {
      referrerUid = uid;
      stats.totalClicks += 1;
      break;
    }
  }

  g._sctechReferralClicks?.push({
    referralCode: cleanCode,
    referrerUid,
    source,
    targetUrl,
    ip,
    userAgent,
    createdAt: new Date().toISOString(),
  });

  try {
    if (db) {
      const userRefCol = collection(db, "userReferrals");
      const q = query(userRefCol, where("referralCode", "==", cleanCode), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        referrerUid = snap.docs[0].id;
        await updateDoc(snap.docs[0].ref, {
          totalClicks: increment(1),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }

      await addDoc(collection(db, "referralClicks"), {
        referralCode: cleanCode,
        referrerUid,
        source,
        targetUrl,
        ip,
        userAgent,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }
  } catch (err: any) {}

  return { success: true, referrerUid, referralCode: cleanCode };
}

/**
 * Attribute a new user signup to a referrer
 */
export async function attributeSignup({
  newUserId,
  newUserName,
  newUserEmail,
  referralCode,
  source = "WEBSITE",
  ip = "",
  userAgent = "",
}: {
  newUserId: string;
  newUserName: string;
  newUserEmail: string;
  referralCode: string;
  source?: "WEBSITE" | "HACKATHON" | "SUBSCRIPTION";
  ip?: string;
  userAgent?: string;
}) {
  if (!newUserId || !referralCode) {
    return { success: false, error: "Missing required fields" };
  }

  const cleanCode = referralCode.trim().toUpperCase();

  // Find referrer
  let referrerUid: string | null = null;
  let referrerName = "SC TECH Member";
  let referrerEmail = "";

  for (const [uid, stats] of Array.from(g._sctechUserReferrals?.entries() || [])) {
    if (stats.referralCode === cleanCode) {
      referrerUid = uid;
      break;
    }
  }

  try {
    if (db && !referrerUid) {
      const userRefCol = collection(db, "userReferrals");
      const q = query(userRefCol, where("referralCode", "==", cleanCode), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        referrerUid = snap.docs[0].id;
      }
    }
  } catch (err) {}

  if (!referrerUid) {
    return { success: false, error: "Invalid referral code" };
  }

  // FRAUD PREVENTION: Prevent Self-Referral
  if (referrerUid === newUserId || (referrerEmail && referrerEmail.toLowerCase() === newUserEmail.toLowerCase())) {
    return { success: false, error: "Self-referral is strictly prohibited" };
  }

  // Check if new user already has a referrer
  const userStats = g._sctechUserReferrals?.get(newUserId);
  if (userStats?.referrerUid) {
    return { success: false, error: "User already has an attributed referrer" };
  }

  const referralId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const referralRecord: ReferralRecord = {
    id: referralId,
    referralCode: cleanCode,
    referrerUid,
    referrerName,
    referrerEmail,
    referredUid: newUserId,
    referredName: newUserName,
    referredEmail: newUserEmail,
    source,
    status: "SIGNED_UP",
    rewardStatus: "PENDING",
    rewardAmount: 0,
    eligibleAmount: 0,
    rewardPercent: 0,
    ip,
    userAgent,
    createdAt: new Date().toISOString(),
    convertedAt: null,
  };

  g._sctechReferrals?.set(referralId, referralRecord);

  // Update referrer stats in memory
  const referrerStats = g._sctechUserReferrals?.get(referrerUid);
  if (referrerStats) {
    referrerStats.totalSignups += 1;
  }

  // Persist to Firestore
  try {
    if (db) {
      const refDocRef = doc(db, "referrals", referralId);
      await setDoc(refDocRef, {
        ...referralRecord,
        createdAt: serverTimestamp(),
      });

      const userRefDoc = doc(db, "userReferrals", newUserId);
      await setDoc(userRefDoc, {
        userId: newUserId,
        referredBy: cleanCode,
        referrerUid,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const referrerDocRef = doc(db, "userReferrals", referrerUid);
      await updateDoc(referrerDocRef, {
        totalSignups: increment(1),
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      await addDoc(collection(db, "notifications"), {
        userId: referrerUid,
        title: "🎉 New Referral Signup!",
        message: `${newUserName || "A new member"} joined SC TECH using your referral link!`,
        type: "SUCCESS",
        link: "/referrals",
        read: false,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    }
  } catch (err) {}

  return {
    success: true,
    referralId,
    referrerUid,
    referralCode: cleanCode,
  };
}

/**
 * Server-side Referral Conversion & Reward Calculation
 */
export async function processReferralConversion({
  referredUid,
  eventType,
  amount = 0,
  metadata = {},
}: {
  referredUid: string;
  eventType: "HACKATHON_REGISTERED" | "SUBSCRIPTION_PURCHASED";
  amount: number;
  metadata?: Record<string, any>;
}) {
  if (!referredUid) return { success: false, error: "Missing referred user ID" };

  const settings = await getReferralSettings();
  if (!settings.enabled) {
    return { success: false, error: "Referral program is currently disabled" };
  }

  // Find referral record
  let referralRecord: ReferralRecord | null = null;
  for (const record of Array.from(g._sctechReferrals?.values() || [])) {
    if (record.referredUid === referredUid) {
      referralRecord = record;
      break;
    }
  }

  if (!referralRecord) {
    return { success: false, message: "No active referral found for user" };
  }

  const referrerUid = referralRecord.referrerUid;

  // Self-referral check
  if (referrerUid === referredUid) {
    return { success: false, error: "Self-referral is not eligible for rewards" };
  }

  // Idempotency check
  const eventIdentifier = metadata.paymentId || metadata.orderId || metadata.registrationId;
  const processed = referralRecord.metadata?.processedEvents || [];
  if (eventIdentifier && processed.includes(eventIdentifier)) {
    return { success: false, message: "Event already processed for referral reward" };
  }

  // Calculate Reward
  let rewardAmount = 0;
  let rewardPercent = 0;
  let rewardStatus: "NONE" | "REWARDED" | "PENDING" = "NONE";

  if (eventType === "SUBSCRIPTION_PURCHASED") {
    if (amount >= settings.minimumSubscriptionAmount) {
      rewardPercent = settings.subscriptionRewardPercent;
      rewardAmount = Math.round(amount * (rewardPercent / 100));
      rewardStatus = rewardAmount > 0 ? "REWARDED" : "NONE";
    }
  } else if (eventType === "HACKATHON_REGISTERED") {
    if (!settings.allowHackathonReferral) {
      return { success: false, message: "Hackathon referrals are currently disabled" };
    }

    if (amount > 0) {
      if (settings.allowPaidHackathonReferral) {
        rewardPercent = settings.paidHackathonRewardPercent;
        rewardAmount = Math.round(amount * (rewardPercent / 100));
        rewardStatus = rewardAmount > 0 ? "REWARDED" : "NONE";
      }
    } else {
      if (settings.allowFreeHackathonReferral && settings.freeHackathonRewardAmount > 0) {
        rewardAmount = settings.freeHackathonRewardAmount;
        rewardStatus = "REWARDED";
      }
    }
  }

  // Check Max Reward Cap
  const referrerStats = g._sctechUserReferrals?.get(referrerUid);
  const currentEarned = referrerStats?.totalRewardsEarned || 0;
  if (currentEarned + rewardAmount > settings.maxRewardPerUser) {
    rewardAmount = Math.max(0, settings.maxRewardPerUser - currentEarned);
  }

  if (eventIdentifier) {
    processed.push(eventIdentifier);
  }

  // Update in memory
  referralRecord.status = eventType;
  referralRecord.rewardStatus = rewardStatus;
  referralRecord.rewardAmount += rewardAmount;
  referralRecord.eligibleAmount = amount;
  referralRecord.rewardPercent = rewardPercent;
  referralRecord.convertedAt = new Date().toISOString();
  referralRecord.metadata = {
    ...referralRecord.metadata,
    ...metadata,
    processedEvents: processed,
    lastConversionEvent: eventType,
    lastConversionAmount: amount,
  };

  if (referrerStats) {
    if (eventType === "HACKATHON_REGISTERED") referrerStats.hackathonRegistrations += 1;
    if (amount > 0) referrerStats.paidConversions += 1;
    if (rewardAmount > 0) referrerStats.totalRewardsEarned += rewardAmount;
  }

  // Persist to Firestore
  try {
    if (db) {
      const refDocRef = doc(db, "referrals", referralRecord.id);
      await updateDoc(refDocRef, {
        status: eventType,
        rewardStatus,
        rewardAmount: increment(rewardAmount),
        eligibleAmount: amount,
        rewardPercent,
        convertedAt: serverTimestamp(),
        metadata: referralRecord.metadata,
      }).catch(() => {});

      const referrerRef = doc(db, "userReferrals", referrerUid);
      const updates: any = { updatedAt: serverTimestamp() };
      if (eventType === "HACKATHON_REGISTERED") updates.hackathonRegistrations = increment(1);
      if (amount > 0) updates.paidConversions = increment(1);
      if (rewardAmount > 0) updates.totalRewardsEarned = increment(rewardAmount);
      await setDoc(referrerRef, updates, { merge: true }).catch(() => {});

      if (rewardAmount > 0) {
        await addDoc(collection(db, "notifications"), {
          userId: referrerUid,
          title: "💰 Referral Reward Earned!",
          message: `You earned ₹${rewardAmount} because your referral completed a ${eventType === "SUBSCRIPTION_PURCHASED" ? "Subscription plan purchase" : "Hackathon registration"}!`,
          type: "SUCCESS",
          link: "/referrals",
          read: false,
          createdAt: serverTimestamp(),
        }).catch(() => {});
      }
    }
  } catch (err) {}

  return {
    success: true,
    rewardAmount,
    rewardPercent,
    rewardStatus,
    referrerUid,
  };
}

/**
 * Server-side Pricing Engine (Prevents discount stacking)
 */
export async function calculateServerPricing({
  basePrice,
  referralCode,
  userId,
}: {
  basePrice: number;
  referralCode?: string;
  userId?: string;
}) {
  const settings = await getReferralSettings();
  if (!settings.enabled || basePrice <= 0) {
    return {
      originalPrice: basePrice,
      discountAmount: 0,
      finalPrice: basePrice,
      discountPercent: 0,
      appliedRule: "STANDARD",
    };
  }

  let discountPercent = 0;
  let appliedRule = "STANDARD";

  if (referralCode) {
    discountPercent = settings.referralDiscountPercent;
    appliedRule = "REFERRAL_DISCOUNT";
  }

  const discountAmount = Math.round((basePrice * discountPercent) / 100);
  const finalPrice = Math.max(0, basePrice - discountAmount);

  return {
    originalPrice: basePrice,
    discountAmount,
    finalPrice,
    discountPercent,
    appliedRule,
  };
}

/**
 * Get User Referral Dashboard (Real Stats & History)
 */
export async function getUserReferralDashboard(userId: string) {
  const stats = await getOrCreateUserReferral(userId);

  const list: any[] = [];
  for (const record of Array.from(g._sctechReferrals?.values() || [])) {
    if (record.referrerUid === userId) {
      const rawEmail = record.referredEmail || "";
      const maskedEmail = rawEmail.replace(/^(.)(.*)(@.*)$/, (_: string, first: string, middle: string, domain: string) => {
        return first + "*".repeat(Math.max(2, middle.length)) + domain;
      });

      list.push({
        id: record.id,
        referredName: record.referredName || "SC TECH Student",
        referredEmail: maskedEmail,
        source: record.source || "WEBSITE",
        status: record.status || "SIGNED_UP",
        rewardStatus: record.rewardStatus || "NONE",
        rewardAmount: record.rewardAmount || 0,
        createdAt: record.createdAt,
        convertedAt: record.convertedAt,
      });
    }
  }

  return {
    stats,
    history: list,
  };
}

/**
 * Get Admin Referral Analytics and Ledger
 */
export async function getAdminReferralDashboard() {
  const settings = await getReferralSettings();

  let totalRewardsPaid = 0;
  let totalPendingRewards = 0;
  let totalSignups = 0;
  let totalConversions = 0;
  let hackathonConversions = 0;
  let subscriptionConversions = 0;

  const referrals: any[] = [];
  for (const record of Array.from(g._sctechReferrals?.values() || [])) {
    if (record.rewardStatus === "REWARDED") totalRewardsPaid += record.rewardAmount || 0;
    if (record.rewardStatus === "PENDING") totalPendingRewards += record.rewardAmount || 0;

    if (record.status === "SIGNED_UP") totalSignups++;
    if (record.status === "HACKATHON_REGISTERED") {
      totalConversions++;
      hackathonConversions++;
    }
    if (record.status === "SUBSCRIPTION_PURCHASED") {
      totalConversions++;
      subscriptionConversions++;
    }

    referrals.push({ ...record });
  }

  return {
    settings,
    summary: {
      totalClicks: g._sctechReferralClicks?.length || 0,
      totalSignups: totalSignups + totalConversions,
      totalConversions,
      hackathonConversions,
      subscriptionConversions,
      totalRewardsPaid,
      totalPendingRewards,
      activeReferralsCount: referrals.length,
    },
    referrals,
    auditLogs: [],
  };
}
