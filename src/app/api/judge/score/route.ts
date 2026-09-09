import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !["JUDGE", "ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      submissionId,
      problemScore = 0,
      functionalityScore = 0,
      codeQualityScore = 0,
      uiUxScore = 0,
      innovationScore = 0,
      presentationScore = 0,
      feedback = "",
    } = body;

    const totalScore =
      Number(problemScore) +
      Number(functionalityScore) +
      Number(codeQualityScore) +
      Number(uiUxScore) +
      Number(innovationScore) +
      Number(presentationScore);

    const score = await prisma.hackathonScore.create({
      data: {
        submissionId,
        judgeId: session.userId,
        problemScore: Number(problemScore),
        functionalityScore: Number(functionalityScore),
        codeQualityScore: Number(codeQualityScore),
        uiUxScore: Number(uiUxScore),
        innovationScore: Number(innovationScore),
        presentationScore: Number(presentationScore),
        totalScore,
        feedback,
        isFinal: true,
      },
    });

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error("Score Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
  }
}
