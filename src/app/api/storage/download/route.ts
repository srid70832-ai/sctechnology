import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { createPresignedDownloadUrl, checkS3ObjectExists } from "@/lib/s3";

export const dynamic = "force-dynamic";

/**
 * Validates if an objectKey requires authentication or is public.
 */
function isPublicAsset(objectKey: string): boolean {
  // Hackathon banners and logos are public promotional media
  if (objectKey.startsWith("hackathons/") && (objectKey.includes("/banner/") || objectKey.includes("/logos/"))) {
    return true;
  }
  // User profile photos can be public for avatars
  if (objectKey.startsWith("users/") && objectKey.includes("/profile/")) {
    return true;
  }
  return false;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const objectKey = searchParams.get("key") || searchParams.get("objectKey");
    const download = searchParams.get("download") === "true";
    const downloadFileName = searchParams.get("fileName") || undefined;
    const returnJson = searchParams.get("json") === "true";

    if (!objectKey) {
      return NextResponse.json({ error: "Missing object key parameter." }, { status: 400 });
    }

    // Check authorization for private files
    if (!isPublicAsset(objectKey)) {
      const session = await getServerSession(req);
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized. Authentication is required to access this file." },
          { status: 401 }
        );
      }

      // If user is not admin, verify ownership
      if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
        // Must contain their own userId in the path
        if (!objectKey.includes(`/${session.userId}/`)) {
          return NextResponse.json(
            { error: "Forbidden. You do not have permission to view this file." },
            { status: 403 }
          );
        }
      }
    }

    // Generate short-lived presigned GET URL (1 hour)
    const presignedUrl = await createPresignedDownloadUrl({
      objectKey,
      expiresIn: 3600,
      downloadFileName: download ? downloadFileName || objectKey.split("/").pop() : undefined,
    });

    if (returnJson) {
      return NextResponse.json({
        success: true,
        downloadUrl: presignedUrl,
        objectKey,
      });
    }

    // Redirect browser directly to the secure presigned URL
    return NextResponse.redirect(presignedUrl, {
      status: 307,
      headers: {
        "Cache-Control": "private, max-age=1800",
      },
    });
  } catch (error: any) {
    console.error("[S3_DOWNLOAD_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate download URL." },
      { status: 500 }
    );
  }
}
