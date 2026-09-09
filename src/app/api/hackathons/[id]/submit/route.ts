import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { findUserTeam, updateTeamSubmission } from "@/lib/team-storage";
import { isDeadlinePassed } from "@/lib/platform-models";
import { COLLECTIONS, removeUndefinedValues } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hackathonId = params.id;

    const hackathon = await prisma.hackathon.findFirst({
      where: {
        OR: [{ id: hackathonId }, { slug: hackathonId }],
      },
    });

    if (!hackathon) {
      return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      projectName, 
      description, 
      repoUrl, 
      liveUrl, 
      videoUrl, 
      pptUrl,
      documentation, 
      techStack,
      roundNumber = 1 
    } = body;

    // Strict server-side deadline enforcement
    const now = new Date();
    let effectiveDeadline = new Date(hackathon.endDate);

    // Check if there is a round-specific deadline
    if (hackathon.rounds) {
      try {
        const rounds = JSON.parse(hackathon.rounds);
        const targetRound = rounds.find((r: any) => r.roundNumber === Number(roundNumber));
        if (targetRound && targetRound.submissionDeadline) {
          effectiveDeadline = new Date(targetRound.submissionDeadline);
        }
      } catch {}
    }

    if (now > effectiveDeadline) {
      return NextResponse.json({ 
        error: `Submission deadline for Round ${roundNumber} has closed 🔒. Late submissions are strictly rejected.` 
      }, { status: 400 });
    }

    if (!projectName && !repoUrl && !pptUrl) {
      return NextResponse.json({ error: "Project name and submission link (Repository or Presentation PPT) are required" }, { status: 400 });
    }

    // Check if user is part of a team
    const userTeam = await findUserTeam(hackathon.id || hackathonId, session.userId);

    // If user is in a team, enforce LEADER ONLY submission
    if (userTeam) {
      if (userTeam.leaderId !== session.userId) {
        return NextResponse.json(
          { error: `Only the team leader (${userTeam.leaderName}) can submit for team "${userTeam.name}".` },
          { status: 403 }
        );
      }
    }

    // Check registration
    let registration = await prisma.hackathonRegistration.findFirst({
      where: {
        hackathonId: hackathon.id,
        userId: session.userId,
      },
    });

    if (!registration && !userTeam) {
      return NextResponse.json({ error: "You must register before submitting a project" }, { status: 400 });
    }

    // Update team document with the project submission
    if (userTeam) {
      await updateTeamSubmission(userTeam.id, {
        projectName: String(projectName).trim(),
        description: String(description || "").trim(),
        repoUrl: String(repoUrl).trim(),
        liveUrl: liveUrl ? String(liveUrl).trim() : null,
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        techStack: Array.isArray(techStack) ? techStack : [],
        submittedAt: new Date().toISOString(),
        submittedBy: session.userId,
      });
    }

    // Upsert submission in Prisma if registration exists
    let submission: any = null;
    if (registration) {
      submission = await prisma.hackathonSubmission.upsert({
        where: {
          registrationId: registration.id,
        },
        update: {
          projectName,
          description: description || "",
          repoUrl,
          liveUrl,
          videoUrl,
          techStack: JSON.stringify(techStack || []),
          documentation: documentation || "",
          submittedAt: new Date(),
        },
        create: {
          hackathonId: hackathon.id,
          userId: session.userId,
          registrationId: registration.id,
          projectName,
          description: description || "",
          repoUrl,
          liveUrl,
          videoUrl,
          techStack: JSON.stringify(techStack || []),
          documentation: documentation || "",
          submittedAt: new Date(),
        },
      });

      // Notify user
      try {
        await prisma.notification.create({
          data: {
            userId: session.userId,
            title: "Hackathon Project Submitted! 🚀",
            message: `Your project "${projectName}" for ${hackathon.title} has been received for judging.`,
            type: "HACKATHON",
            link: `/hackathons/${hackathon.slug}`,
          },
        });
      } catch {}
    }

    // Mirror to Firestore submissions for Admin Unified Submissions Hub
    const subId = submission?.id ? `sub-hack-${submission.id}` : `sub-team-${userTeam?.teamId || session.userId}`;
    try {
      await setDoc(
        doc(db, COLLECTIONS.SUBMISSIONS, subId),
        removeUndefinedValues({
          id: subId,
          targetType: "HACKATHON",
          targetId: hackathon.id,
          targetTitle: hackathon.title,
          studentId: session.userId,
          studentName: session.name,
          studentEmail: session.email,
          teamName: userTeam?.name || null,
          teamId: userTeam?.teamId || null,
          githubUrl: repoUrl,
          liveUrl: liveUrl || null,
          demoVideoUrl: videoUrl || null,
          description: description || "",
          techStack: Array.isArray(techStack) ? techStack : [],
          submissionMethod: "WEBSITE",
          status: "PENDING",
          submittedAt: serverTimestamp(),
        }),
        { merge: true }
      );
    } catch (fsErr) {
      console.warn("Firestore submission mirror notice:", fsErr);
    }

    return NextResponse.json({
      success: true,
      message: userTeam 
        ? `Project submitted successfully on behalf of team "${userTeam.name}"!` 
        : "Project submitted successfully!",
      submission,
      isTeamSubmission: !!userTeam,
    });
  } catch (error: any) {
    console.error("Hackathon Submit Error:", error);
    return NextResponse.json({ error: error?.message || "Failed to submit project" }, { status: 500 });
  }
}
