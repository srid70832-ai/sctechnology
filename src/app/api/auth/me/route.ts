import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getStudentProfile } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const studentProfile = await getStudentProfile(session.userId);

    return NextResponse.json({
      user: {
        ...session,
        avatarUrl: studentProfile?.photoURL || null,
        studentProfile,
        activeSubscription: null,
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
