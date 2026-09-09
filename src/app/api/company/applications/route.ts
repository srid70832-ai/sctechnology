import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !["COMPANY", "HR", "ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let companyId: string | undefined;
    if (session.role === "COMPANY") {
      const comp = await prisma.company.findUnique({ where: { userId: session.userId } });
      companyId = comp?.id;
    }

    const applications = await prisma.internshipApplication.findMany({
      where: companyId ? { internship: { companyId } } : {},
      include: {
        internship: { select: { title: true, role: true, stipend: true } },
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
        interview: true,
        offer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("GET Applications Error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !["COMPANY", "HR", "ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { applicationId, status, meetingLink, scheduledAt, offerStipend } = await req.json();

    const application = await prisma.internshipApplication.update({
      where: { id: applicationId },
      data: { status, reviewedAt: new Date() },
      include: { internship: true, student: true },
    });

    if (status === "INTERVIEW_SCHEDULED" && scheduledAt) {
      await prisma.interview.upsert({
        where: { applicationId },
        update: { scheduledAt: new Date(scheduledAt), meetingLink, status: "SCHEDULED" },
        create: { applicationId, scheduledAt: new Date(scheduledAt), meetingLink, status: "SCHEDULED" },
      });
    }

    if (status === "SELECTED" && offerStipend) {
      await prisma.internshipOffer.upsert({
        where: { applicationId },
        update: { stipend: Number(offerStipend), joiningDate: new Date(), status: "OFFERED" },
        create: { applicationId, stipend: Number(offerStipend), joiningDate: new Date(), status: "OFFERED" },
      });
    }

    await prisma.notification.create({
      data: {
        userId: application.studentId,
        title: `Internship Status Update: ${status.replace("_", " ")}`,
        message: `Your application for "${application.internship.title}" is now marked as ${status.replace("_", " ")}.`,
        type: "INTERNSHIP",
        link: "/my-internships",
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Update Application Error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
