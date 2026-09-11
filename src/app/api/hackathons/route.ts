import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDocs, collection } from "firebase/firestore";

export const dynamic = "force-dynamic";

function toISOStringSafe(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date().toISOString() : val.toISOString();
  }
  if (typeof val?.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (typeof val?.seconds === "number") {
    return new Date(val.seconds * 1000).toISOString();
  }
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function parseArraySafe(input: any): any[] {
  if (Array.isArray(input)) return input;
  if (!input) return [];
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
      return [input];
    } catch {
      return input.split("\n").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function GET() {
  try {
    const rawDocsMap = new Map<string, any>();

    // 1. Fetch from Firestore Admin SDK
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("hackathons").get();
        snap.forEach((docSnap) => {
          rawDocsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      }
    } catch (adminErr) {
      console.warn("[HACKATHONS_PUBLIC] Admin Firestore get notice:", adminErr);
    }

    // 2. Fetch from Firestore Client SDK
    try {
      const hSnap = await getDocs(collection(db, "hackathons"));
      hSnap.forEach((d) => {
        if (!rawDocsMap.has(d.id)) {
          rawDocsMap.set(d.id, { id: d.id, ...d.data() });
        }
      });
    } catch (clientErr) {
      console.warn("[HACKATHONS_PUBLIC] Client Firestore get notice:", clientErr);
    }

    // 3. Fetch from Prisma Adapter
    try {
      const prismaHackathons = await prisma.hackathon.findMany({
        include: {
          _count: {
            select: { registrations: true, submissions: true },
          },
        },
        orderBy: { startDate: "asc" },
      });
      (prismaHackathons || []).forEach((p: any) => {
        if (!rawDocsMap.has(p.id)) {
          rawDocsMap.set(p.id, p);
        }
      });
    } catch (prismaErr) {
      console.warn("[HACKATHONS_PUBLIC] Prisma findMany notice:", prismaErr);
    }

    const allDocs = Array.from(rawDocsMap.values());

    // Filter published or ongoing
    const publishedDocs = allDocs.filter(
      (h) => h.status === "PUBLISHED" || h.status === "ONGOING" || !h.status
    );

    const formatted = publishedDocs.map((h: any) => {
      const parsedRules = parseArraySafe(h.rules);
      const parsedPrizes = parseArraySafe(h.prizes);
      const parsedRounds = parseArraySafe(h.rounds);
      const parsedJudgingCriteria = typeof h.judgingCriteria === "string" ? h.judgingCriteria : JSON.stringify(h.judgingCriteria || "");
      const parsedFaqs = parseArraySafe(h.faqs);

      return {
        id: h.id,
        title: h.title || "Untitled Hackathon",
        slug: h.slug || h.id,
        tagLine: h.tagLine || h.shortDescription || h.description || "",
        shortDescription: h.shortDescription || h.tagLine || h.description || "",
        description: h.fullDescription || h.description || h.shortDescription || "",
        entryFee: Number(h.entryFee ?? h.registrationFee ?? 0),
        registrationFee: Number(h.registrationFee ?? h.entryFee ?? 0),
        prizePool: Number(h.prizePool ?? 50000),
        prizes: parsedPrizes,
        startDate: toISOStringSafe(h.startDate),
        endDate: toISOStringSafe(h.endDate),
        registrationDeadline: toISOStringSafe(h.registrationDeadline),
        minTeamSize: Number(h.minTeamSize) || 1,
        maxTeamSize: Number(h.maxTeamSize) || 4,
        registrationMode: h.registrationMode || "BOTH",
        submissionMethod: h.submissionMethod || "WEBSITE",
        googleFormUrl: h.googleFormUrl || null,
        rules: parsedRules,
        rounds: parsedRounds,
        judgingCriteria: parsedJudgingCriteria,
        faqs: parsedFaqs,
        bannerUrl: h.bannerUrl || null,
        status: h.status || "PUBLISHED",
        participantsCount: h._count?.registrations || h.participantsCount || 0,
        submissionsCount: h._count?.submissions || h.submissionsCount || 0,
        problemPublished: h.problemPublished ?? true,
        problemStatement: h.problemStatement || null,
        problemReleasedAt: h.problemReleasedAt ? toISOStringSafe(h.problemReleasedAt) : null,
      };
    });

    console.log(`[HACKATHONS_PUBLIC] Returned ${formatted.length} published hackathons.`);

    return NextResponse.json({ hackathons: formatted });
  } catch (error: any) {
    console.error("GET Hackathons Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch hackathons" }, { status: 500 });
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
        startDate: toISOStringSafe(body.startDate),
        endDate: toISOStringSafe(body.endDate),
        registrationDeadline: toISOStringSafe(body.registrationDeadline),
        rules: JSON.stringify(body.rules || []),
        judgingCriteria: JSON.stringify(body.judgingCriteria || []),
        faqs: JSON.stringify(body.faqs || []),
        bannerUrl: body.bannerUrl,
      },
    });

    return NextResponse.json({ success: true, hackathon }, { status: 201 });
  } catch (error: any) {
    console.error("POST Hackathon Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create hackathon" }, { status: 500 });
  }
}


