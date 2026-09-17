"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { 
  Users, 
  Code2, 
  FolderGit2, 
  Briefcase, 
  Trophy, 
  Rocket, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface CareerNetworkStats {
  students?: number;
  projects?: number;
  internships?: number;
  hackathons?: number;
}

interface FutureCareerNetworkProps {
  stats?: CareerNetworkStats;
}

interface NetworkNode {
  id: string;
  step: string;
  title: string;
  shortDesc: string;
  hoverDetail: string;
  badge: string;
  icon: React.ElementType;
  glowColor: string;
  borderColor: string;
  textColor: string;
  accentBg: string;
  countLabel?: string;
  href: string;
}

export const FutureCareerNetwork: React.FC<FutureCareerNetworkProps> = ({ stats }) => {
  const shouldReduceMotion = useReducedMotion();
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodes: NetworkNode[] = [
    {
      id: "students",
      step: "01",
      title: "Students & Builders",
      shortDesc: "Verified engineering talent & tech learners",
      hoverDetail: "Start as an aspiring builder with a verified cryptographic portfolio and profile.",
      badge: "START HERE",
      icon: Users,
      glowColor: "rgba(59, 130, 246, 0.25)",
      borderColor: "border-blue-500/35 hover:border-blue-400/70",
      textColor: "text-blue-400",
      accentBg: "bg-blue-500/15",
      countLabel: stats?.students ? `${stats.students.toLocaleString()}+ Students` : undefined,
      href: "/dashboard",
    },
    {
      id: "skills",
      step: "02",
      title: "Skills & Curricula",
      shortDesc: "Build in-demand technical capabilities",
      hoverDetail: "Master modern full-stack architectures, AI pipelines, cloud systems & system design.",
      badge: "CAPABILITIES",
      icon: Code2,
      glowColor: "rgba(6, 182, 212, 0.25)",
      borderColor: "border-cyan-500/35 hover:border-cyan-400/70",
      textColor: "text-cyan-400",
      accentBg: "bg-cyan-500/15",
      countLabel: "Mastery Tracks",
      href: "/courses",
    },
    {
      id: "projects",
      step: "03",
      title: "Real-World Projects",
      shortDesc: "Build production-grade repository blueprints",
      hoverDetail: "Solve industry engineering tasks, write scalable code, and deploy real production apps.",
      badge: "PRODUCTION",
      icon: FolderGit2,
      glowColor: "rgba(168, 85, 247, 0.25)",
      borderColor: "border-purple-500/35 hover:border-purple-400/70",
      textColor: "text-purple-400",
      accentBg: "bg-purple-500/15",
      countLabel: stats?.projects ? `${stats.projects}+ Blueprints` : undefined,
      href: "/projects",
    },
    {
      id: "hackathons",
      step: "04",
      title: "Innovation Hackathons",
      shortDesc: "Compete, collaborate & solve industry challenges",
      hoverDetail: "Build fast under real-world problem statements, win prize pools, and stand on the podium.",
      badge: "COMPETE",
      icon: Trophy,
      glowColor: "rgba(245, 158, 11, 0.25)",
      borderColor: "border-amber-500/35 hover:border-amber-400/70",
      textColor: "text-amber-400",
      accentBg: "bg-amber-500/15",
      countLabel: stats?.hackathons ? `${stats.hackathons}+ Challenges` : undefined,
      href: "/hackathons",
    },
    {
      id: "internships",
      step: "05",
      title: "Verified Internships",
      shortDesc: "Gain industry experience with stipend",
      hoverDetail: "Directly match with hiring partner companies and tech startups for mentored roles.",
      badge: "EXPERIENCE",
      icon: Briefcase,
      glowColor: "rgba(16, 185, 129, 0.25)",
      borderColor: "border-emerald-500/35 hover:border-emerald-400/70",
      textColor: "text-emerald-400",
      accentBg: "bg-emerald-500/15",
      countLabel: stats?.internships ? `${stats.internships}+ Openings` : undefined,
      href: "/internships",
    },
    {
      id: "career",
      step: "06",
      title: "Career Acceleration",
      shortDesc: "Build your future & lead tomorrow",
      hoverDetail: "Graduate into high-impact full-time engineering and AI roles with verifiable credentials.",
      badge: "CAREER READY",
      icon: Rocket,
      glowColor: "rgba(236, 72, 153, 0.25)",
      borderColor: "border-pink-500/35 hover:border-pink-400/70",
      textColor: "text-pink-400",
      accentBg: "bg-pink-500/15",
      countLabel: "Lifetime Network",
      href: "/leaderboard",
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-[#060A14] relative overflow-hidden border-y border-slate-800/60">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1A33] border border-blue-500/30 text-xs font-semibold text-blue-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>SC TECH CAREER ARCHITECTURE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            The Future <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC]">Career Network</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An interconnected growth engine transforming student builders into high-impact software engineers through verifiable skills, real projects, hackathons, and paid internships.
          </p>
        </div>

        {/* DESKTOP / TABLET: 6-STEP CONNECTED NETWORK PIPELINE */}
        <div className="hidden md:block relative">
          
          {/* Animated Connecting Circuit Line (Behind Cards) */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-pink-500/20 rounded-full pointer-events-none -z-0" />

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 lg:gap-3 relative z-10">
            {nodes.map((node, idx) => {
              const Icon = node.icon;
              const isHovered = activeNode === node.id;

              return (
                <motion.div
                  key={node.id}
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  onMouseEnter={() => setActiveNode(node.id)}
                  onMouseLeave={() => setActiveNode(null)}
                  whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.02 }}
                  className={`p-4 rounded-3xl bg-gradient-to-b from-[#0B152B] to-[#070D1A] border ${node.borderColor} transition-all duration-300 shadow-xl flex flex-col justify-between group cursor-default relative overflow-hidden`}
                  style={{
                    boxShadow: isHovered ? `0 12px 30px -5px ${node.glowColor}` : "none",
                  }}
                >
                  {/* Subtle Node Hover Glow */}
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity duration-300"
                    style={{
                      background: node.glowColor,
                      opacity: isHovered ? 0.6 : 0.15,
                    }}
                  />

                  <div className="space-y-3 relative z-10">
                    {/* Top Row: Step Tag + Badge */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {node.step}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${node.accentBg} ${node.textColor} border-current/30`}>
                        {node.badge}
                      </span>
                    </div>

                    {/* Icon + Title */}
                    <div className="space-y-2">
                      <div className={`w-10 h-10 rounded-2xl ${node.accentBg} border border-current/30 flex items-center justify-center ${node.textColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {node.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {isHovered ? node.hoverDetail : node.shortDesc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Counter or Action */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {node.countLabel || "SC TECH Track"}
                    </span>
                    <Link
                      href={node.href}
                      className="text-cyan-400 hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5"
                    >
                      <span>Explore</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* MOBILE: CLEAN VERTICAL CONNECTED FLOW */}
        <div className="md:hidden space-y-3">
          {nodes.map((node, idx) => {
            const Icon = node.icon;
            return (
              <div
                key={node.id}
                className={`p-4 rounded-2xl bg-gradient-to-r from-[#0B152B] to-[#070D1A] border ${node.borderColor} flex items-start gap-3.5 shadow-lg relative`}
              >
                <div className={`w-10 h-10 rounded-xl ${node.accentBg} border border-current/30 flex items-center justify-center ${node.textColor} shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white">{node.title}</h3>
                    <span className="font-mono text-[10px] font-bold text-slate-500">Step {node.step}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {node.shortDesc}
                  </p>
                  {node.countLabel && (
                    <span className="inline-block text-[10px] font-semibold text-cyan-400 pt-0.5">
                      ● {node.countLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Feature Micro-Strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400 pt-2 text-center">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Zero Fake Data Guarantee</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Live Firestore Synchronized Pipeline</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Cryptographically Verifiable Milestones</span>
          </div>
        </div>

      </div>
    </section>
  );
};
