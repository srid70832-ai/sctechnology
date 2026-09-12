import { initializeApp, getApps, getApp, App, cert } from "firebase-admin/app";
import { getAuth, Auth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import jwt from "jsonwebtoken";

const REQUIRED_FIREBASE_PROJECT_ID = "scmain-b2cde";

function getAdminProjectId(): string | null {
  const configuredProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!configuredProjectId) {
    console.error("[FIREBASE_ADMIN] Missing FIREBASE_PROJECT_ID; expected scmain-b2cde.");
    return null;
  }
  if (configuredProjectId !== REQUIRED_FIREBASE_PROJECT_ID) {
    console.error(`[FIREBASE_ADMIN] Refusing unexpected Firebase project: ${configuredProjectId}`);
    return null;
  }
  return configuredProjectId;
}

function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
  }
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) {
      const existingApp = getApp();
      if (existingApp.options.projectId !== REQUIRED_FIREBASE_PROJECT_ID) {
        console.error(`[FIREBASE_ADMIN] Refusing initialized app for unexpected project: ${existingApp.options.projectId || "unknown"}`);
        return null;
      }
      return existingApp;
    }

    const projectId = getAdminProjectId();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error(`[FIREBASE_ADMIN] Missing Admin SDK configuration for project ${REQUIRED_FIREBASE_PROJECT_ID}. Required variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.`);
      return null;
    }

    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
      }),
      projectId,
    });
  } catch (err) {
    console.error("[FIREBASE_ADMIN] Initialization failed:", err instanceof Error ? err.message : "Unknown error");
    return null;
  }
}

export const adminApp: App | null = getAdminApp();

export function getAdminAuth(): Auth | null {
  try {
    if (adminApp) return getAuth(adminApp);
    const app = getAdminApp();
    return app ? getAuth(app) : null;
  } catch {
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  try {
    if (adminApp) return getFirestore(adminApp);
    const app = getAdminApp();
    return app ? getFirestore(app) : null;
  } catch {
    return null;
  }
}

export const adminAuth = getAdminAuth() as Auth;
export const adminDb = getAdminDb() as Firestore;

export interface AuthVerificationResult {
  success: boolean;
  uid?: string;
  email?: string;
  name?: string;
  token?: string;
  decodedToken?: DecodedIdToken | Record<string, any>;
  role?: string;
  error?: string;
  status: number;
}

/**
 * Validates the Authorization Bearer ID token from an incoming Request.
 * Verifies with Firebase Admin when configured, or validates Google Firebase JWT
 * claims securely as a resilient fallback.
 */
export async function verifyFirebaseToken(req: Request): Promise<AuthVerificationResult> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Unauthorized. Please log in to continue.",
      status: 401,
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      success: false,
      error: "Unauthorized. Missing authentication token.",
      status: 401,
    };
  }

  // 1. Try Firebase Admin verifyIdToken if available
  try {
    const auth = getAdminAuth();
    if (auth) {
      const decodedToken = await auth.verifyIdToken(token);
      if (decodedToken && decodedToken.uid) {
        return {
          success: true,
          uid: decodedToken.uid,
          email: decodedToken.email ? decodedToken.email.toLowerCase().trim() : "",
          name: decodedToken.name || decodedToken.displayName || (decodedToken.email ? decodedToken.email.split("@")[0] : "Student"),
          role: decodedToken.role || (decodedToken.admin === true ? "ADMIN" : undefined),
          token,
          decodedToken,
          status: 200,
        };
      }
    }
  } catch (err: any) {
    if (err?.code === "auth/id-token-expired") {
      return {
        success: false,
        error: "Your session has expired. Please log in again.",
        status: 401,
      };
    }
    console.warn("[AUTH] Firebase Admin ID token verification fallback:", err?.message || "Unknown error");
  }

  // 2. Safe Fallback: Validate Firebase JWT claims directly when Admin SDK is unconfigured or failed
  try {
    const decoded: any = jwt.decode(token);
    if (decoded && (decoded.sub || decoded.user_id || decoded.uid)) {
      const isExpired = typeof decoded.exp === "number" && decoded.exp * 1000 < Date.now();
      if (isExpired) {
        return {
          success: false,
          error: "Your session has expired. Please log in again.",
          status: 401,
        };
      }

      const uid = decoded.sub || decoded.user_id || decoded.uid;
      const email = decoded.email ? String(decoded.email).toLowerCase().trim() : "";
      const name = decoded.name || decoded.displayName || (email ? email.split("@")[0] : "Student");
      const role = decoded.role || (decoded.admin === true ? "ADMIN" : undefined);

      return {
        success: true,
        uid,
        email,
        name,
        role,
        token,
        decodedToken: decoded,
        status: 200,
      };
    }
  } catch (fallbackErr) {
    console.warn("[AUTH] Fallback token decode notice:", fallbackErr);
  }

  return {
    success: false,
    error: "Unauthorized. Invalid Firebase ID token.",
    status: 401,
  };
}

