import { NextResponse } from "next/server";
import { getAdminDb, verifyFirebaseToken } from "@/lib/firebase-admin";
import {
  generateS3ObjectKey,
  uploadBufferToS3,
  deleteS3Object,
  formatFirestoreStorageMetadata,
} from "@/lib/s3";

export const dynamic = "force-dynamic";

const MAX_QR_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function extensionForType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export async function GET(req: Request) {
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
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 503 });
    }

    const docSnap = await adminDb.collection("siteSettings").doc("payment").get();
    const data = docSnap.exists
      ? docSnap.data()
      : {
          paymentQrImageUrl: null,
          paymentUpiLink: "upi://pay?pa=sctech.payments@razorpay&pn=SC%20TECH",
          paymentQrVersion: "1.0",
          isActive: true,
          updatedAt: null,
          updatedBy: null,
        };

    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    console.error("GET /api/admin/payments/qr error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 503 });
    }

    const docRef = adminDb.collection("siteSettings").doc("payment");
    const existingSnap = await docRef.get();
    const existingData = existingSnap.exists ? existingSnap.data() : null;

    const contentType = req.headers.get("content-type") || "";

    // 1. If Multipart Form Data (file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("qrImage");
      const upiLink = formData.get("paymentUpiLink") as string | null;
      const isActiveStr = formData.get("isActive") as string | null;

      let paymentQrImageUrl = existingData?.paymentQrImageUrl || null;
      let paymentQrObjectKey = existingData?.paymentQrObjectKey || null;

      if (file instanceof File) {
        if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_QR_BYTES) {
          return NextResponse.json(
            { error: "Invalid QR image. Please upload a PNG, JPG, or WEBP image under 5 MB." },
            { status: 400 }
          );
        }

        const ext = extensionForType(file.type);
        const objectKey = generateS3ObjectKey({
          category: "payment-qr",
          fileName: file.name || `payment-qr.${ext}`,
          userId: authResult.uid,
        });

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to AWS S3
        await uploadBufferToS3({
          objectKey,
          buffer,
          contentType: file.type,
          metadata: {
            uploadedBy: authResult.email || authResult.uid || "admin",
            originalName: file.name,
          },
        });

        paymentQrImageUrl = `/api/storage/download?key=${encodeURIComponent(objectKey)}`;
        const previousObjectKey = existingData?.paymentQrObjectKey;

        // Clean up previous S3 object if replacing
        if (previousObjectKey && previousObjectKey !== objectKey) {
          await deleteS3Object(previousObjectKey).catch(() => undefined);
        }

        paymentQrObjectKey = objectKey;
      }

      const updatePayload = {
        paymentQrImageUrl,
        paymentQrObjectKey,
        paymentUpiLink: upiLink !== null ? upiLink : (existingData?.paymentUpiLink || "upi://pay?pa=sctech.payments@razorpay&pn=SC%20TECH"),
        paymentQrVersion: `qr_${Date.now()}`,
        isActive: isActiveStr !== null ? isActiveStr === "true" : (existingData?.isActive ?? true),
        updatedAt: new Date().toISOString(),
        updatedBy: authResult.email || authResult.uid || "ADMIN",
      };

      await docRef.set(updatePayload, { merge: true });

      return NextResponse.json({
        success: true,
        message: "Payment QR code configuration updated successfully!",
        settings: updatePayload,
      });
    }

    // 2. If JSON body (link or status update)
    const body = await req.json();
    const { paymentUpiLink, isActive } = body;

    const updatePayload = {
      ...(existingData || {}),
      paymentUpiLink: paymentUpiLink !== undefined ? paymentUpiLink : (existingData?.paymentUpiLink || ""),
      isActive: isActive !== undefined ? Boolean(isActive) : (existingData?.isActive ?? true),
      paymentQrVersion: `qr_${Date.now()}`,
      updatedAt: new Date().toISOString(),
      updatedBy: authResult.email || authResult.uid || "ADMIN",
    };

    await docRef.set(updatePayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Payment settings updated successfully!",
      settings: updatePayload,
    });
  } catch (error: any) {
    console.error("POST /api/admin/payments/qr error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 503 });
    }

    const docRef = adminDb.collection("siteSettings").doc("payment");
    const existingSnap = await docRef.get();
    if (existingSnap.exists) {
      const prevKey = existingSnap.data()?.paymentQrObjectKey;
      if (prevKey) {
        await deleteS3Object(prevKey).catch(() => undefined);
      }

      await docRef.update({
        paymentQrImageUrl: null,
        paymentQrObjectKey: null,
        updatedAt: new Date().toISOString(),
        updatedBy: authResult.email || authResult.uid || "ADMIN",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Custom payment QR image removed. Default dynamic QR generator restored.",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/payments/qr error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
