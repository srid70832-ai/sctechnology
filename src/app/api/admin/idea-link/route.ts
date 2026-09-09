import { NextRequest, NextResponse } from "next/server";
import { getAllIdeasForAdmin, getAllConnectionsForAdmin } from "@/lib/idea-link-service";

export async function GET(req: NextRequest) {
  try {
    const [ideasData, connData] = await Promise.all([
      getAllIdeasForAdmin(),
      getAllConnectionsForAdmin(),
    ]);

    const connList = connData.connections || [];
    const stats = {
      ...ideasData.metrics,
      totalConnections: connList.length,
      activeConnections: connList.filter((c) => c.status !== "CLOSED").length,
      connectedCount: connList.filter((c) => c.status === "CONNECTED").length,
    };

    return NextResponse.json({
      success: true,
      ideas: ideasData.ideas,
      connections: connList,
      stats,
      metrics: stats,
    });
  } catch (err: any) {
    console.error("GET /api/admin/idea-link error:", err);
    return NextResponse.json({ error: "Failed to fetch admin idea-link data" }, { status: 500 });
  }
}
