"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { 
  Trophy, 
  Calendar, 
  Users, 
  IndianRupee, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  ExternalLink, 
  Search, 
  Clock, 
  Loader2,
  Flame,
  Award
} from "lucide-react";
import { formatISTDate } from "@/lib/platform-models";

export default function HackathonsListPage() {
  const [internalHackathons, setInternalHackathons] = useState<any[]>([]);
  const [externalHackathons, setExternalHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "INTERNAL" | "EXTERNAL" | "REMOTE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadHackathons = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1. Fetch Internal Hackathons from Public Hackathons API (Backed securely by Firebase Admin SDK)
      const res = await fetch("/api/hackathons", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Hackathon API failed (${res.status})`);
      }
      const data = await res.json();
      if (!Array.isArray(data.hackathons)) {
        throw new Error("The hackathon API returned an invalid response.");
      }
      setInternalHackathons(data.hackathons);

      // 2. Fetch External Hackathons from Opportunities API
      try {
        const oppRes = await fetch("/api/opportunities?type=HACKATHON&limit=50");
        if (oppRes.ok) {
          const oppData = await oppRes.json();
          setExternalHackathons(oppData.opportunities || []);
        }
      } catch (oppErr) {
        console.warn("Opportunities API notice:", oppErr);
      }
    } catch (err: any) {
      console.error("Error loading hackathons:", err);
      setInternalHackathons([]);
      setLoadError(err?.message || "Failed to load hackathons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  // Normalize internal hackathons to common card presentation
  const normalizedInternal = internalHackathons.map((h) => ({
    id: h.id,
    title: h.title,
    logoUrl: h.logoUrl || null,
    organizer: "SC TECH Official",
    sourceType: "INTERNAL",
    sourceName: "SC TECH Official",
    description: h.description,
    mode: h.mode || "Online",
    prize: h.prizePool ? `₹${Number(h.prizePool).toLocaleString("en-IN")}` : "Certificate & Cash",
    teamSize: h.minTeamSize === h.maxTeamSize ? `${h.minTeamSize} members` : `${h.minTeamSize}-${h.maxTeamSize} members`,
    deadline: h.registrationDeadline || h.endDate,
    startDate: h.startDate,
    endDate: h.endDate,
    featured: true,
    skills: ["AI / ML", "Full Stack", "Problem Solving"],
    applyUrl: `/hackathons/${h.id}`,
    isInternal: true,
  }));

  const normalizedExternal = externalHackathons.map((h) => ({
    id: h.id,
    title: h.title,
    logoUrl: null,
    organizer: h.company,
    sourceType: "EXTERNAL",
    sourceName: h.sourceName,
    description: h.description,
    mode: h.mode || "Remote",
    prize: h.prize || "Prizes & Recognition",
    teamSize: h.teamSize || "1-4 members",
    deadline: h.deadline,
    startDate: h.startDate,
    endDate: h.endDate,
    featured: h.featured,
    skills: h.skills || [],
    applyUrl: h.applyUrl || h.sourceUrl,
    isInternal: false,
  }));

  const combined = [...normalizedInternal, ...normalizedExternal];

  const filtered = combined.filter((item) => {
    if (activeTab === "INTERNAL" && item.sourceType !== "INTERNAL") return false;
    if (activeTab === "EXTERNAL" && item.sourceType !== "EXTERNAL") return false;
    if (activeTab === "REMOTE" && item.mode?.toLowerCase() !== "remote" && item.mode?.toLowerCase() !== "online") {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchOrg = item.organizer?.toLowerCase().includes(q);
      const matchSkills = item.skills?.some((s: string) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchOrg && !matchSkills) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 overflow-hidden border-b border-slate-800/80">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/10 to-transparent blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6">
            <Trophy className="w-3.5 h-3.5" /> Discovery Hub & Competitions
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Build, Compete & Win at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Scale</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Compete in official SC TECH flagship multi-round hackathons with automated AI evaluations, or discover verified developer challenges across Devpost, Devfolio, and global tech platforms.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hackathons by keyword, organizer, or tech stack..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === "ALL" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              All Challenges ({combined.length})
            </button>
            <button
              onClick={() => setActiveTab("INTERNAL")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "INTERNAL" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> SC TECH Official ({normalizedInternal.length})
            </button>
            <button
              onClick={() => setActiveTab("EXTERNAL")}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === "EXTERNAL" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" /> External / Devpost ({normalizedExternal.length})
            </button>
            <Link
              href="/leaderboard"
              className="px-4 py-2 rounded-lg font-medium text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Hall of Fame
            </Link>
            <button
              onClick={() => setActiveTab("REMOTE")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === "REMOTE" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Virtual / Online
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Showing {filtered.length} curated hackathons
          </span>
        </div>

        {/* Hackathon Cards Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-sm font-medium">Scanning hackathon discovery feeds...</p>
          </div>
        ) : loadError ? (
          <div className="py-20 text-center border border-rose-500/30 rounded-2xl p-8">
            <Trophy className="w-12 h-12 text-rose-400 mx-auto mb-3 opacity-70" />
            <h3 className="text-base font-semibold text-white">Unable to load hackathons</h3>
            <p className="text-xs text-rose-300 mt-1">{loadError}</p>
            <button onClick={loadHackathons} className="mt-4 px-4 py-2 rounded-lg bg-rose-600 text-xs font-semibold">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl p-8">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-white">No hackathons found</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border bg-slate-900/60 p-6 transition duration-200 hover:border-slate-700 hover:shadow-xl ${
                  item.isInternal
                    ? "border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20"
                    : "border-slate-800/80 hover:bg-slate-900/90"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    {item.isInternal ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <Sparkles className="w-3 h-3 text-amber-300" /> SC TECH OFFICIAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Globe className="w-3 h-3" /> Source: {item.sourceName || "External Feed"}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                      {item.mode}
                    </span>
                  </div>

                  <div className="w-16 h-16 mb-4 rounded-2xl border border-slate-700/80 bg-slate-950/80 overflow-hidden flex items-center justify-center">
                    {item.logoUrl ? (
                      <img src={item.logoUrl} alt={`${item.title} logo`} className="w-full h-full object-contain" />
                    ) : (
                      <Trophy className="w-7 h-7 text-amber-400/70" />
                    )}
                  </div>

                  {/* Title & Organizer */}
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 hover:text-blue-400 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">{item.organizer}</p>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Skills Pill list */}
                  {(() => {
                    const hackSkills: string[] = Array.isArray(item.skills) ? item.skills : typeof item.skills === "string" ? (() => { try { return JSON.parse(item.skills); } catch { return [item.skills]; } })() : [];
                    if (hackSkills.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {hackSkills.slice(0, 3).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/50"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Details Footer */}
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate text-slate-300 font-medium">{item.prize}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{item.teamSize}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate text-[11px]">
                        Deadline: {item.deadline ? formatISTDate(item.deadline) : "Open / Rolling"}
                      </span>
                    </div>
                  </div>

                  {/* CTA Action */}
                  {item.isInternal ? (
                    <Link
                      href={item.applyUrl}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-500/20"
                    >
                      View & Register <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <a
                      href={item.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700"
                    >
                      Apply on {item.sourceName || "External"} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
