import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: "Webhook signature configuration is missing" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("Invalid Razorpay webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload?.payment?.entity || event.payload?.order?.entity;

    if (!payload) {
      return NextResponse.json({ status: "ok", message: "No payload entity" });
    }

    const orderId = payload.order_id || payload.id;
    const paymentId = payload.id;
    const notes = payload.notes || {};
    const userId = notes.userId;
    const planId = (notes.planId || "PRO").toUpperCase();

    const payCol = collection(db, "payments");
    const q = query(payCol, where("razorpayOrderId", "==", orderId));
    const snap = await getDocs(q);

    // 2. Handle payment events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      if (!snap.empty) {
        const payDoc = snap.docs[0];
        if (payDoc.data().status !== "CAPTURED" && payDoc.data().status !== "SUCCESS") {
          await updateDoc(payDoc.ref, {
            status: "CAPTURED",
            razorpayPaymentId: paymentId,
            paidAt: serverTimestamp(),
            verifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // Activate Subscription idempotently if user found
      if (userId) {
        const subRef = doc(db, "subscriptions", userId);
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30);

        await setDoc(subRef, {
          userId,
          planId,
          status: "ACTIVE",
          paymentId,
          orderId,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        await setDoc(doc(db, "users", userId), {
          plan: planId,
          subscriptionStatus: "ACTIVE",
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } else if (eventType === "payment.failed") {
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          status: "FAILED",
          razorpayPaymentId: paymentId,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return NextResponse.json({ status: "ok", processedEvent: eventType });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
