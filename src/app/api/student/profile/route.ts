import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        studentProfile: true,
        certificates: true,
        hackathonRegistrations: {
          include: { hackathon: true, submission: true },
        },
        internshipApplications: {
          include: { internship: { include: { company: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        profile: user.studentProfile ? {
          ...user.studentProfile,
          skills: JSON.parse(user.studentProfile.skills || "[]"),
        } : null,
        certificates: user.certificates,
        hackathons: user.hackathonRegistrations,
        applications: user.internshipApplications,
      },
    });
  } catch (error) {
    console.error("GET Profile Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatarUrl, mobile, college, department, year, skills, github, linkedin, portfolio, resumeUrl, bio, isPublic } = body;

    if (name || avatarUrl !== undefined) {
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          ...(name ? { name } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl ? avatarUrl : null } : {}),
        },
      });
    }

    const profile = await prisma.studentProfile.upsert({
      where: { userId: session.userId },
      update: {
        mobile,
        college,
        department,
        year,
        skills: JSON.stringify(skills || []),
        github,
        linkedin,
        portfolio,
        resumeUrl,
        bio,
        isPublic: isPublic ?? true,
      },
      create: {
        userId: session.userId,
        mobile,
        college,
        department,
        year,
        skills: JSON.stringify(skills || []),
        github,
        linkedin,
        portfolio,
        resumeUrl,
        bio,
        isPublic: isPublic ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      profile: {
        ...profile,
        skills: JSON.parse(profile.skills || "[]"),
      },
    });
  } catch (error) {
    console.error("PUT Profile Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
