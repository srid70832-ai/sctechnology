import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface StudentPaymentDetails {
  userId: string;
  studentName: string;
  studentEmail: string;
  phone: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string; // Stored securely
  maskedAccountNumber?: string;
  ifscCode: string;
  upiId?: string;
  isVerified: boolean;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  adminNotes?: string;
  submittedAt: string;
  updatedAt: string;
}

export function maskAccountNumber(acc: string): string {
  if (!acc || acc.length < 4) return "••••";
  return `••••••••${acc.slice(-4)}`;
}

/**
 * Save or update student's bank & UPI payment details in secure vault.
 */
export async function saveStudentPaymentDetails(
  details: Omit<StudentPaymentDetails, "maskedAccountNumber" | "isVerified" | "status" | "submittedAt" | "updatedAt">
): Promise<StudentPaymentDetails> {
  const now = new Date().toISOString();
  const fullRecord: StudentPaymentDetails = {
    ...details,
    accountNumber: details.accountNumber.trim(),
    ifscCode: details.ifscCode.toUpperCase().trim(),
    upiId: details.upiId?.trim() || undefined,
    isVerified: false,
    status: "PENDING_VERIFICATION",
    submittedAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, "studentPaymentDetails", details.userId);
    await setDoc(docRef, fullRecord, { merge: true });
  } catch (err) {
    console.error("Failed to write payment details to Firestore:", err);
  }

  return {
    ...fullRecord,
    maskedAccountNumber: maskAccountNumber(fullRecord.accountNumber),
  };
}

/**
 * Retrieve student payment details (with masking by default for security).
 */
export async function getStudentPaymentDetails(
  userId: string,
  revealFull: boolean = false
): Promise<StudentPaymentDetails | null> {
  try {
    const docRef = doc(db, "studentPaymentDetails", userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data() as StudentPaymentDetails;
    return {
      ...data,
      accountNumber: revealFull ? data.accountNumber : maskAccountNumber(data.accountNumber),
      maskedAccountNumber: maskAccountNumber(data.accountNumber),
    };
  } catch (err) {
    console.error("Failed to read payment details from Firestore:", err);
    return null;
  }
}
