import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { HackathonItem, slugify } from "@/lib/platform-models";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

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

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const prismaHackathons = await prisma.hackathon.findMany({
      include: {
        _count: { select: { registrations: true, submissions: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    const hackathons: HackathonItem[] = (prismaHackathons || []).map((p: any) => {
      const parsedRules = parseArraySafe(p.rules);
      const parsedPrizes = parseArraySafe(p.prizes);
      const parsedRounds = parseArraySafe(p.rounds);
      const parsedProblemStatementIds = parseArraySafe(p.problemStatementIds);

      return {
        id: p.id,
        title: p.title || "Untitled Hackathon",
        slug: p.slug || p.id,
        bannerUrl: p.bannerUrl || null,
        shortDescription: p.shortDescription || p.tagLine || p.description || "",
        fullDescription: p.fullDescription || p.description || p.shortDescription || "",
        startDate: toISOStringSafe(p.startDate),
        endDate: toISOStringSafe(p.endDate),
        registrationDeadline: toISOStringSafe(p.registrationDeadline),
        registrationFee: Number(p.registrationFee ?? p.entryFee ?? 0),
        entryFee: Number(p.registrationFee ?? p.entryFee ?? 0),
        prizePool: Number(p.prizePool ?? 50000),
        prizes: parsedPrizes,
        rules: parsedRules,
        guidelines: p.guidelines || null,
        judgingCriteria: p.judgingCriteria || null,
        contactDetails: p.contactDetails || null,
        submissionMethod: (p.submissionMethod as any) || "WEBSITE",
        googleFormUrl: p.googleFormUrl || null,
        problemStatementIds: parsedProblemStatementIds,
        rounds: parsedRounds,
        minTeamSize: Number(p.minTeamSize) || 1,
        maxTeamSize: Number(p.maxTeamSize) || 4,
        maxParticipants: Number(p.maxParticipants) || 500,
        registrationMode: (p.registrationMode as any) || "BOTH",
        status: (p.status as any) || "PUBLISHED",
        createdAt: toISOStringSafe(p.createdAt),
        participantsCount: p._count?.registrations || p.participantsCount || 0,
        submissionsCount: p._count?.submissions || p.submissionsCount || 0,
      };
    });

    return NextResponse.json({ 
      success: true, 
      count: hackathons.length, 
      hackathons,
      prismaHackathons 
    });
  } catch (error: any) {
    console.error("Admin GET Hackathons Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch hackathons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const {
      id,
      title,
      slug,
      bannerUrl,
      shortDescription,
      fullDescription,
      startDate,
      startTime,
      endDate,
      endTime,
      registrationDeadline,
      registrationFee,
      maxParticipants,
      prizePool,
      prizes,
      rules,
      guidelines,
      judgingCriteria,
      contactDetails,
      submissionMethod,
      googleFormUrl,
      problemStatementIds,
      registrationMode,
      minTeamSize,
      maxTeamSize,
      rounds,
      status,
    } = body;

    if (!title || !shortDescription || !startDate || !endDate || !registrationDeadline) {
      return NextResponse.json(
        { error: "Title, description, start date, end date, and registration deadline are required." },
        { status: 400 }
      );
    }

    const hackathonSlug = slug || slugify(title);
    const hackathonId = id || `hack-${hackathonSlug}-${Date.now().toString().slice(-4)}`;

    const toArray = (input: any): string[] => {
      if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
      if (typeof input === "string") return input.split("\n").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const fee = Number(registrationFee) >= 0 ? Number(registrationFee) : 35;
    const pool = Number(prizePool) >= 0 ? Number(prizePool) : 50000;
    const minTeam = Number(minTeamSize) > 0 ? Number(minTeamSize) : 1;
    const maxTeam = Number(maxTeamSize) >= minTeam ? Number(maxTeamSize) : 4;
    const mode = registrationMode === "INDIVIDUAL_ONLY" || registrationMode === "TEAM_ONLY" ? registrationMode : "BOTH";
    const subMethod = submissionMethod === "GOOGLE_FORM" ? "GOOGLE_FORM" : "WEBSITE";

    const parsedRules = toArray(rules);
    const parsedPrizes = toArray(prizes);
    const parsedProblemIds = toArray(problemStatementIds);
    const parsedRounds = Array.isArray(rounds) ? rounds : [];

    // 1. Primary: Save to Prisma SQLite
    const savedHackathon = await prisma.hackathon.upsert({
      where: { id: hackathonId },
      update: {
        title: String(title).trim(),
        slug: hackathonSlug,
        tagLine: String(shortDescription).trim(),
        description: String(shortDescription).trim(),
        fullDescription: fullDescription ? String(fullDescription).trim() : String(shortDescription).trim(),
        entryFee: fee,
        prizePool: pool,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        minTeamSize: minTeam,
        maxTeamSize: maxTeam,
        registrationMode: mode,
        submissionMethod: subMethod,
        googleFormUrl: googleFormUrl ? String(googleFormUrl).trim() : null,
        prizes: JSON.stringify(parsedPrizes),
        rules: JSON.stringify(parsedRules),
        guidelines: guidelines ? String(guidelines).trim() : null,
        judgingCriteria: judgingCriteria ? String(judgingCriteria).trim() : null,
        contactDetails: contactDetails ? String(contactDetails).trim() : null,
        problemStatementIds: JSON.stringify(parsedProblemIds),
        rounds: JSON.stringify(parsedRounds),
        bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
        status: status || "PUBLISHED",
      },
      create: {
        id: hackathonId,
        title: String(title).trim(),
        slug: hackathonSlug,
        tagLine: String(shortDescription).trim(),
        description: String(shortDescription).trim(),
        fullDescription: fullDescription ? String(fullDescription).trim() : String(shortDescription).trim(),
        entryFee: fee,
        prizePool: pool,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        minTeamSize: minTeam,
        maxTeamSize: maxTeam,
        registrationMode: mode,
        submissionMethod: subMethod,
        googleFormUrl: googleFormUrl ? String(googleFormUrl).trim() : null,
        prizes: JSON.stringify(parsedPrizes),
        rules: JSON.stringify(parsedRules),
        guidelines: guidelines ? String(guidelines).trim() : null,
        judgingCriteria: judgingCriteria ? String(judgingCriteria).trim() : null,
        contactDetails: contactDetails ? String(contactDetails).trim() : null,
        problemStatementIds: JSON.stringify(parsedProblemIds),
        rounds: JSON.stringify(parsedRounds),
        bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
        status: status || "PUBLISHED",
      },
    });

    // 2. Secondary: Sync to Firestore if available (wrapped in non-blocking try-catch)
    try {
      const docRef = doc(db, COLLECTIONS.HACKATHONS, hackathonId);
      const fsPayload = removeUndefinedValues({
        id: hackathonId,
        title: String(title).trim(),
        slug: hackathonSlug,
        bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
        shortDescription: String(shortDescription).trim(),
        fullDescription: fullDescription ? String(fullDescription).trim() : String(shortDescription).trim(),
        startDate: String(startDate).trim(),
        startTime: startTime ? String(startTime).trim() : "09:00 AM",
        endDate: String(endDate).trim(),
        endTime: endTime ? String(endTime).trim() : "11:59 PM",
        registrationDeadline: String(registrationDeadline).trim(),
        registrationFee: fee,
        prizePool: pool,
        minTeamSize: minTeam,
        maxTeamSize: maxTeam,
        registrationMode: mode,
        submissionMethod: subMethod,
        googleFormUrl: googleFormUrl ? String(googleFormUrl).trim() : null,
        prizes: parsedPrizes,
        rules: parsedRules,
        guidelines: guidelines ? String(guidelines).trim() : null,
        judgingCriteria: judgingCriteria ? String(judgingCriteria).trim() : null,
        contactDetails: contactDetails ? String(contactDetails).trim() : null,
        problemStatementIds: parsedProblemIds,
        rounds: parsedRounds,
        status: status || "PUBLISHED",
        updatedAt: serverTimestamp(),
      });
      await setDoc(docRef, fsPayload, { merge: true });
    } catch (fsErr) {
      console.warn("Optional Firestore hackathon sync notice:", fsErr);
    }

    return NextResponse.json({
      success: true,
      message: "Hackathon saved successfully.",
      hackathonId: savedHackathon.id,
      hackathon: savedHackathon,
    });
  } catch (error: any) {
    console.error("Admin POST Hackathon Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save hackathon" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Hackathon ID is required for deletion." }, { status: 400 });
    }

    // 1. Delete from Prisma
    await prisma.hackathon.deleteMany({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    // 2. Delete from Firestore if available
    try {
      await deleteDoc(doc(db, COLLECTIONS.HACKATHONS, id));
    } catch {}

    return NextResponse.json({ success: true, message: "Hackathon deleted successfully." });
  } catch (error: any) {
    console.error("Admin DELETE Hackathon Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete hackathon" }, { status: 500 });
  }
}

