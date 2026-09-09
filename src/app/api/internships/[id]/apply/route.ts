import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Please log in as a student to apply" }, { status: 401 });
    }

    const internship = await prisma.internship.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
    });

    if (!internship || internship.status !== "ACTIVE") {
      return NextResponse.json({ error: "This internship is no longer accepting applications" }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.internshipApplication.findFirst({
      where: {
        internshipId: internship.id,
        studentId: session.userId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "You have already applied for this internship" }, { status: 400 });
    }

    const body = await req.json();

    const application = await prisma.internshipApplication.create({
      data: {
        internshipId: internship.id,
        studentId: session.userId,
        resumeUrl: body.resumeUrl || "https://sctech.io/resumes/default_resume.pdf",
        coverLetter: body.coverLetter || "Excited to apply for this position and contribute with my technical skills.",
        github: body.github || "https://github.com",
        portfolio: body.portfolio || "https://portfolio.dev",
        status: "APPLIED",
      },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: session.userId,
        title: "Internship Application Submitted",
        message: `Your application for "${internship.title}" has been received and is under review.`,
        type: "INTERNSHIP",
        link: "/my-internships",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your application has been submitted successfully!",
      application,
    });
  } catch (error: any) {
    console.error("Apply Internship Error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
