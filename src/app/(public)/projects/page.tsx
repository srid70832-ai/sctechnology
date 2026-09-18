"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProjectData } from "@/lib/projects-data";
import { ProjectCardBanner } from "@/components/projects/ProjectCardBanner";
import { 
  FolderGit2, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  Code2, 
  Award,
  Play,
  Users,
  Check,
  Zap,
  TrendingUp,
  ShieldCheck
} from "lucide-react";

export default function ProjectsListPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState<"loading" | "allowed" | "upgrade">("loading");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const CATEGORY_PILLS = [
    "All",
    "Web Development",
    "AI/ML",
    "Mobile App",
    "IoT",
    "Blockchain",
    "Cloud Computing",
    "Cybersecurity",
    "FinTech"
  ];

  useEffect(() => {
    fetch("/api/projects")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load projects");
        const data = await response.json();
        setProjects(data.projects || []);
        setAccessState("allowed");
      })
      .catch((err) => {
        console.error("Error loading projects:", err);
        setAccessState("allowed");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (categoryFilter !== "All") {
      const cat = categoryFilter.toLowerCase();
      const pCat = p.category.toLowerCase();
      if (cat === "web development" && !pCat.includes("full stack") && !pCat.includes("web")) return false;
      else if (cat === "ai/ml" && !pCat.includes("ai") && !pCat.includes("machine learning") && !pCat.includes("intelligence")) return false;
      else if (cat === "iot" && !pCat.includes("iot")) return false;
      else if (cat === "blockchain" && !pCat.includes("blockchain") && !pCat.includes("web3")) return false;
      else if (!pCat.includes(cat) && cat !== "all") return false;
    }

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.shortDescription?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.technologyStack?.some((t) => t.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading real-world projects...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-12 space-y-16">
        
        {/* ========================================================= */}
        {/* 1. HERO BANNER SECTION (Pixel-Perfect Match to Blueprint) */}
        {/* ========================================================= */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-slate-900/95 via-[#0C1222]/90 to-[#070B14] border border-slate-800/80 shadow-2xl overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>REAL-WORLD LEARNING PLATFORM</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Build. Solve. Prove. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 drop-shadow-[0_0_25px_rgba(59,130,246,0.3)]">
                  Get Recognized.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Work on real-world projects, complete industry-focused tasks, get evaluated, earn stipends and build your professional portfolio.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#project-catalogue"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Explore Projects</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </a>

                <button
                  type="button"
                  onClick={() => alert("Watch Project Walkthrough: Build production-grade fullstack apps, submit 8 tasks, and get certified!")}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700/80 transition flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-300 text-slate-300" />
                  <span>Watch Video</span>
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  {["avatar1", "avatar2", "avatar3", "avatar4"].map((av, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-slate-900 bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  <span className="font-bold text-white">10,000+ Students</span> are building their future with SC TECH
                </div>
              </div>
            </div>

            {/* Right Card / Visual Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-950/80 border border-slate-800/90 shadow-2xl backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">SC TECH Engine v2.4</span>
                </div>

                <div className="space-y-3 font-mono text-[11px] text-slate-300 bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80">
                  <div className="text-cyan-400">// Real-World Production Architecture</div>
                  <div className="text-indigo-300">&quot;Ideas to Impact &lt;/&gt;&quot;</div>
                  <div className="text-emerald-400">✓ 8 Structured Milestone Tasks</div>
                  <div className="text-amber-300">✓ Up to ₹5,000 Performance Stipend</div>
                  <div className="text-blue-400">✓ Official Verified Certificates</div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                      LEARN
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                      BUILD
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      GROW
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">A Brighter Tomorrow ✨</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats Bar (25+ Projects | 8 Tasks | 4 Months | ₹5,000 Stipend) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80 relative z-10">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-white">25+</div>
                <div className="text-[11px] text-slate-400 font-medium">Real-World Projects</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-white">8</div>
                <div className="text-[11px] text-slate-400 font-medium">Tasks per Project</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-white">4 Months</div>
                <div className="text-[11px] text-slate-400 font-medium">Maximum Duration</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">₹5,000</div>
                <div className="text-[11px] text-slate-400 font-medium">Maximum Stipend</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. REAL-WORLD PROJECTS CATALOGUE (Middle section in image) */}
        {/* ========================================================= */}
        <div id="project-catalogue" className="space-y-6 scroll-mt-20">
          
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Real-World Projects</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Choose a project. Build real skills. Get evaluated. Earn while you learn.
            </p>
          </div>

          {/* Search bar & Category Filter Pills */}
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
              {CATEGORY_PILLS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProjects.map((p, idx) => {
              const isFeatured = idx < 2 || p.difficulty === "ADVANCED";
              const isFree =
                String(p.accessType || "").toUpperCase() === "FREE" ||
                String((p as any).accessLevel || "").toUpperCase() === "FREE" ||
                (p as any).isFree === true ||
                p.isPremium === false;

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-3xl bg-slate-900/90 border transition flex flex-col justify-between shadow-xl space-y-4 group relative ${
                    isFree ? "border-emerald-500/30 hover:border-emerald-500/60" : "border-slate-800 hover:border-blue-500/50"
                  }`}
                >
                  {/* Card Header & 16:9 Banner */}
                  <div className="space-y-3">
                    <ProjectCardBanner
                      id={p.id}
                      slug={p.slug}
                      title={p.title}
                      category={p.category}
                      difficulty={p.difficulty}
                      bannerUrl={(p as any).bannerUrl || (p as any).imageUrl || (p as any).thumbnail}
                      accessType={p.accessType || (p as any).accessLevel}
                      isFeatured={isFeatured}
                      aspectRatio="16/9"
                    />

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {p.shortDescription}
                      </p>
                    </div>

                    {/* Tech Stack Pills */}
                    {(() => {
                      const rawTech = (p.technologyStack || (p as any).techStack) as any;
                      const techArr: string[] = Array.isArray(rawTech) ? rawTech : typeof rawTech === "string" ? (() => { try { return JSON.parse(rawTech); } catch { return String(rawTech).split(",").map((s: string) => s.trim()).filter(Boolean); } })() : [];
                      if (techArr.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {techArr.slice(0, 3).map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] text-slate-300 border border-slate-800 font-mono"
                            >
                              {tech}
                            </span>
                          ))}
                          {techArr.length > 3 && (
                            <span className="text-[10px] text-slate-500 self-center">
                              +{techArr.length - 3}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card Footer: 8 Tasks | Duration | Action Link */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                        <Layers className="w-3 h-3" />
                        <span>8 Tasks</span>
                      </span>
                      <span>•</span>
                      <span>{p.estimatedDuration || "2-4 Months"}</span>
                    </div>

                    <Link
                      href={`/projects/${p.slug || p.id}`}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-md ${
                        isFree
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                      }`}
                    >
                      <span>{isFree ? "Start Free" : "Explore"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
