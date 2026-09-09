import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await prisma.hRSession.findMany({
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET HR Sessions Error:", error);
    return NextResponse.json({ error: "Failed to fetch HR sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !["ADMIN", "SUPER_ADMIN", "HR"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const created = await prisma.hRSession.create({
      data: {
        title: body.title,
        speakerName: body.speakerName,
        speakerRole: body.speakerRole,
        speakerCompany: body.speakerCompany,
        speakerAvatar: body.speakerAvatar,
        topic: body.topic,
        scheduledAt: new Date(body.scheduledAt),
        durationMinutes: Number(body.durationMinutes) || 60,
        meetUrl: body.meetUrl,
        maxAttendees: Number(body.maxAttendees) || 100,
      },
    });

    return NextResponse.json({ success: true, session: created }, { status: 201 });
  } catch (error) {
    console.error("POST HR Session Error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
