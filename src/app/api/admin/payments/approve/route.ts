import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "@/lib/firebase-admin";
import { getProjectBySlug } from "@/lib/projects-service";
import { getTasksForProject } from "@/lib/project-tasks-data";
import { calculateDeadline, getDurationMonths, getRemainingDays, ProjectDurationOption, ProjectEnrollment } from "@/lib/project-lifecycle-service";
import { DEFAULT_PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authResult = await verifyFirebaseToken(req);
    const adminEmails = ["srics2425@gmail.com", "admin@sctech.com", "superadmin@sctech.com"];
    const isAdmin =
      authResult.success &&
      (authResult.role === "ADMIN" ||
        authResult.role === "SUPER_ADMIN" ||
        adminEmails.includes(authResult.email || ""));

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { paymentId, action = "APPROVE", rejectionReason } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required." }, { status: 400 });
    }

    // Lookup payment record
    let payDocRef = adminDb.collection("payments").doc(paymentId);
    let payDoc = await payDocRef.get();

    if (!payDoc.exists) {
      const qSnap = await adminDb.collection("payments").where("orderId", "==", paymentId).limit(1).get();
      if (!qSnap.empty) {
        payDocRef = qSnap.docs[0].ref;
        payDoc = qSnap.docs[0];
      } else {
        return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
      }
    }

    const payData = payDoc.data()!;
    const uid = payData.userId;
    const now = new Date();
    const nowStr = now.toISOString();
    const adminIdentifier = authResult.email || authResult.uid || "ADMIN";

    // 1. If REJECT action
    if (action === "REJECT") {
      await payDocRef.update({
        status: "FAILED",
        rejectionReason: rejectionReason || "Payment could not be verified by admin",
        rejectedBy: adminIdentifier,
        rejectedAt: nowStr,
        updatedAt: nowStr,
      });

      // Notify student of rejection
      await adminDb.collection("notifications").add({
        userId: uid,
        title: "Payment Verification Unsuccessful",
        message: `Your payment verification for ${payData.planName || "Purchase"} was not approved: ${rejectionReason || "Transaction could not be reconciled."}`,
        type: "PAYMENT",
        read: false,
        link: "/dashboard",
        createdAt: now,
      });

      return NextResponse.json({ success: true, message: "Payment marked as rejected." });
    }

    // 2. APPROVE ACTION -> Mark PAID & Unlock ONLY the purchased product
    const productType = payData.productType || payData.type || (payData.projectId ? "PROJECT_PURCHASE" : payData.hackathonId ? "HACKATHON_REGISTRATION" : "SUBSCRIPTION");

    await payDocRef.update({
      status: "PAID",
      verifiedBy: adminIdentifier,
      verifiedAt: nowStr,
      paidAt: nowStr,
      updatedAt: nowStr,
    });

    // A. PRODUCT: Real-World Project Purchase -> Unlock ONLY this project
    if (productType === "PROJECT_PURCHASE" || payData.projectId) {
      const targetProjectId = payData.projectId;
      const project = await getProjectBySlug(targetProjectId);
      const projectId = project?.id || targetProjectId;
      const projectTitle = project?.title || payData.projectTitle || "Real-World Project";

      const purchaseDocId = `${uid}_${projectId}`;
      await adminDb.collection("projectPurchases").doc(purchaseDocId).set({
        id: purchaseDocId,
        userId: uid,
        userName: payData.userName || "Student",
        userEmail: payData.userEmail || "",
        projectId,
        projectSlug: project?.slug || projectId,
        projectTitle,
        amount: payData.amount || 299,
        currency: "INR",
        paymentMethod: "UPI_QR",
        paymentId: payDoc.id,
        status: "PAID",
        verifiedBy: adminIdentifier,
        purchasedAt: now,
        updatedAt: now,
      }, { merge: true });

      // Initialize Tasks & Enrollment
      const duration: ProjectDurationOption = payData.duration || "2_MONTHS";
      const startDate = nowStr;
      const deadline = calculateDeadline(now, duration).toISOString();
      const enrollmentId = `ENR-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const blueprints = getTasksForProject(project?.slug || projectId);
      const batch = adminDb.batch();

      for (const blueprint of blueprints) {
        const taskId = `${uid}_${projectId}_${blueprint.taskNumber}`;
        batch.set(adminDb.collection("userProjectTasks").doc(taskId), {
          id: taskId,
          userId: uid,
          projectId,
          projectSlug: project?.slug || projectId,
          taskBlueprintId: blueprint.id,
          taskNumber: blueprint.taskNumber,
          title: blueprint.title,
          description: blueprint.description,
          difficulty: blueprint.difficulty,
          isImportant: Boolean(blueprint.isImportant),
          requirements: blueprint.requirements,
          expectedOutput: blueprint.expectedOutput,
          evaluationCriteria: blueprint.evaluationCriteria,
          skills: blueprint.skills,
          status: "ASSIGNED",
          assignedAt: startDate,
          updatedAt: startDate,
        }, { merge: true });
      }

      const existingEnrSnap = await adminDb.collection("projectEnrollments")
        .where("studentId", "==", uid)
        .where("projectId", "==", projectId)
        .limit(1)
        .get();

      if (!existingEnrSnap.empty) {
        batch.update(existingEnrSnap.docs[0].ref, {
          paymentStatus: "PAID",
          paymentType: "DIRECT_ENROLLMENT",
          paymentId: payDoc.id,
          projectStatus: "ACTIVE",
          updatedAt: startDate,
        });
      } else {
        const enrollment: ProjectEnrollment = {
          id: enrollmentId,
          studentId: uid,
          studentName: payData.userName || "Student",
          studentEmail: payData.userEmail || "",
          projectId,
          projectSlug: project?.slug || projectId,
          projectTitle,
          projectCategory: project?.category || "Full Stack Development",
          projectDifficulty: project?.difficulty || "INTERMEDIATE",
          planId: "DIRECT_PROJECT",
          paymentType: "DIRECT_ENROLLMENT",
          activationFee: payData.amount || 299,
          paymentStatus: "PAID",
          paymentId: payDoc.id,
          selectedDuration: duration,
          durationMonths: getDurationMonths(duration),
          startDate,
          deadline,
          remainingDays: getRemainingDays(deadline),
          projectStatus: "ACTIVE",
          taskProgress: { total: blueprints.length || 8, approved: 0, submitted: 0 },
          stipendStatus: "NOT_ELIGIBLE",
          stipendAmount: 0,
          createdAt: startDate,
          updatedAt: startDate,
        };
        batch.set(adminDb.collection("projectEnrollments").doc(enrollmentId), enrollment);
      }

      await batch.commit();

      // Notify student
      await adminDb.collection("notifications").add({
        userId: uid,
        title: `Project Unlocked: ${projectTitle} 🔓`,
        message: `Your UPI QR payment has been verified by SC TECH admin. Full project workspace is unlocked.`,
        type: "PAYMENT",
        read: false,
        link: `/my-projects/${project?.slug || projectId}`,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: `Payment verified & approved! Project "${projectTitle}" unlocked for student.`,
      });
    }

    // B. PRODUCT: Hackathon Registration -> Unlock ONLY this hackathon
    if (productType === "HACKATHON_REGISTRATION" || payData.hackathonId) {
      const hackathonId = payData.hackathonId;

      const regSnap = await adminDb.collection("hackathonRegistrations")
        .where("studentId", "==", uid)
        .where("hackathonId", "==", hackathonId)
        .limit(1)
        .get();

      if (!regSnap.empty) {
        await regSnap.docs[0].ref.update({
          paymentStatus: "PAID",
          paymentId: payDoc.id,
          amountPaid: payData.amount,
          verifiedBy: adminIdentifier,
          verifiedAt: nowStr,
          updatedAt: nowStr,
        });
      } else {
        await adminDb.collection("hackathonRegistrations").add({
          studentId: uid,
          studentName: payData.userName || "Student",
          studentEmail: payData.userEmail || "",
          hackathonId,
          paymentStatus: "PAID",
          paymentId: payDoc.id,
          amountPaid: payData.amount,
          registrationType: "INDIVIDUAL",
          registeredAt: nowStr,
          verifiedBy: adminIdentifier,
          createdAt: now,
        });
      }

      // Notify student
      await adminDb.collection("notifications").add({
        userId: uid,
        title: "Hackathon Registration Confirmed 🏆",
        message: `Your UPI payment for the hackathon was verified by admin. Your registration is confirmed!`,
        type: "HACKATHON",
        read: false,
        link: `/hackathons/${hackathonId}`,
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: "Payment verified & approved! Hackathon registration is active.",
      });
    }

    // C. PRODUCT: Subscription Plan -> Unlock ONLY this subscription
    const planId = (payData.planId || "PRO").toUpperCase();
    const isYearly = payData.billingCycle === "YEARLY";
    const startDate = now;
    const endDate = new Date(now);
    if (isYearly) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setDate(endDate.getDate() + 30);
    }

    await adminDb.collection("subscriptions").doc(uid).set({
      userId: uid,
      uid,
      planId,
      planName: `${planId} Plan`,
      billingCycle: isYearly ? "YEARLY" : "MONTHLY",
      amount: payData.amount,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "ACTIVE",
      paymentId: payDoc.id,
      paymentMethod: "UPI_QR",
      verifiedBy: adminIdentifier,
      createdAt: nowStr,
      updatedAt: nowStr,
    }, { merge: true });

    await adminDb.collection("users").doc(uid).set({
      plan: planId,
      subscriptionStatus: "ACTIVE",
      updatedAt: nowStr,
    }, { merge: true });

    await adminDb.collection("notifications").add({
      userId: uid,
      title: `Welcome to SC TECH ${planId} Plan! 🚀`,
      message: `Your payment was verified by admin. All ${planId} benefits and features are now active.`,
      type: "PAYMENT",
      read: false,
      link: "/dashboard",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: `Payment verified & approved! Subscription "${planId}" is now active.`,
    });
  } catch (error: any) {
    console.error("Admin Approve Payment Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to approve payment" }, { status: 500 });
  }
}
