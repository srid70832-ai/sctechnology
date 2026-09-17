import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const AWS_REGION = process.env.AWS_REGION?.trim() || "ap-south-1";
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET?.trim() || "sctechmain";

let s3ClientInstance: S3Client | null = null;

/**
 * Returns a singleton instance of the AWS S3 client.
 * Configured using server-only environment variables.
 */
export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

    s3ClientInstance = new S3Client({
      region: AWS_REGION,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey,
      } : undefined,
    });
  }
  return s3ClientInstance;
}

export type StorageCategory =
  | "hackathon-banner"
  | "hackathon-logo"
  | "certificate"
  | "user-profile"
  | "user-resume"
  | "hackathon-submission"
  | "team-submission"
  | "project-file"
  | "payment-qr";

export interface KeyGenerationParams {
  category: StorageCategory;
  fileName: string;
  userId?: string;
  hackathonId?: string;
  teamId?: string;
  projectId?: string;
  certificateId?: string;
}

/**
 * Sanitizes a file name for safe S3 object keys.
 */
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Generates structured, unique, and safe S3 object keys according to SC TECH storage architecture.
 */
export function generateS3ObjectKey(params: KeyGenerationParams): string {
  const { category, fileName, userId, hackathonId, teamId, projectId, certificateId } = params;
  const timestamp = Date.now();
  const randomSuffix = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).substring(2, 10);
  
  const cleanName = sanitizeFileName(fileName);
  const uniqueName = `${timestamp}-${randomSuffix}-${cleanName}`;

  switch (category) {
    case "hackathon-banner":
      return `hackathons/${hackathonId || "general"}/banner/${uniqueName}`;
    case "hackathon-logo":
      return `hackathons/${hackathonId || "general"}/logos/${uniqueName}`;
    case "certificate":
      return `certificates/${userId || "system"}/${certificateId || timestamp}/${uniqueName}`;
    case "user-profile":
      return `users/${userId || "anonymous"}/profile/${uniqueName}`;
    case "user-resume":
      return `users/${userId || "anonymous"}/resume/${uniqueName}`;
    case "hackathon-submission":
      return `hackathons/${hackathonId || "general"}/submissions/${userId || "anonymous"}/${uniqueName}`;
    case "team-submission":
      return `hackathons/${hackathonId || "general"}/teams/${teamId || "general"}/${uniqueName}`;
    case "project-file":
      return `projects/${projectId || "general"}/${userId || "anonymous"}/${uniqueName}`;
    case "payment-qr":
      return `payments/qr/${uniqueName}`;
    default:
      return `uploads/${uniqueName}`;
  }
}

/**
 * Generates an S3 presigned PUT URL for direct, secure client-to-S3 uploads.
 */
export async function createPresignedUploadUrl(options: {
  objectKey: string;
  contentType: string;
  expiresIn?: number; // seconds, default: 300 (5 mins)
  metadata?: Record<string, string>;
}): Promise<{ uploadUrl: string; objectKey: string; bucket: string }> {
  const client = getS3Client();
  const bucket = AWS_S3_BUCKET;
  const expiresIn = options.expiresIn || 300;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: options.objectKey,
    ContentType: options.contentType,
    Metadata: options.metadata,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return {
    uploadUrl,
    objectKey: options.objectKey,
    bucket,
  };
}

/**
 * Generates an S3 presigned GET URL for secure, short-lived file viewing or downloading.
 */
export async function createPresignedDownloadUrl(options: {
  objectKey: string;
  expiresIn?: number; // seconds, default: 3600 (1 hr)
  downloadFileName?: string;
}): Promise<string> {
  const client = getS3Client();
  const bucket = AWS_S3_BUCKET;
  const expiresIn = options.expiresIn || 3600;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: options.objectKey,
    ...(options.downloadFileName
      ? { ResponseContentDisposition: `attachment; filename="${encodeURIComponent(options.downloadFileName)}"` }
      : {}),
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Uploads a raw Buffer / ArrayBuffer directly to AWS S3 from server-side handlers.
 */
export async function uploadBufferToS3(options: {
  objectKey: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ objectKey: string; bucket: string; etag?: string }> {
  const client = getS3Client();
  const bucket = AWS_S3_BUCKET;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: options.objectKey,
    Body: options.buffer,
    ContentType: options.contentType,
    Metadata: options.metadata,
  });

  const result = await client.send(command);
  return {
    objectKey: options.objectKey,
    bucket,
    etag: result.ETag,
  };
}

/**
 * Deletes an object from AWS S3.
 */
export async function deleteS3Object(objectKey: string): Promise<boolean> {
  try {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: objectKey,
    });
    await client.send(command);
    return true;
  } catch (err) {
    console.warn(`[AWS_S3] Failed to delete object "${objectKey}":`, err);
    return false;
  }
}

/**
 * Checks if an object exists in AWS S3.
 */
export async function checkS3ObjectExists(objectKey: string): Promise<boolean> {
  try {
    const client = getS3Client();
    const command = new HeadObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: objectKey,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats standardized Firestore metadata for files stored in AWS S3.
 */
export interface FirestoreStorageMetadata {
  storageProvider: "aws-s3";
  bucket: string;
  objectKey: string;
  originalFileName: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export function formatFirestoreStorageMetadata(options: {
  objectKey: string;
  originalFileName: string;
  contentType: string;
  size: number;
  uploadedBy: string;
}): FirestoreStorageMetadata {
  return {
    storageProvider: "aws-s3",
    bucket: AWS_S3_BUCKET,
    objectKey: options.objectKey,
    originalFileName: options.originalFileName,
    contentType: options.contentType,
    size: options.size,
    uploadedBy: options.uploadedBy,
    uploadedAt: new Date().toISOString(),
  };
}
