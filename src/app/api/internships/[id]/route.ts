import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();

    const internship = await prisma.internship.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        company: true,
      },
    });

    if (!internship) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    let hasApplied = false;
    let applicationStatus = null;

    if (session) {
      const app = await prisma.internshipApplication.findFirst({
        where: {
          internshipId: internship.id,
          studentId: session.userId,
        },
      });
      if (app) {
        hasApplied = true;
        applicationStatus = app.status;
      }
    }

    return NextResponse.json({
      internship: {
        ...internship,
        skills: JSON.parse(internship.skills || "[]"),
        responsibilities: JSON.parse(internship.responsibilities || "[]"),
        requirements: JSON.parse(internship.requirements || "[]"),
        companyName: internship.company.name,
        companyLogo: internship.company.logoUrl,
        companyDescription: internship.company.description,
        companyWebsite: internship.company.website,
        hasApplied,
        applicationStatus,
      },
    });
  } catch (error) {
    console.error("GET Internship by ID Error:", error);
    return NextResponse.json({ error: "Failed to fetch internship details" }, { status: 500 });
  }
}
