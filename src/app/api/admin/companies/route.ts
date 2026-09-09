import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { CompanyItem, slugify } from "@/lib/platform-models";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const colRef = collection(db, COLLECTIONS.COMPANIES);
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const companies: CompanyItem[] = [];
    snap.forEach((d) => {
      companies.push({ id: d.id, ...(d.data() as any) });
    });

    return NextResponse.json({ success: true, count: companies.length, companies });
  } catch (error: any) {
    console.error("Admin GET Companies Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { authorized, session, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const body = await req.json();
    const {
      id,
      name,
      logoUrl,
      description,
      website,
      hrName,
      hrEmail,
      hrContact,
      requiredSkills,
      eligibility,
      location,
      jobType,
      applicationUrl,
      deadline,
      status,
    } = body;

    if (!name || !description || !applicationUrl) {
      return NextResponse.json(
        { error: "Company name, description, and application URL are required." },
        { status: 400 }
      );
    }

    const companyId = id || `comp-${slugify(name)}-${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, COLLECTIONS.COMPANIES, companyId);

    const existingSnap = await getDoc(docRef);
    const isNew = !existingSnap.exists();

    const payload: Partial<CompanyItem> = {
      id: companyId,
      name: String(name).trim(),
      logoUrl: logoUrl ? String(logoUrl).trim() : null,
      description: String(description).trim(),
      website: website ? String(website).trim() : null,
      hrName: hrName ? String(hrName).trim() : null,
      hrEmail: hrEmail ? String(hrEmail).trim() : null,
      hrContact: hrContact ? String(hrContact).trim() : null,
      requiredSkills: Array.isArray(requiredSkills) 
        ? requiredSkills.map((s: string) => String(s).trim()).filter(Boolean)
        : typeof requiredSkills === "string" 
          ? requiredSkills.split(",").map((s) => s.trim()).filter(Boolean) 
          : [],
      eligibility: eligibility ? String(eligibility).trim() : null,
      location: location ? String(location).trim() : "Remote / India",
      jobType: jobType || "Internship",
      applicationUrl: String(applicationUrl).trim(),
      deadline: deadline ? String(deadline).trim() : null,
      status: status || "PUBLISHED",
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: session?.email || "ADMIN" } : {}),
    };

    const cleaned = removeUndefinedValues(payload);
    await setDoc(docRef, cleaned, { merge: true });

    return NextResponse.json({
      success: true,
      message: isNew ? "Company created successfully." : "Company updated successfully.",
      companyId,
    });
  } catch (error: any) {
    console.error("Admin POST Company Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save company" }, { status: 500 });
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
      return NextResponse.json({ error: "Company ID is required for deletion." }, { status: 400 });
    }

    await deleteDoc(doc(db, COLLECTIONS.COMPANIES, id));
    return NextResponse.json({ success: true, message: "Company deleted successfully." });
  } catch (error: any) {
    console.error("Admin DELETE Company Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete company" }, { status: 500 });
  }
}
