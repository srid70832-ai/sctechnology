import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { CollegeLogos } from "@/components/landing/CollegeLogos";
import { PopularInternships } from "@/components/landing/PopularInternships";
import { WhySCTech } from "@/components/landing/WhySCTech";
import { ProjectsSection } from "@/components/landing/ProjectsSection";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch real data from Prisma DB
  const [
    studentsCount,
    internshipsCount,
    hackathonsCount,
    projectsCount,
    internships,
    upcomingHackathon,
    projects,
    plans,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.internship.count({ where: { status: "ACTIVE" } }),
    prisma.hackathon.count(),
    prisma.project.count(),
    prisma.internship.findMany({
      where: { status: "ACTIVE" },
      include: { company: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.hackathon.findFirst({
      where: { status: "UPCOMING" },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.project.findMany({
      take: 8,
      orderBy: { downloadCount: "desc" },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
  ]);

  const formattedInternships = internships.map((i) => ({
    id: i.id,
    title: i.title,
    role: i.role,
    slug: i.slug,
    companyName: i.company.name,
    companyLogo: i.company.logoUrl,
    mode: i.mode,
    duration: i.duration,
    stipend: i.stipend,
  }));

  const formattedHackathon = upcomingHackathon ? {
    id: upcomingHackathon.id,
    title: upcomingHackathon.title,
    slug: upcomingHackathon.slug,
    tagLine: upcomingHackathon.tagLine,
    entryFee: upcomingHackathon.entryFee,
    prizePool: upcomingHackathon.prizePool,
    startDate: upcomingHackathon.startDate.toISOString(),
    endDate: upcomingHackathon.endDate.toISOString(),
    participantsCount: upcomingHackathon._count.registrations,
  } : null;

  const formattedProjects = projects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDesc: p.shortDesc,
    description: p.description,
    features: JSON.parse(p.features || "[]"),
    techStack: JSON.parse(p.techStack || "[]"),
    difficulty: p.difficulty as any,
    category: p.category,
    isPremium: p.isPremium,
    thumbnail: p.thumbnail,
    demoUrl: p.demoUrl,
    githubUrl: p.githubUrl,
    downloadCount: p.downloadCount,
  }));

  const formattedPlans = plans.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    price: p.price,
    interval: p.interval,
    tagline: p.tagline,
    features: JSON.parse(p.features || "[]"),
    projectAccess: p.projectAccess,
    certificateAccess: p.certificateAccess,
    hrSessionAccess: p.hrSessionAccess,
    isPopular: p.isPopular,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          stats={{
            students: studentsCount || 1000,
            internships: internshipsCount || 150,
            hackathons: hackathonsCount || 25,
            projects: projectsCount || 500,
          }}
        />

        {/* College Trust Logos */}
        <CollegeLogos />

        {/* Popular Internships + Hackathon Spotlight Card */}
        <PopularInternships
          internships={formattedInternships}
          upcomingHackathon={formattedHackathon}
        />

        {/* Why SC TECH 6 Pillars */}
        <WhySCTech />

        {/* Real-World Projects with Search and Difficulty Filter */}
        <ProjectsSection initialProjects={formattedProjects} />

        {/* Configurable Subscription Plans */}
        <PricingPlans plans={formattedPlans} />
      </main>

      <Footer />
    </div>
  );
}
