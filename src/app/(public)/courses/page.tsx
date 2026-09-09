"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { 
  Award, 
  Search, 
  Clock, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  ExternalLink,
  GraduationCap,
  Globe,
  CheckCircle2
} from "lucide-react";

export default function PublicCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      try {
        const res = await fetch("/api/courses?limit=60");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const providers = ["All", ...Array.from(new Set(courses.map((c) => c.provider || c.instructor || "SC TECH"))).filter(Boolean).slice(0, 8)];

  const filteredCourses = courses.filter((c) => {
    // Level filter
    const cLevel = (c.level || c.difficulty || "All Levels").toUpperCase();
    if (levelFilter !== "All" && !cLevel.includes(levelFilter.toUpperCase())) return false;

    // Provider filter
    const cProv = c.provider || c.instructor || "SC TECH";
    if (providerFilter !== "All" && cProv !== providerFilter) return false;

    // Free filter
    if (freeOnly && c.isFree === false && Number(c.price) > 0) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title || "").toLowerCase().includes(q) ||
      (c.description || c.shortDescription || "").toLowerCase().includes(q) ||
      (c.category || "").toLowerCase().includes(q) ||
      (c.provider || c.instructor || "").toLowerCase().includes(q) ||
      (c.skills || []).some((s: string) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar />

      <main className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-bold text-violet-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>VERIFIED ONLINE COURSES & MASTERCLASSES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Learn from <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Industry Leaders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Discover verified technical courses, professional certifications, and cloud blueprints from Microsoft Learn, Google Cloud, Harvard/edX, Meta, and SC TECH instructors.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, skill, or framework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Level filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              {["All", "BEGINNER", "INTERMEDIATE", "ADVANCED"].map((d) => (
                <button
                  key={d}
                  onClick={() => setLevelFilter(d)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    levelFilter === d
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {d === "All" ? "All Levels" : d}
                </button>
              ))}
            </div>

            {/* Free only toggle */}
            <button
              onClick={() => setFreeOnly(!freeOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                freeOnly
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              Free Only
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="text-sm font-medium">Scanning verified learning courses...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Courses Found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((c) => {
              const isExternal = Boolean(c.courseUrl && c.courseUrl.startsWith("http"));
              const providerName = c.provider || c.instructor || "SC TECH Official";

              return (
                <div
                  key={c.id}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group"
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {c.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {c.isFree !== false && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Free
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {c.level || c.difficulty || "All Levels"}
                        </span>
                      </div>
                    </div>

                    {/* Title & Provider */}
                    <div>
                      <h3 className="text-base font-black text-white group-hover:text-violet-400 transition line-clamp-2">
                        {c.title}
                      </h3>
                      <p className="text-xs text-violet-400 font-semibold mt-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {providerName}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-2">
                        {c.description || c.shortDescription}
                      </p>
                    </div>

                    {/* Skills tags */}
                    {c.skills && c.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {c.skills.slice(0, 4).map((sk: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] font-semibold text-slate-300 border border-slate-800"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta stats */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.duration || "Self-paced"}</span>
                      </span>

                      {c.certificateAvailable && (
                        <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Certificate Included
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-3 border-t border-slate-800/80">
                    {isExternal ? (
                      <a
                        href={c.courseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition transform hover:-translate-y-0.5"
                      >
                        <span>Start Course on {providerName.split("/")[0].trim()}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        href={`/courses/${c.slug || c.id}`}
                        className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition transform hover:-translate-y-0.5"
                      >
                        <span>View Curriculum & Learn</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
