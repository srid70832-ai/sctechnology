"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  Sparkles, 
  Briefcase, 
  IndianRupee, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  ExternalLink,
  Flame,
  Search,
  Star,
  Users,
  Gift,
  Zap,
  BarChart3,
  TrendingUp,
  Globe,
  Rocket,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"champions" | "achievements" | "internships">("champions");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("All Time");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error("Fetch leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const champions = data?.champions || [];
  const recentAchievements = data?.recentAchievements || [];
  const internshipAchievements = data?.internshipAchievements || [];

  const filteredChampions = champions.filter((c: any) =>
    c.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentCollege?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAchievements = recentAchievements.filter((a: any) =>
    a.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.hackathonTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.teamName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInternships = internshipAchievements.filter((i: any) =>
    i.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#050814] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Ambient background flares */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,116,144,0.12),rgba(255,255,255,0))]" />
      <div className="fixed top-1/4 -left-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 -right-48 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 relative z-10">
        
        {/* HERO SECTION (2-Column Layout with Trophy & Floating Badges) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          
          {/* Left Column: Title, Subtitle, Slogan Quote Box */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>SC TECH HALL OF FAME</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Global Student <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-300 to-fuchsia-400 drop-shadow-[0_0_30px_rgba(56,189,248,0.35)]">
                Leaderboard
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Recognizing top collegiate innovators, hackathon winners, and students with verified industry internship stipends.
            </p>

            {/* Slogan Quote Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0C152B]/90 via-[#0A1020]/90 to-[#070B18]/90 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-between gap-4 max-w-lg">
              <span className="text-xs sm:text-sm font-bold text-cyan-300">
                &ldquo;Build. Compete. Learn. Lead the Future.&rdquo;
              </span>
              <span className="text-xs font-semibold text-slate-400 shrink-0">
                — SC TECH
              </span>
            </div>
          </div>

          {/* Right Column: 3D Trophy on Tiered Pedestal + 4 Floating Badges + Neon Script */}
          <div className="lg:col-span-6 flex items-center justify-center relative min-h-[320px]">
            
            {/* Cosmic globe background glow */}
            <div className="absolute w-72 h-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />

            {/* Neon Cursive Floating Quote */}
            <div className="absolute -top-3 right-2 text-right hidden sm:block pointer-events-none">
              <span className="font-serif italic text-sm text-indigo-300 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]">
                Students Today. <br /> Leaders Tomorrow.
              </span>
            </div>

            {/* Floating Badge 1: Top Innovators (Top-Left) */}
            <div className="absolute top-4 left-0 sm:left-4 z-20 px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Innovators</span>
            </div>

            {/* Floating Badge 2: Real-World Impact (Top-Right) */}
            <div className="absolute top-10 right-4 sm:right-10 z-20 px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)] backdrop-blur-md">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-World Impact</span>
            </div>

            {/* Center Trophy with Pedestal */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <img
                  src="/images/hackathon-trophy.png"
                  alt="SC TECH Grand Trophy"
                  className="w-48 sm:w-56 object-contain filter drop-shadow-[0_15px_30px_rgba(245,158,11,0.35)]"
                />
              </div>

              {/* Tiered Futuristic Pedestal with Brand Pillars */}
              <div className="w-44 sm:w-52 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-900/80 via-indigo-900/90 to-purple-900/80 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-center -mt-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-200 block font-mono">
                  LEARN • BUILD • GROW • SUCCEED
                </span>
              </div>
            </div>

            {/* Floating Badge 3: Hackathon Champions (Bottom-Left) */}
            <div className="absolute bottom-4 left-0 sm:left-6 z-20 px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hackathon Champions</span>
            </div>

            {/* Floating Badge 4: Career Ready (Bottom-Right) */}
            <div className="absolute bottom-6 right-2 sm:right-8 z-20 px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Career Ready</span>
            </div>

          </div>

        </div>

        {/* 4 STATS GLOW CARDS (Matching Reference Image) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Box 1: Total Champions (Cyan Glow) */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#091224]/90 to-[#060B18]/90 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex items-center gap-4 group transition hover:border-cyan-400/60">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">TOTAL CHAMPIONS</span>
              <span className="text-2xl font-black text-white block">
                {data?.totalChampionsCount || champions.length || 0}
              </span>
              <span className="text-[11px] text-slate-400 block">Across all hackathons</span>
            </div>
          </div>

          {/* Box 2: Prize Pool Distributed (Purple/Pink Glow) */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#110D26]/90 to-[#070614]/90 border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.15)] flex items-center gap-4 group transition hover:border-purple-400/60">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">PRIZE POOL DISTRIBUTED</span>
              <span className="text-2xl font-black text-white block">
                ₹{(data?.totalPrizePoolWon || 0).toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 block">To student innovators</span>
            </div>
          </div>

          {/* Box 3: Verified Wins (Teal/Emerald Glow) */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#08171C]/90 to-[#050E12]/90 border border-teal-500/40 shadow-[0_0_25px_rgba(20,184,166,0.15)] flex items-center gap-4 group transition hover:border-teal-400/60">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">VERIFIED WINS</span>
              <span className="text-2xl font-black text-white block">
                {data?.verifiedWinsCount || recentAchievements.length || 0}
              </span>
              <span className="text-[11px] text-slate-400 block">Authentic achievements</span>
            </div>
          </div>

          {/* Box 4: Paid Internships (Amber Glow) */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#181308]/90 to-[#0C0A04]/90 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] flex items-center gap-4 group transition hover:border-amber-400/60">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">PAID INTERNSHIPS</span>
              <span className="text-2xl font-black text-white block">
                {data?.paidInternshipsCount || internshipAchievements.length || 0}
              </span>
              <span className="text-[11px] text-slate-400 block">With industry stipends</span>
            </div>
          </div>

        </div>

        {/* TABS & SEARCH / FILTER ROW */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Left Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#090E1D]/90 border border-slate-800/90 w-full lg:w-auto overflow-x-auto shadow-lg">
            <button
              onClick={() => setActiveTab("champions")}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "champions"
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-400/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Hackathon Champions ({champions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "achievements"
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-400/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Achievements ({recentAchievements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("internships")}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "internships"
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-400/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>Internship Stipends ({internshipAchievements.length})</span>
            </button>
          </div>

          {/* Right Search Input & Time Filter */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, college, or hackathon..."
                className="w-full bg-[#090E1D] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-[#090E1D] border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 shadow-sm"
              >
                <span>{timeFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

        </div>

        {/* MAIN LEADERBOARD TABLE CONTAINER (Matching Reference Image) */}
        <div className="rounded-3xl bg-[#080E1C]/80 border border-slate-800/90 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
          
          {loading ? (
            <div className="py-20 flex items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-medium">Loading Hall of Fame records...</span>
            </div>
          ) : activeTab === "champions" ? (
            <div>
              {/* Table Header Row */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#050914] text-slate-500 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">RANK</th>
                      <th className="py-3.5 px-4">STUDENT INNOVATOR</th>
                      <th className="py-3.5 px-4">COLLEGE / INSTITUTION</th>
                      <th className="py-3.5 px-4 text-center">PODIUM FINISHES</th>
                      <th className="py-3.5 px-4 text-right">TOTAL PRIZE WON</th>
                      <th className="py-3.5 px-4 text-center">SCORE</th>
                      <th className="py-3.5 px-4 text-right">BADGES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredChampions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          {/* Exact Empty State from Screenshot */}
                          <div className="max-w-md mx-auto space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                              <Users className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-base font-black text-white">No student champions yet!</h4>
                              <p className="text-xs text-slate-400">
                                Be the first to make your mark. Participate in hackathons and win.
                              </p>
                            </div>
                            <Link
                              href="/hackathons"
                              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-blue-600 to-purple-600 hover:from-sky-300 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(56,189,248,0.4)] transition transform hover:-translate-y-0.5"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                              <span>Explore Hackathons →</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredChampions.map((c: any) => (
                        <tr key={c.studentUid || c.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold font-mono text-xs ${
                              c.rank === 1
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : c.rank === 2
                                ? "bg-slate-400/20 text-slate-200 border border-slate-400/40"
                                : c.rank === 3
                                ? "bg-amber-800/20 text-amber-400 border border-amber-800/40"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              #{c.rank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              {c.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              <span>{c.studentName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{c.totalWins || 1} Total Wins</span>
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-xs">
                            {c.studentCollege || "Engineering Student"}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 text-xs">
                              {c.firstPlaceCount > 0 && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                  🥇 {c.firstPlaceCount}
                                </span>
                              )}
                              {c.secondPlaceCount > 0 && (
                                <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30 font-bold">
                                  🥈 {c.secondPlaceCount}
                                </span>
                              )}
                              {c.thirdPlaceCount > 0 && (
                                <span className="px-2 py-0.5 rounded bg-amber-800/20 text-amber-400 border border-amber-800/30 font-bold">
                                  🥉 {c.thirdPlaceCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-amber-400">
                            ₹{(c.totalPrizeEarned || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 font-mono">
                              {c.score || 100} pts
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              🏆 Winner
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "achievements" ? (
            <div className="space-y-4">
              {filteredAchievements.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <p className="text-sm font-bold text-white">No live achievements recorded yet.</p>
                  <p className="text-xs text-slate-400">Winning teams and podium positions will appear here in real-time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredAchievements.map((ach: any) => (
                    <div
                      key={ach.id}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ach.rank === 1
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : ach.rank === 2
                            ? "bg-slate-500/20 text-slate-300 border-slate-500/30"
                            : "bg-amber-800/20 text-amber-400 border-amber-800/30"
                        }`}>
                          {ach.rankTitle}
                        </span>

                        {ach.prizeShare > 0 && (
                          <span className="text-xs font-mono font-bold text-amber-400">
                            ₹{Number(ach.prizeShare).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-sm">{ach.studentName}</h4>
                        <p className="text-xs text-blue-400">{ach.hackathonTitle}</p>
                        <p className="text-[11px] text-slate-400">Team: <strong>{ach.teamName}</strong></p>
                      </div>

                      {ach.projectTitle && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                          Project: <strong className="text-white">{ach.projectTitle}</strong>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                        <span className="text-slate-500">Verified: {formatDate(ach.createdAt)}</span>
                        {ach.certificateId && (
                          <Link
                            href={`/verify/${ach.certificateId}`}
                            target="_blank"
                            className="text-amber-400 hover:underline flex items-center gap-1 font-mono font-semibold"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>{ach.certificateId}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInternships.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <p className="text-sm font-bold text-white">No verified internship stipend records yet.</p>
                  <p className="text-xs text-slate-400">Completed real-world internship evaluations will be published here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInternships.map((intAch: any) => (
                    <div
                      key={intAch.id}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition space-y-4 shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-black text-white text-sm">{intAch.companyName}</h4>
                            <p className="text-xs text-emerald-400 font-semibold">{intAch.role}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Verified Stipend</span>
                          <span className="text-base font-mono font-black text-emerald-400">
                            ₹{Number(intAch.stipendAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Student: {intAch.studentName}</span>
                          <span className="text-slate-400 font-normal">{intAch.duration || "6 Weeks"}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{intAch.studentCollege || "Engineering College"}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Stipend Verified by SC TECH Admin</span>
                        </div>
                        {intAch.certificateId && (
                          <Link
                            href={`/verify/${intAch.certificateId}`}
                            target="_blank"
                            className="text-slate-400 hover:text-white font-mono text-[10px] flex items-center gap-1"
                          >
                            <span>Cert: {intAch.certificateId}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* BOTTOM 4 FEATURE HIGHLIGHTS STRIP (Matching Screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Card 1: Compete Globally */}
          <div className="p-5 rounded-2xl bg-[#080E1C]/80 border border-slate-800/80 flex items-start gap-3.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Compete Globally</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Showcase your skills on national and international platforms.
              </p>
            </div>
          </div>

          {/* Card 2: Earn Real Rewards */}
          <div className="p-5 rounded-2xl bg-[#080E1C]/80 border border-slate-800/80 flex items-start gap-3.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Earn Real Rewards</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Win prizes, get internship stipends, and gain industry recognition.
              </p>
            </div>
          </div>

          {/* Card 3: Build Your Career */}
          <div className="p-5 rounded-2xl bg-[#080E1C]/80 border border-slate-800/80 flex items-start gap-3.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Build Your Career</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Turn your ideas into real-world opportunities.
              </p>
            </div>
          </div>

          {/* Card 4: Be a Leader */}
          <div className="p-5 rounded-2xl bg-[#080E1C]/80 border border-slate-800/80 flex items-start gap-3.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">Be a Leader</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Get featured in the SC TECH Hall of Fame.
              </p>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
