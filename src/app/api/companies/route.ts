import { NextResponse } from "next/server";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";
import { CompanyItem } from "@/lib/platform-models";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const jobType = searchParams.get("jobType") || "";

    let companies: CompanyItem[] = [];

    // 1. Check Prisma companies
    try {
      const pCompanies = await prisma.company.findMany({
        include: { internships: true },
        orderBy: { createdAt: "desc" },
      });

      pCompanies.forEach((p: any) => {
        companies.push({
          id: p.id,
          name: p.name,
          logoUrl: p.logoUrl || null,
          description: p.description || "Leading technology organization offering verified career opportunities.",
          website: p.website || null,
          hrName: "Campus Relations",
          hrEmail: p.contactEmail || null,
          hrContact: null,
          requiredSkills: ["Full Stack", "Problem Solving", "System Architecture"],
          eligibility: "Open to engineering students and recent graduates.",
          location: p.location || "Remote / Hybrid (India)",
          jobType: "Internship",
          applicationUrl: p.website || `https://${p.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/careers`,
          deadline: null,
          status: "PUBLISHED",
          createdAt: p.createdAt.toISOString(),
          internshipsCount: p.internships?.length || 0,
        } as any);
      });
    } catch (prismaErr) {
      console.warn("Prisma companies query notice:", prismaErr);
    }

    // 2. Check Firestore companies if empty or sync
    if (companies.length === 0) {
      try {
        const colRef = collection(db, COLLECTIONS.COMPANIES);
        const q = query(colRef, where("status", "==", "PUBLISHED"));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          companies.push({ id: d.id, ...(d.data() as any) });
        });
      } catch (fsErr) {
        console.warn("Firestore companies fallback notice:", fsErr);
      }
    }

    if (jobType && jobType !== "All") {
      companies = companies.filter((c) => c.jobType?.toLowerCase() === jobType.toLowerCase());
    }

    if (search) {
      companies = companies.filter((c) =>
        c.name?.toLowerCase().includes(search) ||
        c.description?.toLowerCase().includes(search) ||
        c.location?.toLowerCase().includes(search) ||
        c.requiredSkills?.some((s) => s.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, count: companies.length, companies });
  } catch (error: any) {
    console.error("Public GET Companies Error:", error);
    return NextResponse.json({ success: true, count: 0, companies: [] });
  }
}

