import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { BookOpen, Code2, Terminal, Video, FileText, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ResourcesPage() {
  const resources = [
    {
      title: "Full Stack Next.js & Prisma Architecture Guide",
      category: "Guide",
      desc: "Learn how to build production-ready full-stack applications with Next.js 14 App Router, Server Actions, and Prisma ORM.",
      icon: Terminal,
    },
    {
      title: "System Design Cheat Sheet for 2026",
      category: "Architecture",
      desc: "Comprehensive breakdown of caching strategies, database sharding, microservices, and message queues.",
      icon: Code2,
    },
    {
      title: "How to Win Hackathons: Project Blueprint",
      category: "Hackathon",
      desc: "Insider tips on pitching, rapid prototyping, architecture, and delivering high-scoring demos.",
      icon: BookOpen,
    },
    {
      title: "Technical Resume & Portfolio Handbook",
      category: "Career",
      desc: "Actionable frameworks for formatting resumes that pass automated ATS screens and impress engineering leads.",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-[11px] font-semibold text-blue-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Developer Resources
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Learning & Career Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Curated engineering roadmaps, technical interview cheat sheets, and hackathon playbooks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition p-6 flex flex-col justify-between shadow-xl space-y-4 group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-bold uppercase">
                      {r.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">{r.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Free Open Resource</span>
                  <Link href="/projects" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <span>Explore</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
