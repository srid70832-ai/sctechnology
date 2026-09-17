import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { CollegeLogos } from "@/components/landing/CollegeLogos";
import { FutureCareerNetwork } from "@/components/landing/FutureCareerNetwork";
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

  // 1. Fetch live curated featured opportunities from Firestore siteSettings/homepage
  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const adminDb = getAdminDb();
    if (adminDb) {
      const settingsDoc = await adminDb.collection("siteSettings").doc("homepage").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : null;

      // Resolve Featured Hackathon
      if (settings?.featuredHackathonId) {
        const hDoc = await adminDb.collection("hackathons").doc(settings.featuredHackathonId).get();
        if (hDoc.exists) {
          const d = hDoc.data()!;
          if (d.status === "PUBLISHED" || d.status === "ONGOING" || !d.status) {
            upcomingHackathon = {
              id: hDoc.id,
              ...d,
            };
          }
        }
      }

      // If no admin-selected hackathon or unpublished, fallback to latest published
      if (!upcomingHackathon) {
        const snap = await adminDb.collection("hackathons").where("status", "in", ["PUBLISHED", "ONGOING"]).limit(1).get();
        if (!snap.empty) {
          upcomingHackathon = {
            id: snap.docs[0].id,
            ...snap.docs[0].data(),
          };
        }
      }

      // Resolve Featured Internships
      const curatedInternships: any[] = [];
      if (settings?.featuredInternshipId1) {
        const iDoc1 = await adminDb.collection("internships").doc(settings.featuredInternshipId1).get();
        if (iDoc1.exists && (iDoc1.data()?.status === "PUBLISHED" || !iDoc1.data()?.status)) {
          curatedInternships.push({ id: iDoc1.id, ...iDoc1.data() });
        }
      }
      if (settings?.featuredInternshipId2) {
        const iDoc2 = await adminDb.collection("internships").doc(settings.featuredInternshipId2).get();
        if (iDoc2.exists && (iDoc2.data()?.status === "PUBLISHED" || !iDoc2.data()?.status)) {
          curatedInternships.push({ id: iDoc2.id, ...iDoc2.data() });
        }
      }

      // If no admin curated internships or unpublished, fetch top published from Firestore
      if (curatedInternships.length === 0) {
        const iSnap = await adminDb.collection("internships").where("status", "==", "PUBLISHED").limit(2).get();
        iSnap.forEach((doc) => {
          curatedInternships.push({ id: doc.id, ...doc.data() });
        });
      }

      if (curatedInternships.length > 0) {
        internships = curatedInternships;
      }
    }
  } catch (fsErr) {
    console.warn("Firestore featured homepage fetch notice:", fsErr);
  }

  // Format internships for PopularInternships component
  const formattedInternships = internships.map((i: any) => ({
    id: i.id,
    title: i.title || "Internship Role",
    role: i.role || i.title || "",
    slug: i.slug || i.id,
    companyName: i.companyName || i.company?.name || "SC TECH",
    companyLogoUrl: i.companyLogoUrl || i.companyLogo || i.company?.logoUrl || null,
    mode: i.mode || "Remote",
    duration: i.duration || "6 Weeks",
    stipend: i.stipend || (i.stipendAmount ? `₹${i.stipendAmount}` : "Stipend Provided"),
    location: i.location || "Remote",
    description: i.description || "",
  }));

  const formattedHackathon = upcomingHackathon ? {
    id: upcomingHackathon.id,
    title: upcomingHackathon.title || "SC TECH Hackathon",
    slug: upcomingHackathon.slug || upcomingHackathon.id,
    tagLine: upcomingHackathon.tagLine || upcomingHackathon.shortDescription || "Code. Innovate. Elevate.",
    entryFee: Number(upcomingHackathon.entryFee ?? upcomingHackathon.registrationFee ?? 0),
    prizePool: Number(upcomingHackathon.prizePool ?? 0),
    startDate: typeof upcomingHackathon.startDate === "string" ? upcomingHackathon.startDate : upcomingHackathon.startDate?.toISOString?.() || upcomingHackathon.startDate,
    endDate: typeof upcomingHackathon.endDate === "string" ? upcomingHackathon.endDate : upcomingHackathon.endDate?.toISOString?.() || upcomingHackathon.endDate,
    mode: upcomingHackathon.mode || "Online",
    participantsCount: upcomingHackathon._count?.registrations || upcomingHackathon.participantsCount || 0,
    status: upcomingHackathon.status || "PUBLISHED",
  } : null;

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

        <FutureCareerNetwork
          stats={{
            students: studentsCount,
            projects: projectsCount,
            internships: internshipsCount,
            hackathons: hackathonsCount,
          }}
        />

        <PopularInternships internships={formattedInternships} />

        <ProjectsSection initialProjects={formattedProjects as any} />

        <WhySCTech />

        <PricingPlans plans={formattedPlans} />
      </main>

      <Footer />
    </div>
  );
}
