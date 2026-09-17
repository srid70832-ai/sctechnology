import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import {
  generateS3ObjectKey,
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  StorageCategory,
  formatFirestoreStorageMetadata,
} from "@/lib/s3";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES: Record<StorageCategory, string[]> = {
  "hackathon-logo": ["image/png", "image/jpeg", "image/webp"],
  "hackathon-banner": ["image/png", "image/jpeg", "image/webp"],
  "user-profile": ["image/png", "image/jpeg", "image/webp", "image/jpg"],
  "user-resume": [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  "certificate": ["application/pdf", "image/png", "image/jpeg"],
  "hackathon-submission": [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
  ],
  "team-submission": [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
  ],
  "project-file": [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "image/png",
    "image/jpeg",
  ],
};

const MAX_FILE_SIZES: Record<StorageCategory, number> = {
  "hackathon-logo": 5 * 1024 * 1024, // 5MB
  "hackathon-banner": 10 * 1024 * 1024, // 10MB
  "user-profile": 5 * 1024 * 1024, // 5MB
  "user-resume": 10 * 1024 * 1024, // 10MB
  "certificate": 10 * 1024 * 1024, // 10MB
  "hackathon-submission": 50 * 1024 * 1024, // 50MB
  "team-submission": 50 * 1024 * 1024, // 50MB
  "project-file": 50 * 1024 * 1024, // 50MB
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication is required to upload files." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      category,
      fileName,
      contentType,
      fileSize,
      hackathonId,
      teamId,
      projectId,
      certificateId,
    } = body as {
      category: StorageCategory;
      fileName: string;
      contentType: string;
      fileSize?: number;
      hackathonId?: string;
      teamId?: string;
      projectId?: string;
      certificateId?: string;
    };

    if (!category || !fileName || !contentType) {
      return NextResponse.json(
        { error: "Missing required upload parameters: category, fileName, contentType." },
        { status: 400 }
      );
    }

    // Role-based authorization for categories
    if (category === "hackathon-logo" || category === "hackathon-banner") {
      if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Forbidden. Admin privileges required to upload hackathon media." },
          { status: 403 }
        );
      }
    }

    // MIME type validation
    const allowedTypes = ALLOWED_MIME_TYPES[category] || [];
    if (allowedTypes.length > 0 && !allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported file type "${contentType}". Allowed types: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // File size validation
    const maxSize = MAX_FILE_SIZES[category] || 10 * 1024 * 1024;
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds the limit of ${Math.round(maxSize / (1024 * 1024))}MB.` },
        { status: 400 }
      );
    }

    const objectKey = generateS3ObjectKey({
      category,
      fileName,
      userId: session.userId,
      hackathonId,
      teamId,
      projectId,
      certificateId,
    });

    const { uploadUrl, bucket } = await createPresignedUploadUrl({
      objectKey,
      contentType,
      expiresIn: 300, // 5 minutes
      metadata: {
        uploadedBy: session.userId,
        category,
        originalFileName: fileName,
      },
    });

    // Generate short-lived download/view URL for instant preview if needed
    const downloadUrl = await createPresignedDownloadUrl({
      objectKey,
      expiresIn: 3600,
    });

    const metadata = formatFirestoreStorageMetadata({
      objectKey,
      originalFileName: fileName,
      contentType,
      size: fileSize || 0,
      uploadedBy: session.userId,
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      objectKey,
      bucket,
      downloadUrl,
      viewUrl: `/api/storage/download?key=${encodeURIComponent(objectKey)}`,
      metadata,
    });
  } catch (error: any) {
    console.error("[S3_PRESIGNED_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate S3 upload URL." },
      { status: 500 }
    );
  }
}
