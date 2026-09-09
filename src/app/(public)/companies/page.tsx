"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { 
  Building, 
  Search, 
  MapPin, 
  ExternalLink, 
  Briefcase, 
  Calendar, 
  Sparkles, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { CompanyItem, formatISTDate } from "@/lib/platform-models";

export default function PublicCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("All");

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = await res.json();
          setCompanies(data.companies || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, []);

  const filteredCompanies = companies.filter((c) => {
    if (jobTypeFilter !== "All" && c.jobType?.toLowerCase() !== jobTypeFilter.toLowerCase()) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.requiredSkills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar />

      <main className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-bold text-cyan-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>PARTNER EMPLOYERS & RECRUITING NETWORKS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Verified Hiring Companies
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Discover recruiting tech enterprises and startups actively seeking talent from SC TECH. Apply directly through verified application portals.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies, skills, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["All", "Internship", "Full-time", "Contract"].map((type) => (
              <button
                key={type}
                onClick={() => setJobTypeFilter(type)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  jobTypeFilter === type
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span>Loading hiring partners...</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Building className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Companies Match Your Search</h3>
            <p className="text-xs text-slate-400">Try adjusting your keyword or filter options.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold overflow-hidden">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition">
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{c.location}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {c.jobType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Required Skills */}
                  {c.requiredSkills && c.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.requiredSkills.slice(0, 4).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] font-semibold text-slate-300 border border-slate-800"
                        >
                          {sk}
                        </span>
                      ))}
                      {c.requiredSkills.length > 4 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{c.requiredSkills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Eligibility */}
                  {c.eligibility && (
                    <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                      <span className="text-slate-500">Eligibility: </span>
                      <span>{c.eligibility}</span>
                    </div>
                  )}

                  {/* Deadline */}
                  {c.deadline && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Deadline: {formatISTDate(c.deadline)}</span>
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <div className="pt-3 border-t border-slate-800/80">
                  <a
                    href={c.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition transform hover:-translate-y-0.5"
                  >
                    <span>Apply on Company Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
