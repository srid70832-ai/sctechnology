"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { collection, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProblemStatement } from "@/lib/problem-statements";
import { 
  FileCode2, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight, 
  Users, 
  Calendar, 
  Globe, 
  Building2, 
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function ProblemStatementsListPage() {
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");

  useEffect(() => {
    const colRef = collection(db, "problemStatements");
    const q = query(colRef, where("status", "==", "PUBLISHED"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ProblemStatement[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as ProblemStatement) });
        });
        setProblems(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        getDocs(q)
          .then((snap) => {
            const list: ProblemStatement[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...(d.data() as ProblemStatement) }));
            setProblems(list);
          })
          .catch((e) => console.error(e))
          .finally(() => setLoading(false));
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredProblems = problems.filter((item) => {
    if (domainFilter !== "All" && item.domain !== domainFilter) return false;
    if (difficultyFilter !== "All" && item.difficulty !== difficultyFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.shortDescription?.toLowerCase().includes(q) ||
      item.domain?.toLowerCase().includes(q) ||
      item.organization?.toLowerCase().includes(q) ||
      item.requiredSkills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Header */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-[11px] font-bold text-blue-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>REAL-WORLD CHALLENGE MATRIX</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Real-World Problem Statements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Solve authentic industry and civic engineering challenges. Form a team, architect working production prototypes, and prove your capabilities directly to recruiters.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by challenge title, domain, or skills..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Domains</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="AI / Machine Learning">AI / Machine Learning</option>
              <option value="Cloud & DevOps">Cloud & DevOps</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Fintech & Payments">Fintech & Payments</option>
              <option value="Healthcare & BioTech">Healthcare & BioTech</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Loading published problem statements...</span>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center max-w-md mx-auto space-y-3">
            <FileCode2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No problem statements are currently available.</h3>
            <p className="text-xs text-slate-400">Please check back shortly as new industry challenges are published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProblems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-xl space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Domain & Difficulty Header */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                      {item.domain}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.difficulty === "HARD" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                      item.difficulty === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}>
                      {item.difficulty}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white leading-snug">
                    {item.title}
                  </h3>

                  {/* Short Description */}
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {item.shortDescription}
                  </p>

                  {/* Required Skills Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.requiredSkills?.slice(0, 4).map((sk, sIdx) => (
                      <span key={sIdx} className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-semibold">
                        {sk}
                      </span>
                    ))}
                    {item.requiredSkills && item.requiredSkills.length > 4 && (
                      <span className="px-2 py-1 rounded-xl bg-slate-950/80 text-[10px] text-slate-400">
                        +{item.requiredSkills.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Organization & Team Size */}
                  <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{item.organization || "SC TECH Original"}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{item.teamSizeMin}-{item.teamSizeMax} Members</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.deadline ? `Deadline: ${item.deadline}` : "Open Challenge"}</span>
                  </span>

                  <Link
                    href={`/problem-statements/${item.slug || item.id}`}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
                  >
                    <span>View & Build</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
