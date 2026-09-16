import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const allowedCategories = new Set([
  "UI/UX",
  "Internships",
  "Hackathons",
  "Projects",
  "Payments",
  "Performance",
  "Authentication",
  "Other",
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const rating = Number(body.rating);
    const category = typeof body.category === "string" ? body.category : "Other";

    if (!message || message.length > 5000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Feedback service is unavailable" }, { status: 503 });
    }

    const feedback = {
      userId: typeof body.userId === "string" ? body.userId.slice(0, 128) : "GUEST",
      userName: typeof body.userName === "string" ? body.userName.slice(0, 200) : "Guest",
      userEmail: typeof body.userEmail === "string" ? body.userEmail.slice(0, 320) : "",
      rating,
      category: allowedCategories.has(category) ? category : "Other",
      message,
      pageUrl: typeof body.pageUrl === "string" ? body.pageUrl.slice(0, 2000) : "",
      anonymous: Boolean(body.anonymous),
      status: "NEW",
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("feedback").add(feedback);
    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("[FEEDBACK] Failed to save feedback:", error);
    return NextResponse.json({ error: "Unable to submit feedback" }, { status: 500 });
  }
}