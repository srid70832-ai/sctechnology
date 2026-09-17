import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { CollegeLogos } from "@/components/landing/CollegeLogos";
import { PopularInternships } from "@/components/landing/PopularInternships";
import { WhySCTech } from "@/components/landing/WhySCTech";
import { ProjectsSection } from "@/components/landing/ProjectsSection";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { prisma } from "@/lib/prisma";
import { REAL_WORLD_PROJECTS } from "@/lib/projects-data";
import { DEFAULT_PLANS } from "@/lib/plans";

const SITE_URL = "https://sctech.vercel.app";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SC TECH",
  url: "https://sctech.vercel.app/",
  logo: "https://sctech.vercel.app/sc-tech-logo.png",
  description:
    "SC TECH is an all-in-one platform for internships, hackathons, real-world projects, online courses and career opportunities.",
};

export const metadata: Metadata = {
  title: "SC TECH – Build Skills. Build Projects. Build Your Career.",
  description:
    "SC TECH is an all-in-one platform for internships, hackathons, real-world projects, online courses and career opportunities.",
  alternates: { canonical: "/" },
  openGraph: { url: `${SITE_URL}/` },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let studentsCount = 8240;
  let internshipsCount = 64;
  let hackathonsCount = 42;
  let projectsCount = 25;
  let internships: any[] = [];
  let upcomingHackathon: any = null;
  let projects: any[] = [];
  let plans: any[] = [];

  try {
    const results = await Promise.all([
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

    studentsCount = results[0] || 8240;
    internshipsCount = results[1] || 64;
    hackathonsCount = results[2] || 42;
    projectsCount = results[3] || 25;
    internships = results[4] || [];
    upcomingHackathon = results[5] || null;
    projects = results[6] || [];
    plans = results[7] || [];
  } catch (err) {
    console.warn("Prisma query notice on serverless runtime:", err);
  }

  // Attempt Firestore fetch for live hackathon data
  if (!upcomingHackathon) {
    try {
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("hackathons").where("status", "in", ["PUBLISHED", "ONGOING"]).limit(1).get();
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          upcomingHackathon = {
            id: snap.docs[0].id,
            ...docData,
          };
        }
      }
    } catch (fsErr) {
      console.warn("Firestore hackathon fetch on homepage notice:", fsErr);
    }
  }

  // Format internships with safe fallback
  const formattedInternships = internships.length > 0 ? internships.map((i: any) => ({
    id: i.id,
    title: i.title,
    role: i.role,
    slug: i.slug,
    companyName: i.company?.name || "Partner Company",
    companyLogo: i.company?.logoUrl,
    mode: i.mode,
    duration: i.duration,
    stipend: i.stipend,
    location: i.location,
  })) : [
    {
      id: "int-1",
      title: "Full Stack Web Developer Internship",
      role: "Full Stack Developer",
      slug: "full-stack-web-developer-internship",
      companyName: "TechCorp Labs",
      companyLogo: "/images/companies/google.png",
      mode: "Remote",
      duration: "6 Weeks",
      stipend: 12000,
      location: "Bangalore / Remote",
    },
    {
      id: "int-2",
      title: "AI & Machine Learning Internship",
      role: "AI Engineer Intern",
      slug: "ai-machine-learning-internship",
      companyName: "DataCore Systems",
      companyLogo: "/images/companies/microsoft.png",
      mode: "Remote",
      duration: "8 Weeks",
      stipend: 15000,
      location: "Hyderabad / Remote",
    },
    {
      id: "int-3",
      title: "Cloud DevOps Engineering Internship",
      role: "DevOps Engineer Intern",
      slug: "cloud-devops-internship",
      companyName: "CloudScale Inc",
      companyLogo: "/images/companies/amazon.png",
      mode: "Remote",
      duration: "6 Weeks",
      stipend: 14000,
      location: "Chennai / Remote",
    },
    {
      id: "int-4",
      title: "Cybersecurity Analyst Internship",
      role: "Security Analyst Intern",
      slug: "cybersecurity-analyst-internship",
      companyName: "SecureNet Defense",
      companyLogo: "/images/companies/meta.png",
      mode: "Remote",
      duration: "6 Weeks",
      stipend: 13000,
      location: "Pune / Remote",
    },
  ];

  const formattedHackathon = upcomingHackathon ? {
    id: upcomingHackathon.id || "hack-national-2026",
    title: upcomingHackathon.title || "SC TECH National Innovation Hackathon 2026",
    slug: upcomingHackathon.slug || "sctech-national-innovation-hackathon-2026",
    tagLine: upcomingHackathon.tagLine || "Build next-gen AI & full-stack solutions for real-world industry challenges",
    entryFee: typeof upcomingHackathon.entryFee === "number" ? upcomingHackathon.entryFee : 35,
    prizePool: typeof upcomingHackathon.prizePool === "number" ? upcomingHackathon.prizePool : 50000,
    startDate: typeof upcomingHackathon.startDate === "string" ? upcomingHackathon.startDate : upcomingHackathon.startDate?.toISOString?.() || new Date(Date.now() + 86400000 * 7).toISOString(),
    endDate: typeof upcomingHackathon.endDate === "string" ? upcomingHackathon.endDate : upcomingHackathon.endDate?.toISOString?.() || new Date(Date.now() + 86400000 * 9).toISOString(),
    participantsCount: upcomingHackathon._count?.registrations || upcomingHackathon.participantsCount || 340,
  } : {
    id: "hack-national-2026",
    title: "SC TECH National Innovation Hackathon 2026",
    slug: "sctech-national-innovation-hackathon-2026",
    tagLine: "Build next-gen AI & full-stack solutions for real-world industry challenges",
    entryFee: 35,
    prizePool: 50000,
    startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 9).toISOString(),
    participantsCount: 340,
  };

  const formattedProjects = projects.length > 0 ? projects.map((p: any) => {
    let features: string[] = [];
    if (Array.isArray(p.features)) {
      features = p.features;
    } else if (typeof p.features === "string") {
      try { features = JSON.parse(p.features); } catch { features = [p.features]; }
    }

    let techStack: string[] = [];
    const rawTech = p.technologyStack || p.techStack;
    if (Array.isArray(rawTech)) {
      techStack = rawTech;
    } else if (typeof rawTech === "string") {
      try { techStack = JSON.parse(rawTech); } catch { techStack = rawTech.split(",").map((s: string) => s.trim()).filter(Boolean); }
    }
    if (techStack.length === 0) {
      techStack = ["React", "TypeScript", "Node.js"];
    }

    return {
      id: p.id || `proj-${Date.now()}`,
      title: p.title || "Industry Project",
      slug: p.slug || p.id || "industry-project",
      shortDesc: p.shortDesc || p.shortDescription || p.description || "Real-world production repository blueprint.",
      description: p.description || p.shortDescription || "",
      features,
      techStack,
      difficulty: (p.difficulty || "Intermediate") as any,
      category: p.category || "Full Stack",
      isPremium: Boolean(p.isPremium),
      thumbnail: p.thumbnail || p.coverImage || "/images/projects/default.png",
      demoUrl: p.demoUrl || null,
      githubUrl: p.githubUrl || null,
      downloadCount: typeof p.downloadCount === "number" ? p.downloadCount : 150,
    };
  }) : REAL_WORLD_PROJECTS.slice(0, 8);

  const formattedPlans = plans.length > 0 ? plans.map((p: any) => {
    let features: string[] = [];
    if (Array.isArray(p.features)) {
      features = p.features;
    } else if (typeof p.features === "string") {
      try { features = JSON.parse(p.features); } catch { features = [p.features]; }
    }

    return {
      id: p.id || p.code || "PLAN",
      name: p.name || "Plan",
      code: p.code || "PLAN",
      price: typeof p.price === "number" ? p.price : 0,
      interval: p.interval || "month",
      tagline: p.tagline || "",
      features,
      projectAccess: Boolean(p.projectAccess),
      certificateAccess: Boolean(p.certificateAccess),
      hrSessionAccess: Boolean(p.hrSessionAccess),
      isPopular: Boolean(p.isPopular),
    };
  }) : DEFAULT_PLANS.map((p: any) => ({
    id: p.code,
    name: p.name,
    code: p.code,
    price: p.priceMonthly,
    interval: "month",
    tagline: p.tagline,
    features: Array.isArray(p.features) ? p.features : [],
    projectAccess: p.code !== "FREE",
    certificateAccess: p.code !== "FREE",
    hrSessionAccess: p.code === "PRO" || p.code === "CAREER",
    isPopular: Boolean(p.isPopular),
  }));

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col selection:bg-blue-600 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SC TECH",
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
          }),
        }}
      />
      <Navbar />

      <main className="flex-1">
        <HeroSection
          stats={{
            students: studentsCount,
            internships: internshipsCount,
            hackathons: hackathonsCount,
            projects: projectsCount,
          }}
        />

        <CollegeLogos />

        <PopularInternships internships={formattedInternships} />

        <ProjectsSection initialProjects={formattedProjects as any} />

        <WhySCTech />

        <PricingPlans plans={formattedPlans} />
      </main>

      <Footer />
    </div>
  );
}
