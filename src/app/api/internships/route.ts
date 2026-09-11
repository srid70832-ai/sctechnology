import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VERIFIED_REAL_INTERNSHIP_POOL, DiscoveredInternship, loadDiscoveredInternships } from "@/lib/gemini-discovery";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const mode = searchParams.get("mode") || "";
    const category = searchParams.get("category") || "";
    const skill = searchParams.get("skill")?.toLowerCase().trim() || "";
    const isPaid = searchParams.get("paid");
    const closingSoon = searchParams.get("closingSoon") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limitCount = parseInt(searchParams.get("limit") || "24", 10);

    // 1. Fetch Discovered & Published Internships
    let firestoreList: DiscoveredInternship[] = [];
    try {
      const stored = loadDiscoveredInternships();
      for (const item of stored) {
        if (item.status === "PUBLISHED" && item.isActive !== false) {
          firestoreList.push(item);
        }
      }
    } catch (fsErr) {
      console.warn("Discovered internships read notice:", fsErr);
    }

    // 2. Fetch Prisma internal internships
    let prismaFormatted: any[] = [];
    try {
      const prismaInternships = await prisma.internship.findMany({
        where: { status: "ACTIVE" },
        include: {
          company: {
            select: { id: true, name: true, logoUrl: true, location: true, verified: true },
          },
        },
      });

      prismaFormatted = prismaInternships.map((item: any) => ({
        id: item.id,
        title: item.title,
        company: item.company.name,
        description: item.description,
        skills: JSON.parse(item.skills || "[]"),
        category: "Software Development",
        location: item.location,
        workMode: (item.mode === "On-site" ? "On-site" : item.mode === "Hybrid" ? "Hybrid" : "Remote") as any,
        duration: item.duration,
        stipend: item.stipend > 0 ? `₹${item.stipend.toLocaleString("en-IN")} / month` : "Unpaid",
        eligibility: "Open to all verified college students",
        deadline: item.deadline.toISOString(),
        applicationUrl: `/internships/${item.id}`,
        sourceUrl: `/internships/${item.id}`,
        sourceName: "SC TECH Official",
        verified: true,
        verificationStatus: "VERIFIED" as const,
        fetchedBy: "Gemini AI" as const,
        fetchedAt: item.createdAt.toISOString(),
        publishedAt: item.createdAt.toISOString(),
        isActive: true,
        status: "PUBLISHED" as const,
        dedupKey: `prisma_${item.id}`,
      }));
    } catch (dbErr) {
      console.warn("Prisma internships read notice:", dbErr);
    }

    let combined = [...firestoreList, ...prismaFormatted];

    // If both empty, fallback to verified real pool
    if (combined.length === 0) {
      const now = new Date().toISOString();
      combined = VERIFIED_REAL_INTERNSHIP_POOL.map((p, idx) => ({
        ...p,
        id: `intern_pool_${idx + 1}`,
        verified: true,
        verificationStatus: "VERIFIED" as const,
        fetchedBy: "Gemini AI" as const,
        fetchedAt: now,
        publishedAt: now,
        isActive: true,
        status: "PUBLISHED" as const,
        dedupKey: `pool_${idx}`,
      }));
    }

    const nowMs = Date.now();

    // 3. Filter by Active / Non-expired + Search + Mode
    let filtered = combined.filter((item) => {
      // Expiration check: Automatically hide expired opportunities
      if (item.deadline) {
        const dlMs = new Date(item.deadline).getTime();
        if (!isNaN(dlMs) && dlMs < nowMs) {
          return false;
        }
      }

      // Mode filter
      if (mode && mode !== "All" && item.workMode?.toLowerCase() !== mode.toLowerCase()) {
        return false;
      }

      // Category filter
      if (category && category !== "All" && item.category?.toLowerCase() !== category.toLowerCase()) {
        return false;
      }

      // Paid / Free filter
      if (isPaid === "true") {
        const stipendLower = (item.stipend || "").toLowerCase();
        if (!item.stipend || stipendLower.includes("unpaid") || stipendLower === "0") return false;
      }

      // Closing soon (< 7 days)
      if (closingSoon) {
        if (!item.deadline) return false;
        const dlMs = new Date(item.deadline).getTime();
        const diffDays = (dlMs - nowMs) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      // Search keyword filter
      if (search) {
        const title = (item.title || "").toLowerCase();
        const comp = (item.company || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const skills = (item.skills || []).map((s: string) => s.toLowerCase());
        if (!title.includes(search) && !comp.includes(search) && !desc.includes(search) && !skills.some((s: string) => s.includes(search))) {
          return false;
        }
      }

      // Skill filter
      if (skill) {
        const skills = (item.skills || []).map((s: string) => s.toLowerCase());
        if (!skills.some((s: string) => s.includes(skill))) return false;
      }

      return true;
    });

    // Sort newest first
    filtered.sort((a, b) => new Date(b.publishedAt || b.fetchedAt || 0).getTime() - new Date(a.publishedAt || a.fetchedAt || 0).getTime());

    // Pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limitCount;
    const paginated = filtered.slice(startIndex, startIndex + limitCount);

    return NextResponse.json({
      success: true,
      count: total,
      page,
      limit: limitCount,
      totalPages: Math.ceil(total / limitCount),
      internships: paginated,
    });
  } catch (error: any) {
    console.error("GET /api/internships Error:", error);
    return NextResponse.json({ error: "Failed to fetch internships" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(req);
    if (!session || !["ADMIN", "SUPER_ADMIN", "COMPANY", "HR"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    let companyId = body.companyId;

    if (!companyId) {
      const company = await prisma.company.findFirst({
        where: { userId: session.userId },
      });
      if (company) {
        companyId = company.id;
      } else {
        const adminCompany = await prisma.company.findFirst();
        companyId = adminCompany?.id;
      }
    }

    const slug = body.title.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);

    const created = await prisma.internship.create({
      data: {
        companyId: companyId || "default_company",
        title: body.title,
        role: body.role || body.title,
        slug,
        description: body.description,
        responsibilities: JSON.stringify(body.responsibilities || []),
        requirements: JSON.stringify(body.requirements || []),
        skills: JSON.stringify(body.skills || []),
        location: body.location || "Remote",
        mode: body.mode || "Remote",
        duration: body.duration || "6 Weeks",
        stipend: Number(body.stipend) || 0,
        openings: Number(body.openings) || 5,
        deadline: new Date(body.deadline || Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, internship: created }, { status: 201 });
  } catch (error: any) {
    console.error("POST Internship Error:", error);
    return NextResponse.json({ error: "Failed to create internship" }, { status: 500 });
  }
}
