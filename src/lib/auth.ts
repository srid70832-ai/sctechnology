import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { adminAuth } from "./firebase-admin";

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
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
      const idToken = authHeader.substring(7).trim();
      if (idToken) {
        try {
          const decoded = await adminAuth.verifyIdToken(idToken);
          if (decoded && decoded.uid) {
            const userEmail = decoded.email ? decoded.email.toLowerCase() : "";
            
            // Find user in Prisma by firebaseUid or email
            let user = await prisma.user.findFirst({
              where: {
                OR: [
                  { firebaseUid: decoded.uid },
                  ...(userEmail ? [{ email: userEmail }] : []),
                ],
              },
              select: { id: true, email: true, role: true, name: true, status: true, firebaseUid: true },
            });

            const isAdminEmail = userEmail === "admin@sctech.com" || userEmail === "superadmin@sctech.com" || userEmail === "srics2425@gmail.com";

            // Check custom claims
            const hasAdminClaim = decoded.role === "ADMIN" || decoded.role === "SUPER_ADMIN" || decoded.admin === true;

            // Check Firestore users/{uid} document for role
            let firestoreRole: string | null = null;
            try {
              const fsRes = await fetch(
                `https://firestore.googleapis.com/v1/projects/scmain-b2cde/databases/(default)/documents/users/${decoded.uid}`,
                { headers: { Authorization: `Bearer ${idToken}` } }
              );
              if (fsRes.ok) {
                const fsJson = await fsRes.json();
                firestoreRole = fsJson.fields?.role?.stringValue || null;
              }
            } catch (fsErr) {
              console.warn("Firestore role lookup notice:", fsErr);
            }

            const isFirestoreAdmin = firestoreRole === "ADMIN" || firestoreRole === "SUPER_ADMIN";

            let targetRole: SessionPayload["role"] = "STUDENT";
            if (userEmail === "superadmin@sctech.com" || userEmail === "srics2425@gmail.com" || decoded.role === "SUPER_ADMIN" || firestoreRole === "SUPER_ADMIN") {
              targetRole = "SUPER_ADMIN";
            } else if (isAdminEmail || hasAdminClaim || isFirestoreAdmin || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
              targetRole = user?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
            }

            if (!user && userEmail) {
              // Ensure user exists in Prisma with authoritative role
              user = await prisma.user.create({
                data: {
                  firebaseUid: decoded.uid,
                  email: userEmail,
                  name: decoded.name || decoded.displayName || userEmail.split("@")[0],
                  role: targetRole,
                  isVerified: true,
                  status: "ACTIVE",
                  studentProfile: {
                    create: {
                      username: userEmail.split("@")[0] + "_" + Math.floor(100 + Math.random() * 900),
                      isPublic: true,
                    },
                  },
                },
                select: { id: true, email: true, role: true, name: true, status: true, firebaseUid: true },
              });
            } else if (user) {
              const needsRoleUpdate = (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN") && user.role !== targetRole;
              const needsUidUpdate = !user.firebaseUid;
              if (needsRoleUpdate || needsUidUpdate) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { 
                    firebaseUid: decoded.uid,
                    ...(needsRoleUpdate ? { role: targetRole } : {})
                  },
                  select: { id: true, email: true, role: true, name: true, status: true, firebaseUid: true },
                });
              }
            }

            if (user && user.status !== "SUSPENDED") {
              const effectiveRole = (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN") 
                ? targetRole 
                : (user.role as SessionPayload["role"]);

              return {
                userId: user.id,
                email: user.email,
                role: effectiveRole,
                name: user.name,
              };
            }

            if (!user) {
              return {
                userId: decoded.uid,
                email: userEmail,
                role: targetRole,
                name: decoded.name || (userEmail ? userEmail.split("@")[0] : "Student"),
              };
            }
          }
        } catch (tokenErr) {
          console.warn("Token verification fallback notice:", tokenErr);
          // Token verification failed or expired, fall through to cookie check
        }
      }
    }

    // 2. Check HTTP-only session cookie
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Verify user in db
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, name: true, status: true },
    });

    if (!user || user.status === "SUSPENDED") return null;

    return {
      userId: user.id,
      email: user.email,
      role: user.role as SessionPayload["role"],
      name: user.name,
    };
  } catch {
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
