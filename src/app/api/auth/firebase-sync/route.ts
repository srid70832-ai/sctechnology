import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const { uid: bodyUid, email: bodyEmail, displayName: bodyName, photoURL: bodyPhoto } = body;

    // 1. Verify token if present in headers or payload
    let verifiedUid = bodyUid;
    let verifiedEmail = bodyEmail ? String(bodyEmail).toLowerCase().trim() : "";
    let verifiedName = bodyName || (verifiedEmail ? verifiedEmail.split("@")[0] : "Student");
    let verifiedPhoto = bodyPhoto || null;
    let decodedRole: string | undefined = undefined;

    const tokenVerification = await verifyFirebaseToken(req);
    if (tokenVerification.success && tokenVerification.uid) {
      verifiedUid = tokenVerification.uid;
      if (tokenVerification.email) verifiedEmail = tokenVerification.email.toLowerCase().trim();
      if (tokenVerification.name) verifiedName = tokenVerification.name;
      if (tokenVerification.role) decodedRole = tokenVerification.role;
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
    } else {
      // Query Firestore users/{uid} for role if needed
      try {
        const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : "";
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
      } catch (fsErr) {
        console.warn("[AUTH] Firestore role lookup notice:", fsErr);
      }
    }

    // 3. Database Sync with Prisma (fail-safe)
    let dbUser: any = null;
    let isFirstTime = false;
    let profileIncomplete = false;

    try {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(verifiedUid ? [{ firebaseUid: verifiedUid }] : []),
            ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ],
        },
        include: {
          studentProfile: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            take: 1,
          },
        },
      });

      if (!dbUser && cleanEmail) {
        isFirstTime = true;
        const usernameBase = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") || "user";
        const uniqueUsername = `${usernameBase}_${Math.floor(100 + Math.random() * 900)}`;

        dbUser = await prisma.user.create({
          data: {
            firebaseUid: verifiedUid,
            email: cleanEmail,
            name: verifiedName,
            avatarUrl: verifiedPhoto,
            role: targetRole,
            isVerified: true,
            status: "ACTIVE",
            studentProfile: {
              create: {
                username: uniqueUsername,
                isPublic: true,
              },
            },
          },
          include: {
            studentProfile: true,
            subscriptions: true,
          },
        });
      } else if (dbUser) {
        const finalRole = (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN")
          ? targetRole
          : (dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN" ? dbUser.role : targetRole);

        targetRole = finalRole as any;

        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            firebaseUid: verifiedUid || dbUser.firebaseUid,
            avatarUrl: verifiedPhoto || dbUser.avatarUrl,
            name: dbUser.name || verifiedName,
            role: finalRole,
          },
          include: {
            studentProfile: true,
            subscriptions: {
              where: { status: "ACTIVE" },
              take: 1,
            },
          },
        });
      }

      profileIncomplete = targetRole === "STUDENT" && (!dbUser?.studentProfile?.college || !dbUser?.studentProfile?.mobile);
    } catch (dbErr: any) {
      console.warn("[AUTH] Prisma sync non-blocking notice:", dbErr?.message || dbErr);
    }

    // 4. Create application JWT session cookie
    const sessionUserId = dbUser?.id || verifiedUid;
    const sessionUserName = dbUser?.name || verifiedName;

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
      isFirstTime,
      profileIncomplete,
      user: {
        id: sessionUserId,
        uid: verifiedUid,
        email: cleanEmail,
        name: sessionUserName,
        role: targetRole,
        avatarUrl: verifiedPhoto || dbUser?.avatarUrl || null,
        studentProfile: dbUser?.studentProfile || null,
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
