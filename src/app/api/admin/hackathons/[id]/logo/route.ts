import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminDb, getAdminStorage } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
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
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const db = getAdminDb();
    const adminStorage = getAdminStorage();
    if (!db || !adminStorage) {
      return NextResponse.json({ error: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const bucket = adminStorage.bucket();
    const [bucketExists] = await bucket.exists();
    if (!bucketExists) {
      console.error(`[FIREBASE_STORAGE] Bucket does not exist: ${bucket.name}`);
      return NextResponse.json({
        error: `Firebase Storage bucket "${bucket.name}" does not exist. Enable Firebase Storage for project scmain-b2cde before uploading logos.`,
      }, { status: 503 });
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

    const storagePath = `hackathons/${params.id}/logo/${Date.now()}-${crypto.randomUUID()}.${extensionForType(file.type)}`;
    const storageFile = bucket.file(storagePath);
    const buffer = Buffer.from(await file.arrayBuffer());
    await storageFile.save(buffer, {
      resumable: false,
      metadata: { contentType: file.type, cacheControl: "public,max-age=31536000,immutable" },
    });

    const [logoUrl] = await storageFile.getSignedUrl({
      action: "read",
      expires: "03-09-2491",
    });

    const previousStoragePath = existingSnapshot.data()?.logoStoragePath;
    await docRef.update({ logoUrl, logoStoragePath: storagePath, updatedAt: new Date().toISOString() });
    const verifiedSnapshot = await docRef.get();
    if (!verifiedSnapshot.exists || verifiedSnapshot.data()?.logoUrl !== logoUrl) {
      return NextResponse.json({ error: "Logo Firestore update could not be verified." }, { status: 500 });
    }

    if (previousStoragePath && previousStoragePath !== storagePath) {
      await bucket.file(previousStoragePath).delete().catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      hackathon: { id: verifiedSnapshot.id, ...verifiedSnapshot.data() },
      storagePath,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error: any) {
    console.error("Admin hackathon logo upload error:", error?.message || "Unknown error");
    return NextResponse.json({ error: error?.message || "Failed to upload hackathon logo." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const db = getAdminDb();
    const adminStorage = getAdminStorage();
    if (!db || !adminStorage) {
      return NextResponse.json({ error: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const bucket = adminStorage.bucket();
    const [bucketExists] = await bucket.exists();
    if (!bucketExists) {
      console.error(`[FIREBASE_STORAGE] Bucket does not exist: ${bucket.name}`);
      return NextResponse.json({
        error: `Firebase Storage bucket "${bucket.name}" does not exist. Enable Firebase Storage for project scmain-b2cde before removing logos.`,
      }, { status: 503 });
    }

    const docRef = db.collection("hackathons").doc(params.id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Hackathon document not found in Firestore." }, { status: 404 });
    }

    const storagePath = snapshot.data()?.logoStoragePath;
    if (storagePath) {
      await bucket.file(storagePath).delete().catch(() => undefined);
    }
    await docRef.update({ logoUrl: null, logoStoragePath: null, updatedAt: new Date().toISOString() });
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
