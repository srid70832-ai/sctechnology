import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { attributeSignup } from "@/lib/referrals/service";

export async function POST(req: Request) {
  try {
    const { name, email, password, role = "STUDENT", college, department, referralCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = ["STUDENT", "COMPANY"].includes(role) ? role : "STUDENT";

    const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") + Math.floor(100 + Math.random() * 900);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: assignedRole,
        isVerified: true,
        studentProfile: assignedRole === "STUDENT" ? {
          create: {
            username,
            college: college || "",
            department: department || "",
            profileScore: 40,
          },
        } : undefined,
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role as any,
      name: newUser.name,
    });

    // Create a welcome notification
        // Attribute referral if code provided
    if (referralCode) {
      try {
        await attributeSignup({
          newUserId: newUser.id,
          newUserName: newUser.name,
          newUserEmail: newUser.email,
          referralCode,
          source: "WEBSITE",
        });
      } catch (refErr) {
        console.warn("Referral signup attribution notice:", refErr);
      }
    }

    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: "Welcome to SC TECH! 🚀",
        message: "Your account has been created. Start exploring internships, hackathons, and real-world projects today.",
        type: "INFO",
        link: "/dashboard",
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
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
