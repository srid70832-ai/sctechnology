import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { getServerSession } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/payment";
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
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authResult = await verifyFirebaseToken(req);
    let uid = authResult.uid;
    let userEmail = authResult.email || "";
    let userName = authResult.name || "Student";

    if (!uid) {
      const session = await getServerSession();
      if (session) {
        uid = session.userId;
        userEmail = session.email || "";
        userName = session.name || "Student";
      }
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized. Please log in to continue." }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, paymentId, signature, planId, billingCycle = "MONTHLY", hackathonId } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: "Order ID and Payment ID are required" }, { status: 400 });
    }

    // 1. Verify HMAC-SHA256 signature server-side
    const isValidSignature = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature: signature || "",
    });

    if (!isValidSignature) {
      // Mark failed in payment log if found
      try {
        const payCol = collection(db, "payments");
        const payQ = query(payCol, where("razorpayOrderId", "==", orderId));
        const snap = await getDocs(payQ);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, {
            status: "FAILED",
            razorpayPaymentId: paymentId,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Error logging failed payment:", err);
      }

      return NextResponse.json({ error: "Invalid Razorpay payment signature" }, { status: 400 });
    }

    // 2. Idempotency Check: Check if payment is already processed
    const payCol = collection(db, "payments");
    const payQ = query(payCol, where("razorpayPaymentId", "==", paymentId));
    const snap = await getDocs(payQ);

    if (!snap.empty && snap.docs[0].data().status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified and active",
        planId: snap.docs[0].data().planId,
      });
    }

    // 3. Update or create Firestore payment record with SUCCESS status
    const orderQ = query(payCol, where("razorpayOrderId", "==", orderId));
    const orderSnap = await getDocs(orderQ);

    if (!orderSnap.empty) {
      await updateDoc(orderSnap.docs[0].ref, {
        razorpayPaymentId: paymentId,
        status: "SUCCESS",
        mode: "TEST",
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(payCol, {
        userId: uid,
        userName: userName,
        userEmail: userEmail,
        planId: planId?.toUpperCase() || "PRO",
        billingCycle,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        status: "SUCCESS",
        mode: "TEST",
        verifiedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    // 4. Activate Subscription in Cloud Firestore (subscriptions/{subscriptionId})
    if (planId) {
      const targetPlan = planId.toUpperCase();
      const isYearly = billingCycle === "YEARLY";
      
      const now = new Date();
      const startDate = now;
      const endDate = new Date(now);
      if (isYearly) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setDate(endDate.getDate() + 30);
      }

      // Upsert subscription for user
      const subRef = doc(db, "subscriptions", uid);
      await setDoc(subRef, {
        userId: uid,
        planId: targetPlan,
        billingCycle,
        startDate,
        endDate,
        status: "ACTIVE",
        paymentId,
        razorpayOrderId: orderId,
        mode: "TEST",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Update user document role / plan
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        plan: targetPlan,
        subscriptionStatus: "ACTIVE",
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create confirmation notification in Firestore
      await addDoc(collection(db, "notifications"), {
        userId: uid,
        title: `Welcome to SC TECH ${targetPlan} Plan! 🚀`,
        message: `Your payment was verified in TEST MODE. All ${targetPlan} benefits, full-stack projects, and certificates are now unlocked.`,
        type: "PAYMENT",
        read: false,
        link: "/dashboard",
        createdAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified! Your subscription is now active.",
      planId: planId?.toUpperCase() || "PRO",
      mode: "TEST",
    });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
