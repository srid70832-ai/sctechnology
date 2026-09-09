import { NextResponse } from "next/server";
import { getOpportunities } from "@/lib/opportunity-pipeline";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limitCount = parseInt(searchParams.get("limit") || "20", 10);
    const type = (searchParams.get("type") || "ALL") as any;
    const sourceType = (searchParams.get("sourceType") || "ALL") as any;
    const mode = searchParams.get("mode") || "All";
    const isFree = searchParams.get("isFree") === "true";
    const closingSoon = searchParams.get("closingSoon") === "true";
    const search = searchParams.get("search") || "";
    const skill = searchParams.get("skill") || "";
    const sortBy = (searchParams.get("sortBy") || "newest") as any;

    const data = await getOpportunities({
      page,
      limitCount,
      type,
      sourceType,
      mode,
      isFree,
      closingSoon,
      search,
      skill,
      sortBy,
      includeHidden: false,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("GET /api/opportunities Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
