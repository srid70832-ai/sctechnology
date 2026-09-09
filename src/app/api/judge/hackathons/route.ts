import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !["JUDGE", "ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const assignments = await prisma.hackathonJudge.findMany({
      where: session.role === "JUDGE" ? { judgeId: session.userId } : {},
      include: {
        hackathon: {
          include: {
            submissions: {
              include: {
                user: { select: { name: true, email: true } },
                scores: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("GET Judge Hackathons Error:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
