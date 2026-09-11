import { NextResponse } from "next/server";
import { comparePassword, signJWT, setSessionCookie } from "@/lib/auth";
import { queryFirestoreDocs, COLLECTIONS, getStudentProfile } from "@/lib/firestore";
import { where } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const users = await queryFirestoreDocs(COLLECTIONS.USERS, where("email", "==", cleanEmail));
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ 
        error: "This account was registered using Google Sign-In. Please click 'Continue with Google'." 
      }, { status: 400 });
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account is currently suspended. Please contact support." }, { status: 403 });
    }

    const userId = user.uid || user.id;
    const token = signJWT({
      userId,
      email: user.email,
      name: user.name || user.displayName || user.email.split("@")[0],
      role: user.role || "STUDENT",
    });

    setSessionCookie(token);
    const studentProfile = await getStudentProfile(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: user.email,
        name: user.name || user.displayName,
        role: user.role || "STUDENT",
        avatarUrl: user.avatarUrl || user.photoURL || null,
        studentProfile,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
