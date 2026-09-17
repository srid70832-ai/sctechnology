import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  generateS3ObjectKey,
  uploadBufferToS3,
  deleteS3Object,
  formatFirestoreStorageMetadata,
  createPresignedDownloadUrl,
} from "@/lib/s3";

export const dynamic = "force-dynamic";

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function extensionForType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function invalidFileResponse() {
  return NextResponse.json(
    { error: "Please upload a PNG, JPG, or WEBP image under 5 MB." },
    { status: 400 }
  );
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore Database is not configured." }, { status: 503 });
    }

    const docRef = db.collection("hackathons").doc(params.id);
    const existingSnapshot = await docRef.get();
    if (!existingSnapshot.exists) {
      return NextResponse.json({ error: "Hackathon document not found in Firestore." }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("logo");
    if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_LOGO_BYTES) {
      return invalidFileResponse();
    }

    const ext = extensionForType(file.type);
    const objectKey = generateS3ObjectKey({
      category: "hackathon-logo",
      fileName: file.name || `logo.${ext}`,
      hackathonId: params.id,
      userId: session?.userId,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload directly to AWS S3 bucket
    await uploadBufferToS3({
      objectKey,
      buffer,
      contentType: file.type,
      metadata: {
        hackathonId: params.id,
        uploadedBy: session?.userId || "admin",
        originalName: file.name,
      },
    });

    const viewUrl = `/api/storage/download?key=${encodeURIComponent(objectKey)}`;
    const metadata = formatFirestoreStorageMetadata({
      objectKey,
      originalFileName: file.name,
      contentType: file.type,
      size: file.size,
      uploadedBy: session?.userId || "admin",
    });

    const previousObjectKey = existingSnapshot.data()?.logoObjectKey || existingSnapshot.data()?.logoStoragePath;

    await docRef.update({
      logoUrl: viewUrl,
      logoObjectKey: objectKey,
      logoStoragePath: objectKey,
      storageProvider: "aws-s3",
      logoMetadata: metadata,
      updatedAt: new Date().toISOString(),
    });

    const verifiedSnapshot = await docRef.get();
    if (!verifiedSnapshot.exists || verifiedSnapshot.data()?.logoUrl !== viewUrl) {
      return NextResponse.json({ error: "Logo Firestore update could not be verified." }, { status: 500 });
    }

    // Clean up old S3 file if replacing
    if (previousObjectKey && previousObjectKey !== objectKey) {
      await deleteS3Object(previousObjectKey).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      hackathon: { id: verifiedSnapshot.id, ...verifiedSnapshot.data() },
      objectKey,
      logoUrl: viewUrl,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error: any) {
    console.error("Admin hackathon logo upload error:", error?.message || "Unknown error");
    return NextResponse.json({ error: error?.message || "Failed to upload hackathon logo to AWS S3." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore Database is not configured." }, { status: 503 });
    }

    const docRef = db.collection("hackathons").doc(params.id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Hackathon document not found in Firestore." }, { status: 404 });
    }

    const objectKey = snapshot.data()?.logoObjectKey || snapshot.data()?.logoStoragePath;
    if (objectKey) {
      await deleteS3Object(objectKey).catch(() => undefined);
    }

    await docRef.update({
      logoUrl: null,
      logoObjectKey: null,
      logoStoragePath: null,
      logoMetadata: null,
      updatedAt: new Date().toISOString(),
    });

    const verifiedSnapshot = await docRef.get();
    if (!verifiedSnapshot.exists || verifiedSnapshot.data()?.logoUrl !== null) {
      return NextResponse.json({ error: "Logo removal could not be verified." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hackathon: { id: verifiedSnapshot.id, ...verifiedSnapshot.data() },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error: any) {
    console.error("Admin hackathon logo removal error:", error?.message || "Unknown error");
    return NextResponse.json({ error: error?.message || "Failed to remove hackathon logo." }, { status: 500 });
  }
}
