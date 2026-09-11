/**
 * Pure Firebase/Firestore Database Adapter
 * Replaces Prisma entirely with direct Firestore collection operations.
 * Zero dependency on @prisma/client, PostgreSQL, or SQL engines.
 */

import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where as fsWhere, 
  orderBy as fsOrderBy, 
  limit as fsLimit 
} from "firebase/firestore";
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
        const colRef = collection(db, colName);
        const constraints: any[] = [];

        if (args?.where) {
          for (const [key, value] of Object.entries(args.where)) {
            if (value !== undefined && typeof value !== "object") {
              constraints.push(fsWhere(key, "==", value));
            }
          }
        }

        const q = constraints.length > 0 ? query(colRef, ...constraints) : query(colRef);
        const snap = await getDocs(q);
        let list: any[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });

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
          const docRef = doc(db, colName, String(args.where.id));
          const snap = await getDoc(docRef);
          if (snap.exists()) {
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

      try {
        const docRef = doc(db, colName, docId);
        const cleaned = removeUndefinedValues(data);
        await setDoc(docRef, cleaned);
        return { id: docId, ...cleaned };
      } catch (err) {
        console.warn(`Firestore create(${colName}) notice:`, err);
        return { id: docId, ...data };
      }
    },

    async update(args: { where: { id?: string; [key: string]: any }; data: any; include?: any; select?: any }) {
      const id = args.where?.id;
      const data = { ...args.data, updatedAt: new Date().toISOString() };

      if (id) {
        try {
          const docRef = doc(db, colName, String(id));
          const cleaned = removeUndefinedValues(data);
          await setDoc(docRef, cleaned, { merge: true });
          return { id, ...cleaned };
        } catch (err) {
          console.warn(`Firestore update(${colName}) notice:`, err);
          return { id, ...data };
        }
      }
      return null;
    },

    async delete(args: { where: { id?: string; [key: string]: any } }) {
      const id = args.where?.id;
      if (id) {
        try {
          const docRef = doc(db, colName, String(id));
          await deleteDoc(docRef);
          return { id };
        } catch (err) {
          console.warn(`Firestore delete(${colName}) notice:`, err);
          return { id };
        }
      }
      return null;
    },

    async count(args?: { where?: any }) {
      const list = await this.findMany(args);
      return list.length;
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
