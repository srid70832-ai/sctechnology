"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { 
  Globe, 
  Clock, 
  Search, 
  Briefcase, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  MapPin,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Zap
} from "lucide-react";
import { formatISTDate, isDeadlinePassed } from "@/lib/platform-models";

export default function InternshipsListPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "BEGINNER" | "INTERMEDIATE" | "HIGHTECH" | "REMOTE" | "CLOSING_SOON">("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "deadline">("newest");

  const loadInternships = async () => {
    setLoading(true);
    try {
      // Fetch from Unified Opportunities API
      const res = await fetch("/api/opportunities?type=INTERNSHIP&limit=60");
      if (res.ok) {
        const data = await res.json();
        setInternships(data.opportunities || []);
      }
    } catch (err) {
      console.error("Error loading internships:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInternships();
  }, []);

  const isBeginner = (item: any) => {
    const text = `${item.title} ${item.tags?.join(" ")} ${item.company} ${item.category}`.toLowerCase();
    return text.includes("beginner") || text.includes("junior") || text.includes("springboard") || text.includes("zoho") || text.includes("cred") || text.includes("browserstack");
  };

  const isHighTech = (item: any) => {
    const text = `${item.title} ${item.tags?.join(" ")} ${item.company} ${item.category} ${item.skills?.join(" ")}`.toLowerCase();
    return text.includes("genai") || text.includes("llm") || text.includes("quantum") || text.includes("hft") || text.includes("low-latency") || text.includes("robotics") || text.includes("nvidia") || text.includes("crowdstrike") || text.includes("threat") || text.includes("research") || text.includes("high-tech") || text.includes("deep learning");
  };

  const filteredInternships = internships.filter((item) => {
    // Expiration check
    if (item.status === "EXPIRED" || isDeadlinePassed(item.deadline)) return false;

    // Mode / Tab filter
    if (activeTab === "BEGINNER" && !isBeginner(item)) return false;
    if (activeTab === "HIGHTECH" && !isHighTech(item)) return false;
    if (activeTab === "INTERMEDIATE" && (isBeginner(item) || isHighTech(item))) return false;
    if (activeTab === "REMOTE" && item.mode?.toLowerCase() !== "remote") return false;

    // Closing soon filter (within 7 days)
    if (activeTab === "CLOSING_SOON") {
      if (!item.deadline) return false;
      const nowMs = Date.now();
      const dlMs = new Date(item.deadline).getTime();
      const diffDays = (dlMs - nowMs) / (1000 * 60 * 60 * 24);
      if (diffDays < 0 || diffDays > 7) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchCompany = item.company?.toLowerCase().includes(q);
      const matchSkills = item.skills?.some((s: string) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchCompany && !matchSkills) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 overflow-hidden border-b border-slate-800/80">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6">
            <Briefcase className="w-3.5 h-3.5" /> Curated Career Launchpad
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Beginner to High-Tech <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">Internships</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Explore verified entry-level stepping stones, full-stack & backend engineering, and high-tech GenAI, HFT, and Quantum research internships with competitive stipends.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, or tech stack (e.g. React, Python, GenAI, HFT)..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                activeTab === "ALL" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              All Roles ({internships.length})
            </button>
            <button
              onClick={() => setActiveTab("BEGINNER")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "BEGINNER" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Beginner Tracks
            </button>
            <button
              onClick={() => setActiveTab("INTERMEDIATE")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                activeTab === "INTERMEDIATE" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Core Engineering
            </button>
            <button
              onClick={() => setActiveTab("HIGHTECH")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "HIGHTECH" ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-300" />
              High-Tech / Deep-Tech
            </button>
            <button
              onClick={() => setActiveTab("REMOTE")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                activeTab === "REMOTE" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              Remote
            </button>
            <button
              onClick={() => setActiveTab("CLOSING_SOON")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "CLOSING_SOON" ? "bg-rose-600 text-white shadow-md shadow-rose-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Closing Soon
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Showing {filteredInternships.length} active opportunities
          </span>
        </div>

        {/* Internships Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-sm font-medium">Scanning verified internships...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl p-8">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-white">No internships found</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition duration-200 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl"
              >
                <div>
                  {/* Top Row: Company & Source */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {item.companyLogoUrl ? (
                          <img src={item.companyLogoUrl} alt="" className="w-5 h-5 object-contain" />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{item.company}</h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {item.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isBeginner(item) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Beginner
                        </span>
                      )}
                      {isHighTech(item) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          High-Tech
                        </span>
                      )}
                      {!isBeginner(item) && !isHighTech(item) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          Core
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {item.mode}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Skills Pill List */}
                  {(() => {
                    const internSkills: string[] = Array.isArray(item.skills) ? item.skills : typeof item.skills === "string" ? (() => { try { return JSON.parse(item.skills); } catch { return [item.skills]; } })() : [];
                    if (internSkills.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {internSkills.slice(0, 4).map((s: string, idx: number) => (
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

                {/* Footer with Stipend & Apply */}
                <div className="pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                        Stipend / Comp
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">
                        {item.stipend || "Competitive"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                        Deadline
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.deadline ? formatISTDate(item.deadline) : "Rolling / Immediate"}
                      </span>
                    </div>
                  </div>

                  <a
                    href={item.applyUrl || item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-500/20"
                  >
                    Apply Now <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {item.sourceName && (
                    <p className="text-[10px] text-center text-slate-500 mt-2">
                      Source: {item.sourceName}
                    </p>
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
