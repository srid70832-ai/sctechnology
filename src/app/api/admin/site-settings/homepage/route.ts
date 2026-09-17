import { NextResponse } from "next/server";
import { getAdminDb, verifyFirebaseToken } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authResult = await verifyFirebaseToken(req);
    const adminEmails = ["srics2425@gmail.com", "admin@sctech.com", "superadmin@sctech.com"];
    const isAdmin =
      authResult.success &&
      (authResult.role === "ADMIN" ||
        authResult.role === "SUPER_ADMIN" ||
        adminEmails.includes(authResult.email || ""));

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 503 });
    }

    // 1. Fetch current settings
    const settingsDoc = await adminDb.collection("siteSettings").doc("homepage").get();
    const settings = settingsDoc.exists
      ? settingsDoc.data()
      : {
          featuredHackathonId: null,
          featuredInternshipId1: null,
          featuredInternshipId2: null,
        };

    // 2. Fetch published hackathons
    const hackathonsSnap = await adminDb.collection("hackathons").get();
    const allHackathons: any[] = [];
    hackathonsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status === "PUBLISHED" || data.status === "ONGOING" || !data.status) {
        allHackathons.push({
          id: doc.id,
          title: data.title || "Untitled Hackathon",
          slug: data.slug || doc.id,
          tagLine: data.tagLine || data.shortDescription || "",
          entryFee: data.entryFee ?? data.registrationFee ?? 0,
          prizePool: data.prizePool ?? 0,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          status: data.status || "PUBLISHED",
          participantsCount: data._count?.registrations || data.participantsCount || 0,
        });
      }
    });

    // 3. Fetch published internships
    const internshipsSnap = await adminDb.collection("internships").get();
    const allInternships: any[] = [];
    internshipsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status === "PUBLISHED" || !data.status) {
        allInternships.push({
          id: doc.id,
          title: data.title || "Internship Role",
          role: data.role || data.title || "",
          slug: data.slug || doc.id,
          companyName: data.companyName || "Partner Company",
          companyLogoUrl: data.companyLogoUrl || null,
          location: data.location || "Remote",
          mode: data.mode || "Remote",
          duration: data.duration || "6 Weeks",
          stipend: data.stipend || "Unpaid",
          status: data.status || "PUBLISHED",
        });
      }
    });

    return NextResponse.json({
      success: true,
      settings,
      hackathons: allHackathons,
      internships: allInternships,
    });
  } catch (error: any) {
    console.error("GET /api/admin/site-settings/homepage error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyFirebaseToken(req);
    const adminEmails = ["srics2425@gmail.com", "admin@sctech.com", "superadmin@sctech.com"];
    const isAdmin =
      authResult.success &&
      (authResult.role === "ADMIN" ||
        authResult.role === "SUPER_ADMIN" ||
        adminEmails.includes(authResult.email || ""));

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin DB unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { featuredHackathonId, featuredInternshipId1, featuredInternshipId2 } = body;

    const updatePayload = {
      featuredHackathonId: featuredHackathonId || null,
      featuredInternshipId1: featuredInternshipId1 || null,
      featuredInternshipId2: featuredInternshipId2 || null,
      updatedAt: new Date().toISOString(),
      updatedBy: authResult.email || authResult.uid || "ADMIN",
    };

    await adminDb.collection("siteSettings").doc("homepage").set(updatePayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Homepage featured opportunities updated successfully!",
      settings: updatePayload,
    });
  } catch (error: any) {
    console.error("POST /api/admin/site-settings/homepage error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
