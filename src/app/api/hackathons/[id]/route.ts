import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { findUserTeam } from "@/lib/team-storage";
import { HackathonTeam, computeTeamPaymentStatus } from "@/lib/hackathon-team-models";

export const dynamic = "force-dynamic";

function toISOStringSafe(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000).toISOString();
  return null;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK is not configured." }, { status: 503 });
    }
    const firestoreSnapshot = await adminDb.collection("hackathons").doc(params.id).get();
    if (!firestoreSnapshot.exists) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const firestoreHackathon: any = firestoreSnapshot.data() || {};
    const effectiveId = firestoreSnapshot.id;
    const entryFee = firestoreHackathon.registrationFee ?? firestoreHackathon.entryFee ?? 0;

    let isRegistered = false;
    let userRegistration = null;
    let userSubmission = null;
    let userTeam: HackathonTeam | null = null;
    let isLeader = false;
    let userMemberPaymentStatus = "NOT_REQUIRED";

    if (session) {
      // 1. Check Prisma registration
      const reg = await prisma.hackathonRegistration.findFirst({
          where: {
            hackathonId: effectiveId,
            userId: session.userId,
          },
          include: {
            submission: true,
            payment: true,
          },
        });

      if (reg) {
        isRegistered = true;
        userRegistration = {
          id: reg.id,
          registrationNo: reg.registrationNo,
          status: reg.status,
          createdAt: reg.createdAt,
          payment: reg.payment,
        };
        userSubmission = reg.submission;
      }

      // 2. Check team membership
      try {
        const t = await findUserTeam(effectiveId, session.userId);
        if (t) {
          const stats = computeTeamPaymentStatus(t, entryFee);
          userTeam = {
            ...t,
            paymentStatus: stats.paymentStatus,
            paidMemberCount: stats.paidMemberCount,
            totalPaidAmount: stats.totalPaidAmount,
          };
          isLeader = t.leaderId === session.userId;
          isRegistered = true;
          
          const currentMember = t.members.find((m) => m.userId === session.userId);
          if (currentMember) {
            userMemberPaymentStatus = currentMember.paymentStatus || (entryFee > 0 ? "PENDING" : "NOT_REQUIRED");
          }

          if (t.submission) {
            userSubmission = t.submission;
          }
        }
      } catch (err) {
        console.warn("Team check notice:", err);
      }
    }

    const parseArraySafe = (input: any): any[] => {
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
    };

    const rules = parseArraySafe(firestoreHackathon.rules);
    const judgingCriteria = Array.isArray(firestoreHackathon?.judgingCriteria)
      ? firestoreHackathon.judgingCriteria
      : (firestoreHackathon.judgingCriteria || "");
    const faqs = parseArraySafe(firestoreHackathon.faqs);

    return NextResponse.json({
      hackathon: {
        id: effectiveId,
        title: firestoreHackathon.title,
        slug: firestoreHackathon.slug || effectiveId,
        tagLine: firestoreHackathon.tagLine || firestoreHackathon.shortDescription,
        description: firestoreHackathon.fullDescription || firestoreHackathon.shortDescription,
        bannerUrl: firestoreHackathon.bannerUrl || null,
        entryFee,
        prizePool: firestoreHackathon.prizePool ?? 50000,
        startDate: toISOStringSafe(firestoreHackathon.startDate),
        endDate: toISOStringSafe(firestoreHackathon.endDate),
        registrationDeadline: toISOStringSafe(firestoreHackathon.registrationDeadline),
        registrationMode: firestoreHackathon.registrationMode || "BOTH",
        minTeamSize: firestoreHackathon.minTeamSize || 2,
        maxTeamSize: firestoreHackathon.maxTeamSize || 4,
        submissionMethod: firestoreHackathon.submissionMethod || "WEBSITE",
        googleFormUrl: firestoreHackathon.googleFormUrl || null,
        rules,
        judgingCriteria,
        faqs,
        problemStatement: firestoreHackathon.problemStatement || null,
        participantsCount: firestoreHackathon.participantsCount || 0,
        submissionsCount: firestoreHackathon.submissionsCount || 0,
        isRegistered,
        userRegistration,
        userSubmission,
        userTeam,
        isLeader,
        userMemberPaymentStatus,
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("GET Hackathon ID Error:", error);
    return NextResponse.json({ error: "Failed to fetch hackathon" }, { status: 500 });
  }
}
