import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyFirebaseToken, getAdminDb } from "./firebase-admin";

const JWT_SECRET = process.env.JWT_SECRET || "sctech_fallback_secret_for_development_mode_2026";
export const AUTH_COOKIE_NAME = "sctech_session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "SUPER_ADMIN" | "JUDGE" | "HR" | "COMPANY";
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  } catch (err) {
    console.warn("jsonwebtoken sign error, using fallback encoding:", err);
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
    const signature = Buffer.from("sctech_sig").toString("base64url");
    return `${header}.${body}.${signature}`;
  }
}

export const signJWT = signToken;

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  try {
    cookies().set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  } catch (err) {
    console.warn("Failed to set session cookie:", err);
  }
}

export async function getServerSession(req?: Request): Promise<SessionPayload | null> {
  try {
    // 1. Check Authorization Bearer Header (Firebase ID Token)
    let authHeader: string | null = null;
    if (req) {
      authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    }
    if (!authHeader) {
      try {
        const headerStore = headers();
        authHeader = headerStore.get("authorization") || headerStore.get("Authorization");
      } catch {
        // headers() might throw outside of request context
      }
    }

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const dummyReq = new Request("http://localhost", {
        headers: { Authorization: authHeader },
      });
      const authResult = await verifyFirebaseToken(dummyReq);

      if (authResult.success && authResult.uid) {
        const userEmail = authResult.email ? authResult.email.toLowerCase().trim() : "";
        const isAdminEmail = userEmail === "admin@sctech.com" || userEmail === "superadmin@sctech.com" || userEmail === "srics2425@gmail.com";
        const isSuperAdminEmail = userEmail === "superadmin@sctech.com" || userEmail === "srics2425@gmail.com";

        // Query Firestore users/{uid} for role if needed
        let firestoreRole: string | null = null;
        try {
          const adminDb = getAdminDb();
          if (adminDb) {
            const userSnap = await adminDb.collection("users").doc(authResult.uid).get();
            if (userSnap.exists) {
              firestoreRole = userSnap.data()?.role || null;
            }
          }
        } catch (dbErr) {
          console.warn("[AUTH] AdminDb user lookup notice:", dbErr);
        }

        if (!firestoreRole) {
          try {
            const fsRes = await fetch(
              `https://firestore.googleapis.com/v1/projects/scmain-b2cde/databases/(default)/documents/users/${authResult.uid}`,
              authResult.token ? { headers: { Authorization: `Bearer ${authResult.token}` } } : {}
            );
            if (fsRes.ok) {
              const fsJson = await fsRes.json();
              firestoreRole = fsJson.fields?.role?.stringValue || null;
            }
          } catch {}
        }

        let targetRole: SessionPayload["role"] = "STUDENT";
        if (isSuperAdminEmail || authResult.role === "SUPER_ADMIN" || firestoreRole === "SUPER_ADMIN") {
          targetRole = "SUPER_ADMIN";
        } else if (isAdminEmail || authResult.role === "ADMIN" || firestoreRole === "ADMIN") {
          targetRole = "ADMIN";
        }

        const effectiveRole = targetRole;
        const userName = authResult.name || (userEmail ? userEmail.split("@")[0] : "Student");

        return {
          userId: authResult.uid,
          email: userEmail,
          role: effectiveRole,
          name: userName,
        };
      }
    }

    // 2. Check HTTP-only session cookie
    let token: string | undefined;
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {}

    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.userId) {
        // Double check admin emails in payload
        const userEmail = (payload.email || "").toLowerCase().trim();
        let role = payload.role;
        if (userEmail === "superadmin@sctech.com" || userEmail === "srics2425@gmail.com") {
          role = "SUPER_ADMIN";
        } else if (userEmail === "admin@sctech.com" && role !== "SUPER_ADMIN") {
          role = "ADMIN";
        }

        return {
          userId: payload.userId,
          email: userEmail,
          role,
          name: payload.name || (userEmail ? userEmail.split("@")[0] : "Student"),
        };
      }
    }

    return null;
  } catch (err) {
    console.error("[AUTH] getServerSession error:", err);
    return null;
  }
}

export async function requireAuth(req?: Request): Promise<{
  authorized: boolean;
  session: SessionPayload | null;
  errorResponse?: NextResponse;
}> {
  const session = await getServerSession(req);
  if (!session) {
    return {
      authorized: false,
      session: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized. Authentication required." },
        { status: 401 }
      ),
    };
  }
  return { authorized: true, session };
}

export async function requireAdmin(req?: Request): Promise<{
  authorized: boolean;
  session: SessionPayload | null;
  errorResponse?: NextResponse;
}> {
  const session = await getServerSession(req);
  if (!session) {
    return {
      authorized: false,
      session: null,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to continue." },
        { status: 401 }
      ),
    };
  }

  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    console.warn(`[AUTH] requireAdmin rejected user "${session.email}" (${session.userId}) with non-admin role: "${session.role}"`);
    return {
      authorized: false,
      session,
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden. Admin privileges required." },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}
