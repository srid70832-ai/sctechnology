import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in to register for sessions" }, { status: 401 });
    }

    const hrSession = await prisma.hRSession.findUnique({
      where: { id: params.id },
    });

    if (!hrSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const existing = await prisma.sessionRegistration.findFirst({
      where: {
        sessionId: params.id,
        userId: session.userId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already registered for this session" }, { status: 400 });
    }

    const registration = await prisma.sessionRegistration.create({
      data: {
        sessionId: params.id,
        userId: session.userId,
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.userId,
        title: "HR Session Seat Confirmed",
        message: `You are registered for "${hrSession.title}". The meeting link will be available before the session starts.`,
        type: "INFO",
        link: "/hr-sessions",
      },
    });

    return NextResponse.json({ success: true, message: "Seat confirmed successfully!", registration });
  } catch (error) {
    console.error("Register Session Error:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
