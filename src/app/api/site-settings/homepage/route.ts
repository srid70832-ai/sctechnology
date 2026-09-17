import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function toISOStringSafe(val: any): string | null {
  if (!val) return null;
  if (typeof val === "string") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString();
  }
  if (typeof val?.toDate === "function") {
    return val.toDate().toISOString();
  }
  if (typeof val?.seconds === "number") {
    return new Date(val.seconds * 1000).toISOString();
  }
  return null;
}

export async function GET() {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 503 });
    }

    // 1. Read settings
    const settingsDoc = await adminDb.collection("siteSettings").doc("homepage").get();
    const settings = settingsDoc.exists
      ? settingsDoc.data()
      : {
          featuredHackathonId: null,
          featuredInternshipId1: null,
          featuredInternshipId2: null,
        };

    let featuredHackathon: any = null;
    let featuredInternship1: any = null;
    let featuredInternship2: any = null;

    // 2. Resolve Featured Hackathon
    if (settings?.featuredHackathonId) {
      const hDoc = await adminDb.collection("hackathons").doc(settings.featuredHackathonId).get();
      if (hDoc.exists) {
        const data = hDoc.data()!;
        if (data.status === "PUBLISHED" || data.status === "ONGOING" || !data.status) {
          // Count participants from hackathonRegistrations if possible
          let realParticipants = data.participantsCount ?? data._count?.registrations ?? 0;
          try {
            const regsSnap = await adminDb
              .collection("hackathonRegistrations")
              .where("hackathonId", "==", hDoc.id)
              .get();
            if (!regsSnap.empty) {
              realParticipants = regsSnap.size;
            }
          } catch {
            // fallback to doc count
          }

          featuredHackathon = {
            id: hDoc.id,
            title: data.title || "SC TECH Hackathon",
            slug: data.slug || hDoc.id,
            tagLine: data.tagLine || data.shortDescription || "Code. Innovate. Elevate.",
            entryFee: Number(data.entryFee ?? data.registrationFee ?? 0),
            prizePool: Number(data.prizePool ?? 0),
            startDate: toISOStringSafe(data.startDate),
            endDate: toISOStringSafe(data.endDate),
            mode: data.mode || "Online",
            status: data.status || "PUBLISHED",
            participantsCount: Number(realParticipants) || 0,
            bannerUrl: data.bannerUrl || null,
            logoUrl: data.logoUrl || null,
          };
        }
      }
    }

    // Fallback: If no featured hackathon configured or record unpublished, get latest published
    if (!featuredHackathon) {
      const pubHackathonsSnap = await adminDb
        .collection("hackathons")
        .where("status", "in", ["PUBLISHED", "ONGOING"])
        .limit(1)
        .get();

      if (!pubHackathonsSnap.empty) {
        const hDoc = pubHackathonsSnap.docs[0];
        const data = hDoc.data();
        let realParticipants = data.participantsCount ?? data._count?.registrations ?? 0;
        try {
          const regsSnap = await adminDb
            .collection("hackathonRegistrations")
            .where("hackathonId", "==", hDoc.id)
            .get();
          if (!regsSnap.empty) {
            realParticipants = regsSnap.size;
          }
        } catch {
          // fallback
        }

        featuredHackathon = {
          id: hDoc.id,
          title: data.title || "SC TECH Hackathon",
          slug: data.slug || hDoc.id,
          tagLine: data.tagLine || data.shortDescription || "Code. Innovate. Elevate.",
          entryFee: Number(data.entryFee ?? data.registrationFee ?? 0),
          prizePool: Number(data.prizePool ?? 0),
          startDate: toISOStringSafe(data.startDate),
          endDate: toISOStringSafe(data.endDate),
          mode: data.mode || "Online",
          status: data.status || "PUBLISHED",
          participantsCount: Number(realParticipants) || 0,
          bannerUrl: data.bannerUrl || null,
          logoUrl: data.logoUrl || null,
        };
      }
    }

    // 3. Resolve Featured Internship #1
    if (settings?.featuredInternshipId1) {
      const intDoc = await adminDb.collection("internships").doc(settings.featuredInternshipId1).get();
      if (intDoc.exists) {
        const data = intDoc.data()!;
        if (data.status === "PUBLISHED" || !data.status) {
          featuredInternship1 = {
            id: intDoc.id,
            title: data.title || "Internship Role",
            role: data.role || data.title || "",
            slug: data.slug || intDoc.id,
            companyName: data.companyName || "SC TECH",
            companyLogoUrl: data.companyLogoUrl || null,
            description: data.description || "",
            location: data.location || "Remote",
            mode: data.mode || "Remote",
            duration: data.duration || "6 Weeks",
            stipend: data.stipend || "Stipend Provided",
            skills: Array.isArray(data.skills) ? data.skills : [],
            deadline: toISOStringSafe(data.applicationDeadline || data.deadline),
            applicationUrl: data.sourceUrl || `/internships/${intDoc.id}`,
            status: data.status || "PUBLISHED",
            isNew: true,
          };
        }
      }
    }

    // 4. Resolve Featured Internship #2
    if (settings?.featuredInternshipId2) {
      const intDoc = await adminDb.collection("internships").doc(settings.featuredInternshipId2).get();
      if (intDoc.exists) {
        const data = intDoc.data()!;
        if (data.status === "PUBLISHED" || !data.status) {
          featuredInternship2 = {
            id: intDoc.id,
            title: data.title || "Internship Role",
            role: data.role || data.title || "",
            slug: data.slug || intDoc.id,
            companyName: data.companyName || "SC TECH",
            companyLogoUrl: data.companyLogoUrl || null,
            description: data.description || "",
            location: data.location || "Remote",
            mode: data.mode || "Remote",
            duration: data.duration || "6 Weeks",
            stipend: data.stipend || "Stipend Provided",
            skills: Array.isArray(data.skills) ? data.skills : [],
            deadline: toISOStringSafe(data.applicationDeadline || data.deadline),
            applicationUrl: data.sourceUrl || `/internships/${intDoc.id}`,
            status: data.status || "PUBLISHED",
            isNew: true,
          };
        }
      }
    }

    // Fallback if internships not selected or unpublished: fetch top published
    if (!featuredInternship1 || !featuredInternship2) {
      const fallbackSnap = await adminDb
        .collection("internships")
        .where("status", "==", "PUBLISHED")
        .limit(4)
        .get();

      const pool: any[] = [];
      fallbackSnap.forEach((doc) => {
        const data = doc.data();
        pool.push({
          id: doc.id,
          title: data.title || "Internship Role",
          role: data.role || data.title || "",
          slug: data.slug || doc.id,
          companyName: data.companyName || "SC TECH",
          companyLogoUrl: data.companyLogoUrl || null,
          description: data.description || "",
          location: data.location || "Remote",
          mode: data.mode || "Remote",
          duration: data.duration || "6 Weeks",
          stipend: data.stipend || "Stipend Provided",
          skills: Array.isArray(data.skills) ? data.skills : [],
          deadline: toISOStringSafe(data.applicationDeadline || data.deadline),
          applicationUrl: data.sourceUrl || `/internships/${doc.id}`,
          status: data.status || "PUBLISHED",
          isNew: true,
        });
      });

      if (!featuredInternship1 && pool.length > 0) {
        featuredInternship1 = pool[0];
      }
      if (!featuredInternship2 && pool.length > 1) {
        featuredInternship2 = pool[1];
      } else if (!featuredInternship2 && pool.length > 0 && pool[0].id !== featuredInternship1?.id) {
        featuredInternship2 = pool[0];
      }
    }

    return NextResponse.json(
      {
        success: true,
        featuredHackathon,
        featuredInternship1,
        featuredInternship2,
        settings: {
          featuredHackathonId: settings?.featuredHackathonId || featuredHackathon?.id || null,
          featuredInternshipId1: settings?.featuredInternshipId1 || featuredInternship1?.id || null,
          featuredInternshipId2: settings?.featuredInternshipId2 || featuredInternship2?.id || null,
          updatedAt: settings?.updatedAt || null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/site-settings/homepage error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
