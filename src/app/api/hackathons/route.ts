import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

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
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK is not configured." }, { status: 503 });
    }

    const snap = await adminDb.collection("hackathons").get();
    const allDocs: any[] = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    // Filter published or ongoing
    const publishedDocs = allDocs.filter(
      (h) => h.status === "PUBLISHED" || h.status === "ONGOING"
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

    return NextResponse.json({ success: true, count: formatted.length, hackathons: formatted });
  } catch (error: any) {
    console.error("GET Hackathons Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch hackathons" }, { status: 500 });
  }
}


