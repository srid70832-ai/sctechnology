import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncExternalOpportunities } from "@/lib/opportunity-pipeline";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { authorized, errorResponse } = await requireAdmin(req);
    if (!authorized) return errorResponse;

    const results = await syncExternalOpportunities();

    const totalFetched = results.reduce((sum, r) => sum + r.totalFetched, 0);
    const newAdded = results.reduce((sum, r) => sum + r.newAdded, 0);
    const updated = results.reduce((sum, r) => sum + r.updated, 0);

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${newAdded} new opportunities ingested, ${updated} verified & updated.`,
      summary: { totalFetched, newAdded, updated },
      details: results,
    });
  } catch (error: any) {
    console.error("POST /api/opportunities/sync Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Opportunity sync failed" },
      { status: 500 }
    );
  }
}
