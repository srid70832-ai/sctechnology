import { NextResponse } from "next/server";
import { signJWT } from "@/lib/auth";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { uid: bodyUid, email: bodyEmail, displayName: bodyName, photoURL: bodyPhoto, role: bodyRole } = body;

    // 1. Verify token if present in headers or payload
    let verifiedUid = bodyUid;
    let verifiedEmail = bodyEmail ? String(bodyEmail).toLowerCase().trim() : "";
    let verifiedName = bodyName || (verifiedEmail ? verifiedEmail.split("@")[0] : "Student");
    let verifiedPhoto = bodyPhoto || null;
    let decodedRole: string | undefined = bodyRole || undefined;

    try {
      const tokenVerification = await verifyFirebaseToken(req);
      if (tokenVerification.success && tokenVerification.uid) {
        verifiedUid = tokenVerification.uid;
        if (tokenVerification.email) verifiedEmail = tokenVerification.email.toLowerCase().trim();
        if (tokenVerification.name) verifiedName = tokenVerification.name;
        if (tokenVerification.role) decodedRole = tokenVerification.role;
      }
    } catch (vErr) {
      console.warn("[AUTH] Token verification notice:", vErr);
    }

    if (!verifiedUid && !verifiedEmail) {
      return NextResponse.json({ error: "Invalid Firebase authentication payload" }, { status: 400 });
    }

    const cleanEmail = verifiedEmail.toLowerCase().trim();

    // 2. Authoritative Role Resolution
    let targetRole: "STUDENT" | "ADMIN" | "SUPER_ADMIN" = "STUDENT";
    const isSuperAdminEmail = cleanEmail === "superadmin@sctech.com" || cleanEmail === "srics2425@gmail.com";
    const isAdminEmail = cleanEmail === "admin@sctech.com";

    if (isSuperAdminEmail || decodedRole === "SUPER_ADMIN") {
      targetRole = "SUPER_ADMIN";
    } else if (isAdminEmail || decodedRole === "ADMIN") {
      targetRole = "ADMIN";
    } else if (cleanEmail) {
      // Query Firestore users/{uid} for role if needed
      try {
        const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : "";
        if (verifiedUid) {
          const fsRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/scmain-b2cde/databases/(default)/documents/users/${verifiedUid}`,
            token ? { headers: { Authorization: `Bearer ${token}` } } : {}
          );
          if (fsRes.ok) {
            const fsJson = await fsRes.json();
            const fsRole = fsJson.fields?.role?.stringValue;
            if (fsRole === "SUPER_ADMIN") {
              targetRole = "SUPER_ADMIN";
            } else if (fsRole === "ADMIN") {
              targetRole = "ADMIN";
            }
          }
        }
      } catch (fsErr) {
        console.warn("[AUTH] Firestore role lookup notice:", fsErr);
      }
    }

    // 3. Create application JWT session cookie
    const sessionUserId = verifiedUid;
    const sessionUserName = verifiedName;

    const sessionToken = await signJWT({
      userId: sessionUserId,
      email: cleanEmail,
      name: sessionUserName,
      role: targetRole,
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
    return NextResponse.json({ error: "Failed to synchronize authentication session" }, { status: 500 });
  }
}
