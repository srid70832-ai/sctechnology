"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FolderGit2, Search, ArrowRight, ExternalLink } from "lucide-react";
import { ProjectItem } from "@/types";

interface ProjectsSectionProps {
  initialProjects: ProjectItem[];
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ initialProjects = [] }) => {
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const safeProjects = Array.isArray(initialProjects) ? initialProjects : [];

  const filtered = safeProjects.filter((p) => {
    const pDiff = (p?.difficulty || "Intermediate").toLowerCase();
    const matchesFilter = filter === "All" || pDiff === filter.toLowerCase();
    
    const pTitle = (p?.title || "").toLowerCase();
    const pTech = Array.isArray(p?.techStack) ? p.techStack : Array.isArray((p as any)?.technologyStack) ? (p as any).technologyStack : [];
    
    const matchesSearch =
      searchQuery === "" ||
      pTitle.includes(searchQuery.toLowerCase()) ||
      pTech.some((t: string) => String(t || "").toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchesFilter && matchesSearch;
  });

  return (
    <section className="py-16 bg-[#070B14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Real-World Projects
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Production code repositories with documentation and installation blueprints
            </p>
          </div>
          <Link
            href="/projects"
            className="group text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Filter and Search Bar Matching Design */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-[#0C162E]/70 border border-slate-800 mb-8 backdrop-blur-md">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080E1C] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {["All", "Beginner", "Intermediate", "Advanced"].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  filter === level
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                    : "bg-[#0E1830] text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid with AnimatePresence */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AnimatePresence>
            {filtered.slice(0, 4).map((p) => {
              const pTech = Array.isArray(p?.techStack) ? p.techStack : Array.isArray((p as any)?.technologyStack) ? (p as any).technologyStack : [];
              return (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -6 }}
                  className="p-5 rounded-2xl bg-[#0C162E]/80 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group shadow-lg hover:shadow-blue-500/10 hover:shadow-2xl"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition line-clamp-1 mb-1.5">
                      {p.title || "Industry Project"}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {p.shortDesc || "Production code repository with documentation."}
                    </p>

                    {/* Tech tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pTech.slice(0, 3).map((tech: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                      {pTech.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-400 font-medium">
                          +{pTech.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        String(p.difficulty || "").toLowerCase() === "beginner"
                          ? "bg-emerald-500/15 text-emerald-400"
                        : String(p.difficulty || "").toLowerCase() === "intermediate"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-purple-500/15 text-purple-400"
                      }`}>
                        {p.difficulty}
                      </span>

                      {String(p.accessType || (p as any).accessLevel || "").toUpperCase() === "FREE" || (p as any).isFree ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                          FREE
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                          PRO
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/projects/${p.slug || p.id}`}
                      prefetch={true}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-semibold transition flex items-center gap-1 active:scale-95 duration-75 cursor-pointer"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No projects found matching your search.
          </div>
        )}

      </div>
    </section>
  );
};
