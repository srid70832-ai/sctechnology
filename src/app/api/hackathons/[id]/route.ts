import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { findUserTeam } from "@/lib/team-storage";
import { HackathonTeam, computeTeamPaymentStatus } from "@/lib/hackathon-team-models";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();

    let hackathon = await prisma.hackathon.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        _count: {
          select: { registrations: true, submissions: true },
        },
        winners: {
          where: { isApproved: true },
          include: {
            submission: {
              include: { user: { select: { name: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    // Check Firestore hackathon for additional fields
    let firestoreHackathon: any = null;
    try {
      const hSnap = await getDoc(doc(db, COLLECTIONS.HACKATHONS, hackathon?.id || params.id));
      if (hSnap.exists()) {
        firestoreHackathon = hSnap.data();
      }
    } catch {}

    if (!hackathon && !firestoreHackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const effectiveId = hackathon?.id || firestoreHackathon?.id || params.id;
    const entryFee = firestoreHackathon?.registrationFee ?? hackathon?.entryFee ?? 0;

    let isRegistered = false;
    let userRegistration = null;
    let userSubmission = null;
    let userTeam: HackathonTeam | null = null;
    let isLeader = false;
    let userMemberPaymentStatus = "NOT_REQUIRED";

    if (session) {
      // 1. Check Prisma registration
      if (hackathon) {
        const reg = await prisma.hackathonRegistration.findFirst({
          where: {
            hackathonId: hackathon.id,
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

    const rules = parseArraySafe(firestoreHackathon?.rules || hackathon?.rules);
    const judgingCriteria = Array.isArray(firestoreHackathon?.judgingCriteria)
      ? firestoreHackathon.judgingCriteria
      : (firestoreHackathon?.judgingCriteria || hackathon?.judgingCriteria || "");
    const faqs = parseArraySafe(firestoreHackathon?.faqs || hackathon?.faqs);

    return NextResponse.json({
      hackathon: {
        id: effectiveId,
        title: firestoreHackathon?.title || hackathon?.title,
        slug: firestoreHackathon?.slug || hackathon?.slug,
        tagLine: hackathon?.tagLine,
        description: firestoreHackathon?.fullDescription || firestoreHackathon?.shortDescription || hackathon?.description,
        bannerUrl: firestoreHackathon?.bannerUrl || hackathon?.bannerUrl,
        entryFee,
        prizePool: firestoreHackathon?.prizePool ?? hackathon?.prizePool ?? 50000,
        startDate: firestoreHackathon?.startDate || hackathon?.startDate,
        endDate: firestoreHackathon?.endDate || hackathon?.endDate,
        registrationDeadline: firestoreHackathon?.registrationDeadline || hackathon?.registrationDeadline,
        registrationMode: firestoreHackathon?.registrationMode || "BOTH",
        minTeamSize: firestoreHackathon?.minTeamSize || 2,
        maxTeamSize: firestoreHackathon?.maxTeamSize || hackathon?.maxTeamSize || 4,
        submissionMethod: firestoreHackathon?.submissionMethod || "WEBSITE",
        googleFormUrl: firestoreHackathon?.googleFormUrl || null,
        rules,
        judgingCriteria,
        faqs,
        problemStatement: firestoreHackathon?.problemStatement || (hackathon?.problemPublished ? hackathon?.problemStatement : null),
        participantsCount: hackathon?._count?.registrations || 0,
        submissionsCount: hackathon?._count?.submissions || 0,
        isRegistered,
        userRegistration,
        userSubmission,
        userTeam,
        isLeader,
        userMemberPaymentStatus,
      },
    });
  } catch (error) {
    console.error("GET Hackathon ID Error:", error);
    return NextResponse.json({ error: "Failed to fetch hackathon" }, { status: 500 });
  }
}
