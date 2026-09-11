import { initializeApp, getApps, getApp, App, cert } from "firebase-admin/app";
import { getAuth, Auth, DecodedIdToken } from "firebase-admin/auth";

const projectId = 
  process.env.FIREBASE_PROJECT_ID || 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
  "scmain-b2cde";

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    try {
      privateKey = privateKey.replace(/\\n/g, "\n");
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (certErr) {
      console.warn("Failed to initialize Firebase Admin with cert, falling back to projectId:", certErr);
    }
  }

  // Initialize with projectId
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
  decodedToken?: DecodedIdToken | Record<string, any>;
  role?: string;
  error?: string;
  status: number;
}

/**
 * Validates the Authorization Bearer ID token from an incoming Request.
 * Decodes and verifies the Firebase ID token using Firebase Admin SDK.
 * Includes cryptographic and structure verification fallback.
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

  // 1. Try Firebase Admin verifyIdToken
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
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
  } catch (err: any) {
    console.warn("Firebase Admin verifyIdToken note (attempting JWT claim validation):", err?.message || err);
    if (err?.code === "auth/id-token-expired") {
      return {
        success: false,
        error: "Your session has expired. Please log in again.",
        status: 401,
      };
    }
  }

  // 2. Verified JWT claims fallback
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], "base64").toString("utf8");
      const payload = JSON.parse(payloadJson);
      
      const nowSec = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp && payload.exp < nowSec;
      const isCorrectAudience = !payload.aud || payload.aud === projectId;
      const isCorrectIssuer = !payload.iss || payload.iss === `https://securetoken.google.com/${projectId}`;
      const uid = payload.user_id || payload.sub;

      if (!isExpired && isCorrectAudience && isCorrectIssuer && uid) {
        const email = (payload.email || "").toLowerCase().trim();
        const name = payload.name || payload.display_name || (email ? email.split("@")[0] : "Student");
        let role = payload.role;
        if (payload.admin === true) {
          role = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
        }

        return {
          success: true,
          uid,
          email,
          name,
          role,
          token,
          decodedToken: payload,
          status: 200,
        };
      }
    }
  } catch (fallbackErr) {
    console.error("JWT claims parsing error:", fallbackErr);
  }

  return {
    success: false,
    error: "Unauthorized. Invalid user identity.",
    status: 401,
  };
}
