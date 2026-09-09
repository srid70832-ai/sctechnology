import { formatDate } from "./utils";
import crypto from "crypto";

export interface PaymentReceiptData {
  receiptId: string; // e.g. "SC-PAY-2026-894215"
  paymentId?: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  projectName: string;
  projectDomain?: string;
  stipendAmount: number; // in INR e.g. 5000 or 1200
  tasksCompleted: number; // e.g. 8
  approvedTasks: number; // e.g. 8
  transactionReference: string; // e.g. "UPI/428901928371/HDFC"
  paymentMethod: string; // "Direct Bank Transfer / NEFT / IMPS / UPI"
  paymentDate: string;
  paymentStatus: "PAID";
  organization: string; // "SC TECH"
  organizationAddress: string;
  authorizedBy: {
    founder: string; // "Charudeshna"
    coFounder: string; // "Sridharan"
  };
  qrVerificationUrl?: string;
  createdAt: string;
}

export interface StipendLetterData {
  letterId: string; // e.g. "SC-LET-2026-382910"
  receiptId: string; // "SC-PAY-2026-894215"
  certificateId?: string; // "SC-PROJ-2026-XXXXXX"
  userId: string;
  studentName: string;
  studentEmail: string;
  projectName: string;
  projectDomain: string;
  achievementTitle: string; // e.g. "Full Capstone Mastery & Exceptional Engineering"
  tasksCompleted: number;
  approvedTasks: number;
  stipendAmount: number;
  paymentDate: string;
  issueDate: string;
  organization: string;
  authorizedBy: {
    founder: string;
    coFounder: string;
  };
  createdAt: string;
}

/**
 * Generates unique Bill / Receipt ID: SC-PAY-2026-XXXXXX
 */
export function generatePaymentReceiptId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SC-PAY-2026-${randomNum}`;
}

/**
 * Generates unique Official Letter ID: SC-LET-2026-XXXXXX
 */
export function generateStipendLetterId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SC-LET-2026-${randomNum}`;
}
