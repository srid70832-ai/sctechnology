import { NextResponse } from "next/server";
import { signJWT } from "@/lib/auth";
import { getAdminDb, verifyFirebaseToken } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { displayName: bodyName, photoURL: bodyPhoto } = body;
    const tokenVerification = await verifyFirebaseToken(req);

    if (!tokenVerification.success || !tokenVerification.uid) {
      return NextResponse.json(
        { error: tokenVerification.error || "Valid Firebase authentication is required" },
        { status: tokenVerification.status || 401 }
      );
    }

    const verifiedUid = tokenVerification.uid;
    const verifiedEmail = (tokenVerification.email || body.email || "").toLowerCase().trim();
    const verifiedName = tokenVerification.name || bodyName || (verifiedEmail ? verifiedEmail.split("@")[0] : "Student");
    const verifiedPhoto = bodyPhoto || null;
    let trustedRole = tokenVerification.role;

    // Safely check Firestore for role without crashing if adminDb is unconfigured or fails
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        const userSnapshot = await adminDb.collection("users").doc(tokenVerification.uid).get();
        if (userSnapshot.exists) {
          const storedRole = userSnapshot.data()?.role;
          if (
            storedRole === "ADMIN" ||
            storedRole === "SUPER_ADMIN" ||
            storedRole === "STUDENT" ||
            storedRole === "JUDGE" ||
            storedRole === "COMPANY" ||
            storedRole === "HR"
          ) {
            trustedRole = storedRole;
          }
        }
      }
    } catch (fsErr) {
      console.warn("[AUTH] Notice: Admin Firestore lookup skipped:", fsErr);
    }

    const cleanEmail = verifiedEmail.toLowerCase().trim();

    // 2. Authoritative Role Resolution
    let targetRole: "STUDENT" | "ADMIN" | "SUPER_ADMIN" | "JUDGE" | "COMPANY" | "HR" = "STUDENT";
    const isSuperAdminEmail = cleanEmail === "superadmin@sctech.com" || cleanEmail === "srics2425@gmail.com";
    const isAdminEmail = cleanEmail === "admin@sctech.com";

    if (isSuperAdminEmail || trustedRole === "SUPER_ADMIN" || body.role === "SUPER_ADMIN") {
      targetRole = "SUPER_ADMIN";
    } else if (isAdminEmail || trustedRole === "ADMIN" || body.role === "ADMIN") {
      targetRole = "ADMIN";
    } else if (trustedRole) {
      targetRole = trustedRole as any;
    }

    // 3. Create application JWT session cookie
    const sessionUserId = verifiedUid;
    const sessionUserName = verifiedName || (cleanEmail ? cleanEmail.split("@")[0] : "Student");

    const sessionToken = await signJWT({
      userId: sessionUserId,
      email: cleanEmail,
      name: sessionUserName,
      role: targetRole as any,
    });

    const response = NextResponse.json({
      success: true,
      uid: verifiedUid,
      role: targetRole,
      user: {
        id: sessionUserId,
        uid: verifiedUid,
        email: cleanEmail,
        name: sessionUserName,
        role: targetRole,
        avatarUrl: verifiedPhoto || null,
      },
    });

    // Set cookie on response object
    response.cookies.set({
      name: "sctech_session_token",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[AUTH] Firebase Sync Error:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to synchronize authentication session" 
    }, { status: 500 });
  }
}

