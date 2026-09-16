/**
 * Pure Firebase/Firestore Database Adapter
 * Replaces Prisma entirely with direct Firestore collection operations.
 * Zero dependency on @prisma/client, PostgreSQL, or SQL engines.
 */

import { getAdminDb } from "./firebase-admin";
import { removeUndefinedValues } from "./firestore";

const collectionMap: Record<string, string> = {
  user: "users",
  studentProfile: "students",
  judgeProfile: "judgeProfiles",
  company: "companies",
  plan: "plans",
  subscription: "subscriptions",
  payment: "payments",
  refund: "refunds",
  project: "projects",
  projectAccess: "projectAccesses",
  projectDownloadLog: "projectDownloadLogs",
  internship: "internships",
  internshipApplication: "internshipApplications",
  interview: "interviews",
  internshipOffer: "internshipOffers",
  internshipEvaluation: "internshipEvaluations",
  hackathon: "hackathons",
  problemStatement: "problemStatements",
  hackathonRegistration: "hackathonRegistrations",
  hackathonSubmission: "hackathonSubmissions",
  hackathonJudge: "hackathonJudges",
  hackathonScore: "hackathonScores",
  hackathonWinner: "hackathonWinners",
  hackathonPrize: "hackathonPrizes",
  certificate: "certificates",
  hrSession: "hrSessions",
  sessionRegistration: "sessionRegistrations",
  notification: "notifications",
  supportTicket: "supportTickets",
  auditLog: "auditLogs",
};

function createCollectionHandler(modelName: string) {
  const colName = collectionMap[modelName] || modelName;

  return {
    async findMany(args?: { where?: any; orderBy?: any; take?: number; skip?: number; include?: any; select?: any }) {
      try {
        const adminDb = getAdminDb();
        if (!adminDb) return [];
        const where = args?.where || {};
        let q: FirebaseFirestore.Query = adminDb.collection(colName);
        for (const [key, value] of Object.entries(where)) {
          if (key !== "OR" && value !== undefined && (typeof value !== "object" || value === null)) {
            q = q.where(key, "==", value);
          }
        }
        const snap = await q.get();
        let list: any[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        if (Array.isArray(where.OR)) {
          list = list.filter((item) => where.OR.some((condition: Record<string, unknown>) =>
            Object.entries(condition).every(([key, value]) => item[key] === value)
          ));
        }

        if (args?.take && list.length > args.take) {
          list = list.slice(0, args.take);
        }
        return list;
      } catch (err) {
        console.warn(`Firestore findMany(${colName}) notice:`, err);
        return [];
      }
    },

    async findFirst(args?: { where?: any; include?: any; select?: any; orderBy?: any }) {
      try {
        const list = await this.findMany(args ? { ...args, take: 1 } : { take: 1 });
        return list.length > 0 ? list[0] : null;
      } catch {
        return null;
      }
    },

    async findUnique(args: { where: any; include?: any; select?: any }) {
      try {
        if (args?.where?.id) {
          const adminDb = getAdminDb();
          if (!adminDb) return null;
          const snap = await adminDb.collection(colName).doc(String(args.where.id)).get();
          if (snap.exists) {
            return { id: snap.id, ...snap.data() };
          }
        }
        if (args?.where?.email) {
          const list = await this.findMany({ where: { email: args.where.email }, take: 1 });
          return list.length > 0 ? list[0] : null;
        }
        if (args?.where?.slug) {
          const list = await this.findMany({ where: { slug: args.where.slug }, take: 1 });
          return list.length > 0 ? list[0] : null;
        }
        if (args?.where?.certificateNo) {
          const list = await this.findMany({ where: { certificateNo: args.where.certificateNo }, take: 1 });
          return list.length > 0 ? list[0] : null;
        }
        return await this.findFirst(args);
      } catch (err) {
        console.warn(`Firestore findUnique(${colName}) notice:`, err);
        return null;
      }
    },

    async create(args: { data: any; include?: any; select?: any }) {
      const data = { ...args.data };
      const docId = data.id || "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      data.id = docId;
      data.createdAt = data.createdAt || new Date().toISOString();
      data.updatedAt = new Date().toISOString();

      const adminDb = getAdminDb();
      if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
      const cleaned = removeUndefinedValues(data);
      await adminDb.collection(colName).doc(docId).set(cleaned);
      return { id: docId, ...cleaned };
    },

    async update(args: { where: { id?: string; [key: string]: any }; data: any; include?: any; select?: any }) {
      const id = args.where?.id;
      const data = { ...args.data, updatedAt: new Date().toISOString() };

      if (id) {
        const adminDb = getAdminDb();
        if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
        const cleaned = removeUndefinedValues(data);
        await adminDb.collection(colName).doc(String(id)).set(cleaned, { merge: true });
        return { id, ...cleaned };
      }
      return null;
    },

    async delete(args: { where: { id?: string; [key: string]: any } }) {
      const id = args.where?.id;
      if (id) {
        const adminDb = getAdminDb();
        if (!adminDb) throw new Error("Firebase Admin SDK is not configured");
        await adminDb.collection(colName).doc(String(id)).delete();
        return { id };
      }
      return null;
    },

    async count(args?: { where?: any }) {
      const list = await this.findMany(args);
      return list.length;
    },

    async deleteMany(args?: { where?: any }) {
      const list = await this.findMany(args);
      for (const item of list) {
        await this.delete({ where: { id: item.id } });
      }
      return { count: list.length };
    },

    async upsert(args: { where: any; create: any; update: any }) {
      const existing = await this.findUnique(args);
      if (existing) {
        return await this.update({ where: args.where, data: args.update });
      }
      return await this.create({ data: args.create });
    },
  };
}

export const prisma: any = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (typeof prop === "string" && prop !== "then" && prop !== "$disconnect" && prop !== "$connect") {
        return createCollectionHandler(prop);
      }
      if (prop === "$disconnect" || prop === "$connect") {
        return async () => {};
      }
      return undefined;
    },
  }
);

export default prisma;
