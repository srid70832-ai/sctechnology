import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJWT, setSessionCookie } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { uid, email, displayName, photoURL, isNewUser } = await req.json();

    if (!email || !uid) {
      return NextResponse.json({ error: "Invalid Firebase authentication payload" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user has admin privileges via Admin emails, Custom Claims, or Firestore document
    let targetRole: "STUDENT" | "ADMIN" | "SUPER_ADMIN" = "STUDENT";
    if (cleanEmail === "superadmin@sctech.com" || cleanEmail === "srics2425@gmail.com") {
      targetRole = "SUPER_ADMIN";
    } else if (cleanEmail === "admin@sctech.com") {
      targetRole = "ADMIN";
    }

    // Check token if present in headers
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.substring(7).trim();
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (decoded.role === "SUPER_ADMIN") {
          targetRole = "SUPER_ADMIN";
        } else if (decoded.role === "ADMIN" || decoded.admin === true) {
          targetRole = targetRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
        }

        // Query Firestore users/{uid} with token context
        const fsRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/scmain-b2cde/databases/(default)/documents/users/${uid}`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        if (fsRes.ok) {
          const fsJson = await fsRes.json();
          const fsRole = fsJson.fields?.role?.stringValue;
          if (fsRole === "SUPER_ADMIN") {
            targetRole = "SUPER_ADMIN";
          } else if (fsRole === "ADMIN") {
            targetRole = targetRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
          }
        }
      } catch (tokenErr) {
        console.warn("firebase-sync token check notice:", tokenErr);
      }
    }

    // 2. Find existing user in Prisma by firebaseUid or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: uid }, { email: cleanEmail }],
      },
      include: {
        studentProfile: true,
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    let isFirstTime = false;

    if (!user) {
      isFirstTime = true;
      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email: cleanEmail,
          name: displayName || cleanEmail.split("@")[0],
          avatarUrl: photoURL || null,
          role: targetRole,
          isVerified: true,
          status: "ACTIVE",
          studentProfile: {
            create: {
              username: cleanEmail.split("@")[0] + "_" + Math.floor(100 + Math.random() * 900),
              isPublic: true,
            },
          },
        },
        include: {
          studentProfile: true,
          subscriptions: true,
        },
      });
    } else {
      // Determine final authoritative role: prioritize ADMIN / SUPER_ADMIN if confirmed
      const finalRole = (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN")
        ? targetRole
        : (user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? user.role : targetRole);

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: uid,
          avatarUrl: photoURL || user.avatarUrl,
          name: user.name || displayName || cleanEmail.split("@")[0],
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

    // 3. Create application JWT session cookie
    const sessionToken = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
    });

    setSessionCookie(sessionToken);

    const profileIncomplete = user.role === "STUDENT" && (!user.studentProfile?.college || !user.studentProfile?.mobile);

    const response = NextResponse.json({
      success: true,
      isFirstTime,
      profileIncomplete,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        studentProfile: user.studentProfile,
      },
    });

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
    console.error("Firebase Sync Error:", error);
    return NextResponse.json({ error: "Failed to synchronize authentication session" }, { status: 500 });
  }
}
