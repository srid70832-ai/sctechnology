import { NextResponse } from "next/server";
import { getVerifiedProjectsFromFirestore } from "@/lib/projects-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty") || "";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "popular";

    let projects = await getVerifiedProjectsFromFirestore();

    // 1. Difficulty filter
    if (difficulty && difficulty !== "All") {
      projects = projects.filter((p) => p.difficulty?.toUpperCase() === difficulty.toUpperCase());
    }

    // 2. Category filter
    if (category && category !== "All") {
      projects = projects.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }

    // 3. Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      projects = projects.filter((p) => 
        p.title?.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.technologyStack?.some((t) => t.toLowerCase().includes(q)) ||
        p.learningOutcomes?.some((l) => l.toLowerCase().includes(q))
      );
    }

    // 4. Sort
    if (sort === "newest") {
      projects.reverse();
    } else if (sort === "difficulty") {
      const diffOrder: Record<string, number> = { "BEGINNER": 1, "INTERMEDIATE": 2, "ADVANCED": 3 };
      projects.sort((a, b) => (diffOrder[b.difficulty] || 0) - (diffOrder[a.difficulty] || 0));
    } else {
      // Default: Popularity by real download count
      projects.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    }

    return NextResponse.json({ 
      success: true, 
      count: projects.length, 
      projects 
    });
  } catch (error) {
    console.error("GET Projects Error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
