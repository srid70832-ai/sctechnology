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
  ArrowRight,
  GraduationCap,
  FolderGit2,
  FileCheck2,
  Info
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { 
  ENABLE_SAMPLE_PAST_STUDENTS, 
  SAMPLE_PAST_STUDENTS, 
  SamplePastStudent 
} from "@/lib/sample-past-students";
import { FuturisticTrophyVisual } from "@/components/leaderboard/FuturisticTrophyVisual";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"champions" | "achievements" | "internships" | "past-highlights">("champions");
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

  const filteredPastStudents = SAMPLE_PAST_STUDENTS.filter((s: SamplePastStudent) =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.specialization && s.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
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

          {/* Right Column: Balanced Futuristic Visual Anchor with 4 Orbiting Badges */}
          <div className="lg:col-span-6 flex items-center justify-center w-full">
            <FuturisticTrophyVisual />
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

            {ENABLE_SAMPLE_PAST_STUDENTS && (
              <button
                onClick={() => setActiveTab("past-highlights")}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "past-highlights"
                    ? "bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Past Student Highlights ({filteredPastStudents.length})</span>
              </button>
            )}
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
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full text-left text-xs text-slate-300 border-collapse table-auto min-w-[900px]">
                  <thead className="bg-[#050914] text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-4 px-3 w-16 text-center whitespace-nowrap">RANK</th>
                      <th className="py-4 px-4 min-w-[200px] whitespace-nowrap">STUDENT INNOVATOR</th>
                      <th className="py-4 px-4 min-w-[220px] whitespace-nowrap">COLLEGE / INSTITUTION</th>
                      <th className="py-4 px-3 min-w-[130px] text-center whitespace-nowrap">PODIUM FINISHES</th>
                      <th className="py-4 px-4 min-w-[130px] text-right whitespace-nowrap">TOTAL PRIZE WON</th>
                      <th className="py-4 px-3 min-w-[110px] text-center whitespace-nowrap">SCORE</th>
                      <th className="py-4 px-4 min-w-[120px] text-right whitespace-nowrap">BADGES</th>
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
                          <td className="py-3.5 px-3 text-center align-middle w-16">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold font-mono text-xs ${
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
                          <td className="py-3.5 px-4 align-middle">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5 whitespace-nowrap">
                              {c.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              <span>{c.studentName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block">{c.totalWins || 1} Total Wins</span>
                          </td>
                          <td className="py-3.5 px-4 align-middle text-slate-400 text-xs">
                            <div className="max-w-[240px]">
                              <span className="line-clamp-2 leading-tight">{c.studentCollege || "Engineering Student"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center align-middle">
                            <div className="inline-flex items-center justify-center gap-1.5 text-xs whitespace-nowrap">
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
                          <td className="py-3.5 px-4 text-right align-middle font-mono font-bold text-amber-400 whitespace-nowrap">
                            ₹{(c.totalPrizeEarned || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center align-middle">
                            <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 font-mono text-xs whitespace-nowrap min-w-[90px] leading-none">
                              {c.score || 100} pts
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right align-middle">
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap min-w-[105px]">
                              🏆 Winner
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout for Champions (<lg screens) */}
              <div className="lg:hidden space-y-3">
                {filteredChampions.length === 0 ? (
                  <div className="py-16 text-center">
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
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-blue-600 to-purple-600 hover:from-sky-300 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(56,189,248,0.4)] transition"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Explore Hackathons →</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredChampions.map((c: any) => (
                    <div
                      key={c.studentUid || c.id}
                      className="p-4 rounded-2xl bg-[#090F20]/90 border border-slate-800 space-y-3 shadow-lg w-full overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold font-mono text-xs shrink-0 ${
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
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
                              {c.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              <span className="truncate">{c.studentName}</span>
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">{c.totalWins || 1} Total Wins</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 font-mono font-black text-xs shrink-0 whitespace-nowrap min-w-[76px]">
                          {c.score || 100} pts
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 min-w-0">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-[11px] text-slate-300">{c.studentCollege || "Engineering Student"}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
                        <span className="font-mono font-bold text-amber-400">
                          ₹{(c.totalPrizeEarned || 0).toLocaleString()} Won
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          🏆 Winner
                        </span>
                      </div>
                    </div>
                  ))
                )}
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
          ) : activeTab === "past-highlights" ? (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-[#0A1020]/90 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_0_25px_rgba(6,182,212,0.12)]">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-white tracking-wide">
                        Past Student Highlights
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        Featured Achievers
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Recognizing top student innovators, hackathon podium winners, and technical milestones across premier institutions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-3 py-1.5 rounded-xl border border-cyan-800/60">
                    {filteredPastStudents.length} Highlights
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full text-left text-xs text-slate-300 border-collapse table-auto min-w-[950px]">
                  <thead className="bg-[#050914] text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-4 px-3 w-16 text-center whitespace-nowrap">RANK</th>
                      <th className="py-4 px-4 min-w-[210px] whitespace-nowrap">STUDENT INNOVATOR</th>
                      <th className="py-4 px-4 min-w-[220px] whitespace-nowrap">COLLEGE / INSTITUTION</th>
                      <th className="py-4 px-3 min-w-[130px] text-center whitespace-nowrap">HACKATHON WINS</th>
                      <th className="py-4 px-3 min-w-[120px] text-center whitespace-nowrap">PROJECTS</th>
                      <th className="py-4 px-3 min-w-[120px] text-center whitespace-nowrap">CERTIFICATES</th>
                      <th className="py-4 px-3 min-w-[110px] text-center whitespace-nowrap">SCORE</th>
                      <th className="py-4 px-4 min-w-[120px] text-right whitespace-nowrap">ACHIEVEMENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPastStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No student records match your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredPastStudents.map((student, idx) => (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-800/40 hover:border-cyan-500/20 transition-all duration-200 group"
                          style={{
                            animation: `fadeInUp 0.3s ease-out forwards ${idx * 25}ms`
                          }}
                        >
                          {/* Rank Column */}
                          <td className="py-3.5 px-3 text-center align-middle w-16">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black font-mono text-xs shadow-sm ${
                              student.rank === 1
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                                : student.rank === 2
                                ? "bg-slate-400/20 text-slate-200 border border-slate-400/50 shadow-[0_0_12px_rgba(226,232,240,0.2)]"
                                : student.rank === 3
                                ? "bg-amber-800/20 text-amber-400 border border-amber-800/50 shadow-[0_0_12px_rgba(180,83,9,0.2)]"
                                : student.rank <= 10
                                ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                                : "bg-slate-800/80 text-slate-400 border border-slate-700/50"
                            }`}>
                              #{student.rank}
                            </span>
                          </td>

                          {/* Student Name */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-200 font-bold text-xs shrink-0">
                                {student.studentName.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white text-sm flex items-center gap-1.5 whitespace-nowrap group-hover:text-cyan-300 transition-colors">
                                  {student.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                  <span>{student.studentName}</span>
                                </div>
                                {student.specialization && (
                                  <span className="text-[10px] text-slate-400 block font-medium truncate max-w-[180px]">
                                    {student.specialization}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* College */}
                          <td className="py-3.5 px-4 align-middle text-slate-300 text-xs font-medium">
                            <div className="flex items-center gap-2 max-w-[240px]">
                              <GraduationCap className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="line-clamp-2 leading-tight">{student.college}</span>
                            </div>
                          </td>

                          {/* Hackathon Wins */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 text-xs whitespace-nowrap min-w-[95px]">
                              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{student.hackathonWins} {student.hackathonWins === 1 ? "Win" : "Wins"}</span>
                            </span>
                          </td>

                          {/* Projects Completed */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30 text-xs font-mono whitespace-nowrap min-w-[100px]">
                              <FolderGit2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span>{student.projectsCompleted} Projects</span>
                            </span>
                          </td>

                          {/* Certificates */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30 text-xs font-mono whitespace-nowrap min-w-[95px]">
                              <FileCheck2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>{student.certificates} Certs</span>
                            </span>
                          </td>

                          {/* Score */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-black border border-cyan-500/40 font-mono text-xs whitespace-nowrap min-w-[90px] shadow-[0_0_10px_rgba(6,182,212,0.15)] leading-none">
                              {student.score} pts
                            </span>
                          </td>

                          {/* Achievement */}
                          <td className="py-3.5 px-4 text-right align-middle">
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap min-w-[105px]">
                              🏆 Achiever
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout (<lg screens) */}
              <div className="lg:hidden space-y-3">
                {filteredPastStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No student records match your search query.
                  </div>
                ) : (
                  filteredPastStudents.map((student, idx) => (
                    <div
                      key={student.id}
                      className="p-4 rounded-2xl bg-[#090F20]/90 border border-slate-800/90 hover:border-cyan-500/40 transition space-y-3 shadow-lg w-full overflow-hidden"
                      style={{
                        animation: `fadeInUp 0.3s ease-out forwards ${idx * 25}ms`
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black font-mono text-xs shrink-0 ${
                            student.rank === 1
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                              : student.rank === 2
                              ? "bg-slate-400/20 text-slate-200 border border-slate-400/50"
                              : student.rank === 3
                              ? "bg-amber-800/20 text-amber-400 border border-amber-800/50"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            #{student.rank}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
                              {student.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              <span className="truncate">{student.studentName}</span>
                            </h4>
                            {student.specialization && (
                              <p className="text-[10px] text-cyan-400 font-medium truncate">
                                {student.specialization}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-black border border-cyan-500/40 font-mono text-xs shrink-0 whitespace-nowrap min-w-[76px]">
                          {student.score} pts
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 min-w-0">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-[11px] text-slate-300">{student.college}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
                        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">WINS</span>
                          <span className="text-xs font-bold text-amber-300">{student.hackathonWins}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">PROJECTS</span>
                          <span className="text-xs font-bold text-blue-300 font-mono">{student.projectsCompleted}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">CERTS</span>
                          <span className="text-xs font-bold text-purple-300 font-mono">{student.certificates}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Verified Achievement</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                          🏆 Achiever
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
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

        {/* DEDICATED PAST STUDENT HIGHLIGHTS SHOWCASE SECTION */}
        {ENABLE_SAMPLE_PAST_STUDENTS && (
          <section className="space-y-6 pt-4" id="past-student-highlights">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Past Student Highlights
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Top performing student innovators, hackathon champions, and technical project milestones.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab("past-highlights");
                    window.scrollTo({ top: 380, behavior: "smooth" });
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition flex items-center gap-2 shrink-0"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>View All Highlights in Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Top 3 Podium Spotlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SAMPLE_PAST_STUDENTS.slice(0, 3).map((std) => (
                <div
                  key={std.id}
                  className={`p-6 rounded-3xl bg-gradient-to-b from-[#0B132B]/90 to-[#070A14]/90 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden flex flex-col justify-between ${
                    std.rank === 1
                      ? "border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                      : std.rank === 2
                      ? "border-slate-400/40 shadow-[0_0_25px_rgba(226,232,240,0.1)]"
                      : "border-amber-800/40 shadow-[0_0_25px_rgba(180,83,9,0.1)]"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black font-mono text-sm ${
                          std.rank === 1
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : std.rank === 2
                            ? "bg-slate-400/20 text-slate-200 border border-slate-400/40"
                            : "bg-amber-800/20 text-amber-400 border border-amber-800/40"
                        }`}>
                          #{std.rank}
                        </span>
                        {std.rank === 1 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" /> Rank 1 Champion
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold">
                        Top Performer
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white">{std.studentName}</h3>
                      <p className="text-xs text-cyan-400 font-medium">{std.specialization}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{std.college}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#060914] border border-slate-800/80 text-center">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">WINS</span>
                        <span className="text-sm font-black text-amber-300">{std.hackathonWins}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">PROJECTS</span>
                        <span className="text-sm font-black text-blue-300 font-mono">{std.projectsCompleted}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">CERTS</span>
                        <span className="text-sm font-black text-purple-300 font-mono">{std.certificates}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">Leaderboard Score</span>
                    <span className="text-sm font-mono font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                      {std.score} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
