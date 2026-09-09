const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "scmain-b2cde";

function toFirestoreValue(val: any): any {
  if (val === undefined || val === null) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: val.toString() };
    }
    return { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function toFirestoreFields(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields[key] = toFirestoreValue(val);
    }
  }
  return fields;
}

/**
 * Creates a document in Firestore via Google Cloud REST API using the authenticated user's ID token.
 */
export async function createFirestoreDocumentWithToken(
  token: string,
  collectionName: string,
  data: Record<string, any>,
  customDocId?: string
): Promise<string | null> {
  try {
    let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`;
    if (customDocId) {
      url += `?documentId=${encodeURIComponent(customDocId)}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fields: toFirestoreFields(data),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`Firestore REST create [${collectionName}] failed:`, err);
      return null;
    }

    const resJson = await res.json();
    const docPath = resJson.name || "";
    const parts = docPath.split("/");
    return parts[parts.length - 1] || null;
  } catch (err) {
    console.warn(`Firestore REST create exception [${collectionName}]:`, err);
    return null;
  }
}

/**
 * Patches / updates a document in Firestore via Google Cloud REST API using the authenticated user's ID token.
 */
export async function updateFirestoreDocumentWithToken(
  token: string,
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const updateMask = Object.keys(data)
      .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
      .join("&");
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}?${updateMask}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fields: toFirestoreFields(data),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`Firestore REST update [${collectionName}/${docId}] failed:`, err);
      return false;
    }

    return true;
  } catch (err) {
    console.warn(`Firestore REST update exception [${collectionName}/${docId}]:`, err);
    return false;
  }
}
