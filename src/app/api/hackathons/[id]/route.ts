import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { findUserTeam } from "@/lib/team-storage";
import { HackathonTeam } from "@/lib/hackathon-team-models";

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

    let isRegistered = false;
    let userRegistration = null;
    let userSubmission = null;
    let userTeam: HackathonTeam | null = null;
    let isLeader = false;

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
          },
        });

        if (reg) {
          isRegistered = true;
          userRegistration = {
            id: reg.id,
            registrationNo: reg.registrationNo,
            status: reg.status,
            createdAt: reg.createdAt,
          };
          userSubmission = reg.submission;
        }
      }

      // 2. Check team membership
      try {
        const t = await findUserTeam(effectiveId, session.userId);
        if (t) {
          userTeam = t;
          isLeader = t.leaderId === session.userId;
          isRegistered = true;
          if (t.submission) {
            userSubmission = t.submission;
          }
        }
      } catch (err) {
        console.warn("Team check notice:", err);
      }
    }

    const rules = Array.isArray(firestoreHackathon?.rules)
      ? firestoreHackathon.rules
      : JSON.parse(hackathon?.rules || "[]");

    const judgingCriteria = Array.isArray(firestoreHackathon?.judgingCriteria)
      ? firestoreHackathon.judgingCriteria
      : JSON.parse(hackathon?.judgingCriteria || "[]");

    const faqs = Array.isArray(firestoreHackathon?.faqs)
      ? firestoreHackathon.faqs
      : JSON.parse(hackathon?.faqs || "[]");

    return NextResponse.json({
      hackathon: {
        id: effectiveId,
        title: firestoreHackathon?.title || hackathon?.title,
        slug: firestoreHackathon?.slug || hackathon?.slug,
        tagLine: hackathon?.tagLine,
        description: firestoreHackathon?.fullDescription || firestoreHackathon?.shortDescription || hackathon?.description,
        bannerUrl: firestoreHackathon?.bannerUrl || hackathon?.bannerUrl,
        entryFee: firestoreHackathon?.registrationFee ?? hackathon?.entryFee ?? 0,
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
      },
    });
  } catch (error) {
    console.error("GET Hackathon ID Error:", error);
    return NextResponse.json({ error: "Failed to fetch hackathon" }, { status: 500 });
  }
}
