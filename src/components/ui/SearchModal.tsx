"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Briefcase, 
  Trophy, 
  FolderGit2, 
  BookOpen, 
  Building2, 
  ArrowRight,
  Sparkles,
  Lightbulb
} from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const searchableItems = [
    { title: "SC Idea Link — Startup Idea to Company Synergy Match", category: "Idea Link", icon: Lightbulb, href: "/idea-link" },
    { title: "Full Stack Web Developer Internship", category: "Internships", icon: Briefcase, href: "/internships" },
    { title: "AI & Machine Learning Internship", category: "Internships", icon: Briefcase, href: "/internships" },
    { title: "SC TECH National Hackathon 2026", category: "Hackathons", icon: Trophy, href: "/hackathons" },
    { title: "E-Commerce Microservices Platform", category: "Projects", icon: FolderGit2, href: "/projects" },
    { title: "Real-Time AI Chat Application", category: "Projects", icon: FolderGit2, href: "/projects" },
    { title: "Full-Stack Cloud & DevOps Specialization", category: "Courses", icon: BookOpen, href: "/courses" },
    { title: "Data Structures & Algorithms Mastery", category: "Courses", icon: BookOpen, href: "/courses" },
    { title: "Partner Hiring Companies", category: "Companies", icon: Building2, href: "/companies" },
    { title: "Industry Problem Statements", category: "Problem Statements", icon: Sparkles, href: "/problem-statements" },
    { title: "Career & Subscription Plans", category: "Plans", icon: Sparkles, href: "/plans" },
  ];

  const filteredItems = query.trim() === ""
    ? searchableItems.slice(0, 6)
    : searchableItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/70">
              <Search className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search opportunities, courses, hackathons, projects..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-slate-400 hover:text-white rounded-md mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                <span>ESC to close</span>
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[360px] overflow-y-auto p-3 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                {query.trim() === "" ? "Quick Opportunities" : "Search Results"}
              </div>

              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.category}</div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching opportunities found for &quot;{query}&quot;
                </div>
              )}
            </div>

            {/* Modal Bottom Helper */}
            <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>Press <strong>Enter</strong> to select</span>
                <span>•</span>
                <span><strong>↑↓</strong> to navigate</span>
              </div>
              <span className="text-blue-400">SC TECH Search Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
