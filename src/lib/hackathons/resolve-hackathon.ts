import { getAdminDb } from "@/lib/firebase-admin";

/** Resolve the public Firestore document ID without relying on unsupported OR filters. */
export async function resolveHackathon(identifier: string): Promise<any> {
  const value = String(identifier || "").trim();
  if (!value) return null;

  const adminDb = getAdminDb();
  if (!adminDb) return null;

  let docData: any = null;
  let docId = "";

  const byId = await adminDb.collection("hackathons").doc(value).get();
  if (byId.exists) {
    docId = byId.id;
    docData = byId.data();
  } else {
    const bySlug = await adminDb.collection("hackathons").where("slug", "==", value).limit(1).get();
    const slugDoc = bySlug.docs[0];
    if (slugDoc) {
      docId = slugDoc.id;
      docData = slugDoc.data();
    }
  }

  if (!docData) return null;

  const fee = Number(docData.registrationFee ?? docData.entryFee ?? 0);

  return {
    id: docId,
    ...docData,
    registrationFee: fee,
    entryFee: fee,
  };
}