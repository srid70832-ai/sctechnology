import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { HackathonItem, slugify } from "@/lib/platform-models";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";

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

    const rawDocsMap = new Map<string, any>();

    // 1. Fetch from Firestore Admin SDK if available
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("hackathons").get();
        snap.forEach((docSnap) => {
          rawDocsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      }
    } catch (adminErr) {
      console.warn("[ADMIN_HACKATHONS] Admin Firestore get notice:", adminErr);
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
      console.warn("[ADMIN_HACKATHONS] Client Firestore get notice:", clientErr);
    }

    // 3. Fetch from Prisma Adapter
    try {
      const prismaHackathons = await prisma.hackathon.findMany({
        include: {
          _count: { select: { registrations: true, submissions: true } }
        },
        orderBy: { createdAt: "desc" },
      });
      (prismaHackathons || []).forEach((p: any) => {
        if (!rawDocsMap.has(p.id)) {
          rawDocsMap.set(p.id, p);
        }
      });
    } catch (prismaErr) {
      console.warn("[ADMIN_HACKATHONS] Prisma findMany notice:", prismaErr);
    }

    const allDocs = Array.from(rawDocsMap.values());

    const hackathons: HackathonItem[] = allDocs.map((p: any) => {
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
        startTime: p.startTime || "09:00 AM",
        endDate: toISOStringSafe(p.endDate),
        endTime: p.endTime || "11:59 PM",
        registrationDeadline: toISOStringSafe(p.registrationDeadline),
        registrationFee: Number(p.registrationFee ?? p.entryFee ?? 0),
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

    console.log(`[ADMIN_HACKATHONS] Query complete. Total hackathons returned: ${hackathons.length}`);

    return NextResponse.json({ 
      success: true, 
      count: hackathons.length, 
      hackathons 
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

    const canonicalData = removeUndefinedValues({
      id: hackathonId,
      title: String(title).trim(),
      slug: hackathonSlug,
      bannerUrl: bannerUrl ? String(bannerUrl).trim() : null,
      shortDescription: String(shortDescription).trim(),
      fullDescription: fullDescription ? String(fullDescription).trim() : String(shortDescription).trim(),
      startDate: toISOStringSafe(startDate),
      startTime: startTime ? String(startTime).trim() : "09:00 AM",
      endDate: toISOStringSafe(endDate),
      endTime: endTime ? String(endTime).trim() : "11:59 PM",
      registrationDeadline: toISOStringSafe(registrationDeadline),
      registrationFee: fee,
      entryFee: fee,
      prizePool: pool,
      minTeamSize: minTeam,
      maxTeamSize: maxTeam,
      maxParticipants: Number(maxParticipants) || 500,
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
      updatedAt: new Date().toISOString(),
      createdAt: body.createdAt ? toISOStringSafe(body.createdAt) : new Date().toISOString(),
      participantsCount: Number(body.participantsCount) || 0,
      submissionsCount: Number(body.submissionsCount) || 0,
    });

    let writeSucceeded = false;

    // 1. Write to Firestore Admin SDK if available
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        await adminDb.collection("hackathons").doc(hackathonId).set(canonicalData, { merge: true });
        writeSucceeded = true;
      }
    } catch (adminErr) {
      console.warn("[ADMIN_HACKATHONS] Admin Firestore write notice:", adminErr);
    }

    // 2. Write to Firestore Client SDK
    try {
      const docRef = doc(db, "hackathons", hackathonId);
      await setDoc(docRef, canonicalData, { merge: true });
      writeSucceeded = true;
    } catch (clientErr) {
      console.warn("[ADMIN_HACKATHONS] Client Firestore write notice:", clientErr);
    }

    // 3. Write to Prisma Adapter
    try {
      await prisma.hackathon.upsert({
        where: { id: hackathonId },
        update: canonicalData,
        create: canonicalData,
      });
      writeSucceeded = true;
    } catch (prismaErr) {
      console.warn("[ADMIN_HACKATHONS] Prisma upsert notice:", prismaErr);
    }

    // 4. Mandatory Read-Back Verification
    let verifiedDoc: any = null;

    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb.collection("hackathons").doc(hackathonId).get();
        if (snap.exists) {
          verifiedDoc = { id: snap.id, ...snap.data() };
        }
      }
    } catch {}

    if (!verifiedDoc) {
      try {
        const snap = await getDoc(doc(db, "hackathons", hackathonId));
        if (snap.exists()) {
          verifiedDoc = { id: snap.id, ...snap.data() };
        }
      } catch {}
    }

    if (!verifiedDoc) {
      try {
        verifiedDoc = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
      } catch {}
    }

    if (!verifiedDoc && !writeSucceeded) {
      console.error("[ADMIN_HACKATHONS] Read-back verification failed for document ID:", hackathonId);
      return NextResponse.json({ error: "Failed to persist hackathon document to Firestore." }, { status: 500 });
    }

    const finalResult = verifiedDoc || canonicalData;

    console.log(`[ADMIN_HACKATHONS] Write & Read-back succeeded for hackathon ID: ${hackathonId}, Title: ${finalResult.title}, Status: ${finalResult.status}`);

    return NextResponse.json({
      success: true,
      message: "Hackathon saved successfully.",
      hackathonId: finalResult.id || hackathonId,
      hackathon: finalResult,
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

    // 1. Delete from Firestore Admin
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        await adminDb.collection("hackathons").doc(id).delete();
      }
    } catch {}

    // 2. Delete from Firestore Client
    try {
      await deleteDoc(doc(db, "hackathons", id));
    } catch {}

    // 3. Delete from Prisma Adapter
    try {
      await prisma.hackathon.deleteMany({
        where: {
          OR: [{ id }, { slug: id }],
        },
      });
    } catch {}

    return NextResponse.json({ success: true, message: "Hackathon deleted successfully." });
  } catch (error: any) {
    console.error("Admin DELETE Hackathon Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete hackathon" }, { status: 500 });
  }
}


