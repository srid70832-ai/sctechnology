import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { deleteS3Object } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication is required to delete files." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { objectKey } = body;

    if (!objectKey || typeof objectKey !== "string") {
      return NextResponse.json({ error: "Missing or invalid objectKey." }, { status: 400 });
    }

    // Role or ownership check
    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      if (!objectKey.includes(`/${session.userId}/`)) {
        return NextResponse.json(
          { error: "Forbidden. You can only delete your own files." },
          { status: 403 }
        );
      }
    }

    const deleted = await deleteS3Object(objectKey);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("[S3_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete file from S3." },
      { status: 500 }
    );
  }
}
