import QRCode from "qrcode";
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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_PLANS } from "./plans";

export interface PaymentRecord {
  id?: string;
  paymentId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  planId: string;
  planName: string;
  billingCycle?: "MONTHLY" | "YEARLY";
  amount: number;
  currency: string;
  paymentMethod: "QR_UPI" | "RAZORPAY_CHECKOUT";
  status: "CREATED" | "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "CANCELLED" | "REFUNDED";
  receiptNumber: string;
  receiptPdfUrl?: string;
  receiptEmailStatus?: "PENDING" | "SENT" | "FAILED";
  receiptGenerated?: boolean;
  mode: "TEST";
  createdAt?: any;
  paidAt?: any;
  verifiedAt?: any;
  updatedAt?: any;
}

// Generate unique receipt number
export function generateReceiptNumber(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `SCT-2026-${randomSuffix}`;
}

// Build standard UPI QR Intent payload
export function generateUpiPayload(amount: number, orderRef: string, planName: string): string {
  const upiId = "sctech.payments@razorpay";
  const payeeName = "SC TECH";
  const note = encodeURIComponent(`SC TECH ${planName} Payment`);
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tr=${orderRef}&tn=${note}`;
}

// Generate high-resolution QR Data URL
export async function createQrDataUrl(upiString: string): Promise<string> {
  try {
    return await QRCode.toDataURL(upiString, {
      width: 380,
      margin: 2,
      color: {
        dark: "#030712",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });
  } catch (err) {
    console.error("QR Generation Error:", err);
    throw err;
  }
}

// Securely look up verified plan amount from Firestore / DEFAULT_PLANS (with active limited offer support)
export async function getVerifiedPlanAmount(planId: string, billingCycle: "MONTHLY" | "YEARLY" = "MONTHLY"): Promise<{ amount: number; originalAmount: number; name: string; hasDiscount: boolean; discountPercentage: number }> {
  const targetCode = planId.toUpperCase();
  let amount = 0;
  let name = `${targetCode} Plan`;

  const defaultPlan = DEFAULT_PLANS.find((p) => p.code === targetCode);
  if (defaultPlan) {
    amount = billingCycle === "YEARLY" ? defaultPlan.priceYearly : defaultPlan.priceMonthly;
    name = defaultPlan.name;
  }

  try {
    const colRef = collection(db, "plans");
    const q = query(colRef, where("code", "==", targetCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const pData = snap.docs[0].data();
      const pAmt = billingCycle === "YEARLY" ? pData.priceYearly : pData.priceMonthly;
      if (pAmt !== undefined) {
        amount = pAmt;
        name = pData.name || name;
      }
    }
  } catch (err) {
    console.warn("Could not query plans from Firestore:", err);
  }

  // Check limited offer discount
  try {
    const { getOfferFromFirestore, calculatePlanPrice } = await import("./plans");
    const offer = await getOfferFromFirestore();
    const priceResult = calculatePlanPrice(amount, targetCode, offer);
    return {
      amount: priceResult.finalPrice,
      originalAmount: priceResult.originalPrice,
      name,
      hasDiscount: priceResult.hasDiscount,
      discountPercentage: priceResult.discountPercentage,
    };
  } catch (err) {
    console.warn("Could not check offer for plan pricing:", err);
    return { amount, originalAmount: amount, name, hasDiscount: false, discountPercentage: 0 };
  }
}
