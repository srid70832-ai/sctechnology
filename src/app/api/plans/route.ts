import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    const formatted = plans.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      price: p.price,
      interval: p.interval,
      tagline: p.tagline,
      features: JSON.parse(p.features || "[]"),
      projectAccess: p.projectAccess,
      certificateAccess: p.certificateAccess,
      hrSessionAccess: p.hrSessionAccess,
      isPopular: p.isPopular,
    }));

    return NextResponse.json({ plans: formatted });
  } catch (error) {
    console.error("GET Plans Error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
