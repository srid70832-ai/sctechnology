import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hackathons = await prisma.hackathon.findMany({
      include: {
        _count: {
          select: { registrations: true, submissions: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    const formatted = hackathons.map((h) => ({
      id: h.id,
      title: h.title,
      slug: h.slug,
      tagLine: h.tagLine,
      description: h.description,
      entryFee: h.entryFee,
      prizePool: h.prizePool,
      startDate: h.startDate.toISOString(),
      endDate: h.endDate.toISOString(),
      registrationDeadline: h.registrationDeadline.toISOString(),
      maxTeamSize: h.maxTeamSize,
      rules: JSON.parse(h.rules || "[]"),
      judgingCriteria: JSON.parse(h.judgingCriteria || "[]"),
      faqs: JSON.parse(h.faqs || "[]"),
      bannerUrl: h.bannerUrl,
      status: h.status,
      participantsCount: h._count.registrations,
      submissionsCount: h._count.submissions,
      problemPublished: h.problemPublished,
      problemStatement: h.problemPublished ? h.problemStatement : null,
      problemReleasedAt: h.problemReleasedAt?.toISOString() || null,
    }));

    return NextResponse.json({ hackathons: formatted });
  } catch (error) {
    console.error("GET Hackathons Error:", error);
    return NextResponse.json({ error: "Failed to fetch hackathons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const slug = body.title.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);

    const hackathon = await prisma.hackathon.create({
      data: {
        title: body.title,
        slug,
        tagLine: body.tagLine || "Code, Innovate, Elevate",
        description: body.description,
        problemStatement: body.problemStatement,
        problemPublished: body.problemPublished ?? true,
        entryFee: Number(body.entryFee) || 35,
        prizePool: Number(body.prizePool) || 50000,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        registrationDeadline: new Date(body.registrationDeadline),
        rules: JSON.stringify(body.rules || []),
        judgingCriteria: JSON.stringify(body.judgingCriteria || []),
        faqs: JSON.stringify(body.faqs || []),
        bannerUrl: body.bannerUrl,
      },
    });

    return NextResponse.json({ success: true, hackathon }, { status: 201 });
  } catch (error) {
    console.error("POST Hackathon Error:", error);
    return NextResponse.json({ error: "Failed to create hackathon" }, { status: 500 });
  }
}
