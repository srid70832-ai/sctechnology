import { NextResponse } from "next/server";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { attributeSignup } from "@/lib/referrals/service";
import { saveFirestoreDoc, getFirestoreDoc, queryFirestoreDocs, COLLECTIONS, saveStudentProfile } from "@/lib/firestore";
import { where } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, password, role = "STUDENT", college, department, referralCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUsers = await queryFirestoreDocs(COLLECTIONS.USERS, where("email", "==", cleanEmail));

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = ["STUDENT", "COMPANY"].includes(role) ? role : "STUDENT";
    const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const username = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + Math.floor(100 + Math.random() * 900);

    await saveFirestoreDoc(COLLECTIONS.USERS, userId, {
      id: userId,
      uid: userId,
      name,
      email: cleanEmail,
      passwordHash,
      role: assignedRole,
      isVerified: true,
      createdAt: new Date().toISOString(),
    });

    if (assignedRole === "STUDENT") {
      await saveStudentProfile(userId, {
        uid: userId,
        fullName: name,
        email: cleanEmail,
        displayName: name,
        college: college || "",
        department: department || "",
        onboardingCompleted: false,
        profileCompleted: false,
      });
    }

    const token = signToken({
      userId,
      email: cleanEmail,
      role: assignedRole as any,
      name,
    });

    // Attribute referral if code provided
    if (referralCode) {
      try {
        await attributeSignup({
          newUserId: userId,
          newUserName: name,
          newUserEmail: cleanEmail,
          referralCode,
          source: "WEBSITE",
        });
      } catch (refErr) {
        console.warn("Referral signup attribution notice:", refErr);
      }
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name,
        role: assignedRole,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
