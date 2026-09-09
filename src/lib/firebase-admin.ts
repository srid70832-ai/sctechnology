import { initializeApp, getApps, getApp, App } from "firebase-admin/app";
import { getAuth, Auth, DecodedIdToken } from "firebase-admin/auth";

const projectId = 
  process.env.FIREBASE_PROJECT_ID || 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
  "scmain-b2cde";

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // If service account credentials are provided in env, use them
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    const { cert } = require("firebase-admin/app");
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  // Otherwise, initialize with projectId (works for public cert token verification)
  return initializeApp({
    projectId,
  });
}

export const adminApp = getAdminApp();
export const adminAuth: Auth = getAuth(adminApp);

export interface AuthVerificationResult {
  success: boolean;
  uid?: string;
  email?: string;
  name?: string;
  token?: string;
  decodedToken?: DecodedIdToken;
  error?: string;
  status: number;
}

/**
 * Validates the Authorization Bearer ID token from an incoming Request.
 * Decodes and verifies the Firebase ID token using Firebase Admin SDK.
 * Never trusts client-provided UID or email.
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

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken || !decodedToken.uid) {
      return {
        success: false,
        error: "Unauthorized. Invalid user identity.",
        status: 401,
      };
    }

    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name || decodedToken.displayName || (decodedToken.email ? decodedToken.email.split("@")[0] : "Student"),
      token,
      decodedToken,
      status: 200,
    };
  } catch (err: any) {
    console.error("Firebase Admin ID Token Verification Error:", err?.message || err);
    if (err?.code === "auth/id-token-expired") {
      return {
        success: false,
        error: "Your session has expired. Please refresh the page and try again.",
        status: 401,
      };
    }
    return {
      success: false,
      error: "Unauthorized. Please log in to continue.",
      status: 401,
    };
  }
}
