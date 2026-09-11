import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type NotificationType = 
  | "INFO" 
  | "SUCCESS" 
  | "WARNING" 
  | "PAYMENT" 
  | "HACKATHON" 
  | "INTERNSHIP" 
  | "CERTIFICATE" 
  | "ROUND_UPDATE"
  | "SUBMISSION"
  | "SHORTLIST";

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  email?: string;
}

/**
 * Sends an in-app notification in Firestore.
 * Also invokes email notification dispatcher if email is present.
 */
export async function sendNotification({
  userId,
  title,
  message,
  type = "INFO",
  link = "/dashboard",
  email,
}: SendNotificationParams): Promise<boolean> {
  let created = false;

  // 1. Firestore Notification (for real-time listeners and in-app dashboard)
  try {
    const notifRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    await addDoc(
      notifRef,
      removeUndefinedValues({
        userId,
        title,
        message,
        type,
        link,
        isRead: false,
        createdAt: serverTimestamp(),
      })
    );
    created = true;
  } catch (fsErr) {
    console.warn("Notice: Firestore notification create:", fsErr);
  }

  // 3. Email Notification Dispatcher (Server log / Email transport ready)
  if (email) {
    sendEmailAlert({
      to: email,
      subject: `SC TECH Alert: ${title}`,
      text: `${message}\n\nAccess your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${link}`,
    }).catch((err) => console.warn("Email alert dispatch notice:", err));
  }

  return created;
}

export interface EmailAlertParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email Notification Support Dispatcher
 * Prepares and sends transactional emails for deadline reminders and shortlisting.
 */
export async function sendEmailAlert({ to, subject, text, html }: EmailAlertParams): Promise<boolean> {
  try {
    // In production, configure SMTP (e.g. Resend, SendGrid, or Nodemailer)
    console.log(`[EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (err) {
    console.error("Email dispatch failed:", err);
    return false;
  }
}

/**
 * Calculates deadline intervals for automated notifications (7d, 3d, 1d, 6h)
 */
export function getDeadlineReminderStatus(deadline: string | Date): {
  isOverdue: boolean;
  hoursRemaining: number;
  reminderBucket: "7_DAYS" | "3_DAYS" | "1_DAY" | "6_HOURS" | "EXPIRED" | "FAR";
} {
  const deadlineMs = new Date(deadline).getTime();
  const nowMs = Date.now();
  const diffMs = deadlineMs - nowMs;

  if (diffMs <= 0) {
    return { isOverdue: true, hoursRemaining: 0, reminderBucket: "EXPIRED" };
  }

  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));

  if (hoursRemaining <= 6) {
    return { isOverdue: false, hoursRemaining, reminderBucket: "6_HOURS" };
  }
  if (hoursRemaining <= 24) {
    return { isOverdue: false, hoursRemaining, reminderBucket: "1_DAY" };
  }
  if (hoursRemaining <= 72) {
    return { isOverdue: false, hoursRemaining, reminderBucket: "3_DAYS" };
  }
  if (hoursRemaining <= 168) {
    return { isOverdue: false, hoursRemaining, reminderBucket: "7_DAYS" };
  }

  return { isOverdue: false, hoursRemaining, reminderBucket: "FAR" };
}
