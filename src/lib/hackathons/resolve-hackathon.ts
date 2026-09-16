import { getAdminDb } from "@/lib/firebase-admin";

/** Resolve the public Firestore document ID without relying on unsupported OR filters. */
export async function resolveHackathon(identifier: string): Promise<any> {
  const value = String(identifier || "").trim();
  if (!value) return null;

  const adminDb = getAdminDb();
  if (!adminDb) return null;

  const byId = await adminDb.collection("hackathons").doc(value).get();
  if (byId.exists) return { id: byId.id, ...byId.data() };

  const bySlug = await adminDb.collection("hackathons").where("slug", "==", value).limit(1).get();
  const slugDoc = bySlug.docs[0];
  return slugDoc ? { id: slugDoc.id, ...slugDoc.data() } : null;
}