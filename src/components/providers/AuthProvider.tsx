"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserSession } from "@/types";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser
} from "@/lib/firebase";
import { getStudentProfile, saveStudentProfile, StudentProfileData } from "@/lib/firestore";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AuthContextType {
  user: UserSession | null;
  firebaseUser: FirebaseUser | null;
  studentProfile: StudentProfileData | null;
  loading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; onboardingRequired?: boolean; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; onboardingRequired?: boolean; error?: string }>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  studentProfile: null,
  loading: true,
  loginWithGoogle: async () => ({ success: false }),
  loginWithEmail: async () => ({ success: false }),
  registerWithEmail: async () => ({ success: false }),
  logout: async () => {},
  refresh: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user with Firestore
  const syncFirestoreUser = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      const cleanEmail = (fbUser.email || "").toLowerCase().trim();
      let role = "STUDENT";
      if (cleanEmail === "srics2425@gmail.com" || cleanEmail === "superadmin@sctech.com") {
        role = "SUPER_ADMIN";
      } else if (cleanEmail === "admin@sctech.com") {
        role = "ADMIN";
      }

      if (!userSnap.exists()) {
        // Auto-claim referral code if saved in localStorage or cookie
        if (typeof window !== "undefined") {
          const storedRef = localStorage.getItem("sctech_referral_code") || sessionStorage.getItem("sctech_referral_code");
          if (storedRef) {
            try {
              fetch("/api/referrals/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ referralCode: storedRef, source: "WEBSITE" }),
              }).catch(() => {});
            } catch {}
          }
        }
        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || (role === "SUPER_ADMIN" ? "Super Admin" : "Student"),
          photoURL: fbUser.photoURL || null,
          role,
          emailVerified: Boolean(fbUser.emailVerified),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const userData = userSnap.data();
        if (role === "STUDENT" && userData?.role) {
          role = userData.role;
        }
        await setDoc(userRef, {
          displayName: fbUser.displayName || userData?.displayName || (role === "SUPER_ADMIN" ? "Super Admin" : "Student"),
          photoURL: fbUser.photoURL || userData?.photoURL || null,
          role,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      // Check student profile in Firestore (students/{uid})
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || cleanEmail === "srics2425@gmail.com" || cleanEmail === "admin@sctech.com";
      let profile = await getStudentProfile(fbUser.uid);
      if (isAdmin) {
        if (!profile) {
          profile = {
            uid: fbUser.uid,
            fullName: fbUser.displayName || fbUser.email?.split("@")[0] || (role === "SUPER_ADMIN" ? "Super Admin" : "Admin"),
            email: fbUser.email || "",
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || (role === "SUPER_ADMIN" ? "Super Admin" : "Admin"),
            photoURL: fbUser.photoURL || null,
            mobileNumber: "",
            college: "SC TECH",
            department: "Administration",
            yearOfStudy: "Staff",
            technicalSkills: ["Administration"],
            skills: ["Administration"],
            githubUrl: null,
            linkedinUrl: null,
            portfolioUrl: null,
            resumeUrl: null,
            resumeFileName: null,
            resumeStoragePath: null,
            bio: "SC TECH Administrator",
            profileCompleted: true,
            onboardingCompleted: true,
            onboardingStep: 7,
          };
          await saveStudentProfile(fbUser.uid, profile);
        } else if (!profile.onboardingCompleted || !profile.profileCompleted) {
          profile.onboardingCompleted = true;
          profile.profileCompleted = true;
          await saveStudentProfile(fbUser.uid, profile);
        }
      } else if (!profile) {
        profile = {
          uid: fbUser.uid,
          fullName: fbUser.displayName || fbUser.email?.split("@")[0] || "",
          email: fbUser.email || "",
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Student",
          photoURL: fbUser.photoURL || null,
          mobileNumber: "",
          college: "",
          department: "",
          yearOfStudy: "",
          technicalSkills: [],
          skills: [],
          githubUrl: null,
          linkedinUrl: null,
          portfolioUrl: null,
          resumeUrl: null,
          resumeFileName: null,
          resumeStoragePath: null,
          bio: "",
          profileCompleted: false,
          onboardingCompleted: false,
          onboardingStep: 0,
        };
        await saveStudentProfile(fbUser.uid, profile);
      }

      setStudentProfile(profile);

      setUser({
        userId: fbUser.uid,
        email: fbUser.email || "",
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "Student",
        role: role as any,
        avatarUrl: fbUser.photoURL || null,
        studentProfile: profile,
      });

      // Synchronize server HTTP-only session cookie
      try {
        const idToken = await fbUser.getIdToken();
        await fetch("/api/auth/firebase-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Student",
            photoURL: fbUser.photoURL,
          }),
        });
      } catch (cookieSyncErr) {
        console.warn("Session cookie sync non-blocking error:", cookieSyncErr);
      }

      return profile;
    } catch (err) {
      console.error("Firestore user sync error:", err);
      return null;
    }
  };

  useEffect(() => {
    // Check redirect auth result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await syncFirestoreUser(result.user);
        }
      })
      .catch((err) => {
        console.error("Redirect auth error:", err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);
      if (currentFbUser) {
        await syncFirestoreUser(currentFbUser);
      } else {
        setUser(null);
        setStudentProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        if (popupErr.code === "auth/popup-blocked" || popupErr.code === "auth/popup-closed-by-user") {
          if (popupErr.code === "auth/popup-closed-by-user") {
            return { success: false, error: "Google sign-in was cancelled." };
          }
          await signInWithRedirect(auth, googleProvider);
          return { success: true };
        }
        throw popupErr;
      }

      if (result?.user) {
        const profile = await syncFirestoreUser(result.user);
        const cleanEmail = (result.user.email || "").toLowerCase().trim();
        const isAdmin = cleanEmail === "srics2425@gmail.com" || cleanEmail === "admin@sctech.com" || profile?.department === "Administration";
        const onboardingRequired = !isAdmin && profile?.onboardingCompleted !== true;
        return { success: true, onboardingRequired, isAdmin };
      }
      return { success: false, error: "Authentication synchronization failed." };
    } catch (error: any) {
      console.error("Google login error:", error);
      let msg = "Unable to sign in with Google. Please try again.";
      if (error.code === "auth/cancelled-popup-request" || error.code === "auth/popup-closed-by-user") {
        msg = "Google sign-in was cancelled.";
      } else if (error.code === "auth/unauthorized-domain") {
        msg = "This domain is not authorized for Firebase Google Auth. Please check Firebase Console.";
      } else if (error.code === "auth/network-request-failed") {
        msg = "Network connection failed. Please check your internet connection.";
      }
      return { success: false, error: msg };
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await syncFirestoreUser(cred.user);
      const cleanEmail = (email || "").toLowerCase().trim();
      const isAdmin = cleanEmail === "srics2425@gmail.com" || cleanEmail === "admin@sctech.com" || profile?.department === "Administration";
      const onboardingRequired = !isAdmin && profile?.onboardingCompleted !== true;
      return { success: true, onboardingRequired, isAdmin };
    } catch (error: any) {
      console.error("Email login error:", error);
      let msg = "Invalid email or password.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        msg = "Invalid email address or password.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Too many failed attempts. Please try again later or reset password.";
      }
      return { success: false, error: msg };
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await syncFirestoreUser(cred.user);
      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      let msg = "Failed to create account.";
      if (error.code === "auth/email-already-in-use") {
        msg = "An account with this email address already exists.";
      } else if (error.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      setStudentProfile(null);
      window.location.href = "/login";
    }
  };

  const refresh = async () => {
    if (auth.currentUser) {
      await syncFirestoreUser(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        studentProfile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
