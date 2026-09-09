import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const { name, email, subject, category = "General", message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session?.userId || undefined,
        name,
        email,
        subject: subject || "Support Request",
        category,
        message,
        status: "OPEN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Support ticket created successfully. Our team will get back to you shortly.",
      ticket,
    });
  } catch (error) {
    console.error("Support Ticket Error:", error);
    return NextResponse.json({ error: "Failed to submit support ticket" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: ["ADMIN", "SUPER_ADMIN"].includes(session.role) ? {} : { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("GET Tickets Error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
