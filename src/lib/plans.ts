import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

export interface PlanData {
  id?: string;
  name: string;
  code: "FREE" | "STARTER" | "PLUS" | "PRO" | "CAREER";
  positioning: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  active: boolean;
  sortOrder: number;
  createdAt?: any;
  updatedAt?: any;
}

export const DEFAULT_PLANS: PlanData[] = [
  {
    name: "Free",
    code: "FREE",
    positioning: "For every student entering tech",
    tagline: "Start building your foundation",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "INR",
    features: [
      "Student profile & public portfolio",
      "Public internship & hackathon browsing",
      "Selected free project repositories",
      "Basic learning resources & articles",
      "Community forum participation",
      "Standard platform notifications",
    ],
    ctaText: "Join SC TECH Free",
    isPopular: false,
    active: true,
    sortOrder: 1,
  },
  {
    name: "Starter",
    code: "STARTER",
    positioning: "For students starting their career journey",
    tagline: "Essential skills & project tools",
    priceMonthly: 299,
    priceYearly: 2999,
    currency: "INR",
    features: [
      "Everything in Free plan",
      "Expanded project repository access",
      "Selected production source code downloads",
      "Enhanced technical guides & resources",
      "Internship application tracking tools",
      "Standard hackathon participation benefits",
      "Priority student support",
    ],
    ctaText: "Start with Starter",
    isPopular: false,
    active: true,
    sortOrder: 2,
  },
  {
    name: "Plus",
    code: "PLUS",
    positioning: "For students ready to build real-world projects",
    tagline: "Full access to production project tracks",
    priceMonthly: 399,
    priceYearly: 3999,
    currency: "INR",
    features: [
      "Everything in Starter plan",
      "Full Real-World Projects access",
      "Project tasks, guidelines and repositories",
      "Project enrollment and evaluation workflows",
      "Verifiable digital certificates for completed activities",
      "Priority student support",
    ],
    ctaText: "Choose Plus",
    isPopular: false,
    active: true,
    sortOrder: 3,
  },
  {
    name: "Pro",
    code: "PRO",
    positioning: "For students serious about building a strong portfolio",
    tagline: "Full access to production projects & certificates",
    priceMonthly: 499,
    priceYearly: 4999,
    currency: "INR",
    features: [
      "Everything in Starter plan",
      "Unlimited source code access to eligible tracks",
      "Advanced full-stack project blueprints",
      "Verifiable digital certificates for completed activities",
      "Priority direct internship matching support",
      "Allocated industry & HR sessions where available",
      "Resume review checklist & career resources",
      "Discounted / free entry to sponsored hackathons",
      "Dedicated priority platform support",
    ],
    ctaText: "Choose Pro →",
    isPopular: true,
    active: true,
    sortOrder: 4,
  },
  {
    name: "Career",
    code: "CAREER",
    positioning: "For students preparing for internships and job opportunities",
    tagline: "Comprehensive career & interview readiness",
    priceMonthly: 599,
    priceYearly: 5999,
    currency: "INR",
    features: [
      "Everything in Pro plan",
      "1-on-1 industry HR mentorship sessions where eligible",
      "Detailed portfolio & resume critique guidance",
      "Full technical interview preparation modules",
      "Exclusive recruiter talent pipeline listings",
      "Interactive career workshops & live webinars",
      "High-priority notification alerts for openings",
      "Lifetime verifiable credential verification",
      "VIP 24/7 priority support",
    ],
    ctaText: "Build My Career →",
    isPopular: false,
    active: true,
    sortOrder: 5,
  },
];

// Fetch plans from Firestore (falls back safely to DEFAULT_PLANS)
export async function getPlansFromFirestore(): Promise<PlanData[]> {
  try {
    if (typeof window === "undefined") {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("plans").where("active", "==", true).orderBy("sortOrder", "asc").get();
        if (!snap.empty) {
          const plans: PlanData[] = [];
          snap.forEach((docSnap) => {
            plans.push({ id: docSnap.id, ...(docSnap.data() as PlanData) });
          });
          if (plans.length > 0) return plans;
        }
        return DEFAULT_PLANS;
      }
    }

    const colRef = collection(db, "plans");
    const q = query(colRef, where("active", "==", true), orderBy("sortOrder", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      return DEFAULT_PLANS;
    }

    const plans: PlanData[] = [];
    snap.forEach((docSnap) => {
      plans.push({ id: docSnap.id, ...(docSnap.data() as PlanData) });
    });
    return plans.length > 0 ? plans : DEFAULT_PLANS;
  } catch (err) {
    console.warn("Could not load custom plans from Firestore, falling back to standard plans:", err);
    return DEFAULT_PLANS;
  }
}

export interface LimitedOfferConfig {
  enabled: boolean;
  title: string;
  bannerMessage: string;
  discountPercentage: number;
  badgeText: string;
  eligiblePlans: string[]; // e.g. ["ALL"] or ["STARTER", "PRO", "CAREER"]
  startDate?: string | null;
  endDate?: string | null;
  updatedAt?: string;
}

export const DEFAULT_OFFER_CONFIG: LimitedOfferConfig = {
  enabled: true,
  title: "🔥 LIMITED-TIME OFFER",
  bannerMessage: "Get 30% OFF on all plans",
  discountPercentage: 30,
  badgeText: "🔥 30% OFF",
  eligiblePlans: ["ALL"],
  startDate: null,
  endDate: null,
};

export function isOfferActive(offer?: LimitedOfferConfig | null): boolean {
  if (!offer || !offer.enabled) return false;
  const now = Date.now();

  if (offer.startDate) {
    const start = new Date(offer.startDate).getTime();
    if (!isNaN(start) && now < start) return false;
  }

  if (offer.endDate) {
    const end = new Date(offer.endDate).getTime();
    if (!isNaN(end) && now > end) return false;
  }

  return true;
}

export interface PlanPriceResult {
  originalPrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountPercentage: number;
  savings: number;
}

export type CalculatedPrice = PlanPriceResult;

export function calculatePlanPrice(
  originalPrice: number,
  planCode: string,
  offer?: LimitedOfferConfig | null
): PlanPriceResult {
  if (originalPrice <= 0) {
    return {
      originalPrice: 0,
      finalPrice: 0,
      hasDiscount: false,
      discountPercentage: 0,
      savings: 0,
    };
  }

  const active = isOfferActive(offer);
  const code = (planCode || "").toUpperCase();
  const eligible =
    active &&
    offer &&
    (offer.eligiblePlans.includes("ALL") || offer.eligiblePlans.includes(code));

  if (!eligible || !offer) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      hasDiscount: false,
      discountPercentage: 0,
      savings: 0,
    };
  }

  const discountPercentage = Math.min(Math.max(Number(offer.discountPercentage) || 0, 1), 99);
  const finalPrice = Math.max(1, Math.round(originalPrice * (1 - discountPercentage / 100)));
  const savings = Math.max(0, originalPrice - finalPrice);

  return {
    originalPrice,
    finalPrice,
    hasDiscount: true,
    discountPercentage,
    savings,
  };
}

export async function getOfferFromFirestore(): Promise<LimitedOfferConfig> {
  try {
    if (typeof window === "undefined") {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("settings").doc("limited_offer").get();
        if (snap.exists) {
          return { ...DEFAULT_OFFER_CONFIG, ...(snap.data() as LimitedOfferConfig) };
        }
        return DEFAULT_OFFER_CONFIG;
      }
    }

    const docRef = doc(db, "settings", "limited_offer");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_OFFER_CONFIG, ...(snap.data() as LimitedOfferConfig) };
    }
  } catch (err) {
    console.warn("Could not load offer from Firestore:", err);
  }
  return DEFAULT_OFFER_CONFIG;
}

export async function saveOfferToFirestore(offer: Partial<LimitedOfferConfig>): Promise<void> {
  if (typeof window === "undefined") {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const adminDb = getAdminDb();
    if (adminDb) {
      await adminDb.collection("settings").doc("limited_offer").set({
        ...DEFAULT_OFFER_CONFIG,
        ...offer,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return;
    }
  }

  const docRef = doc(db, "settings", "limited_offer");
  await setDoc(docRef, {
    ...DEFAULT_OFFER_CONFIG,
    ...offer,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

