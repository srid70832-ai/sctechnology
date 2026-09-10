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
  Users
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"champions" | "achievements" | "internships">("champions");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Hero Section */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#0B0F19] border border-amber-500/30 shadow-2xl text-center space-y-4 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30 mx-auto">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>SC TECH Hall of Fame</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Global Student Leaderboard
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
            Recognizing top collegiate innovators, hackathon winners, and students with verified industry internship stipends.
          </p>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Champions</span>
              <span className="text-xl font-black text-white">{data?.totalChampionsCount || champions.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Prize Pool Distributed</span>
              <span className="text-xl font-black text-amber-400">₹{(data?.totalPrizePoolWon || 0).toLocaleString()}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Verified Wins</span>
              <span className="text-xl font-black text-purple-400">{recentAchievements.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Paid Internships</span>
              <span className="text-xl font-black text-emerald-400">{internshipAchievements.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("champions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "champions"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Hackathon Champions ({champions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("achievements")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "achievements"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Achievements ({recentAchievements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("internships")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "internships"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Internship Stipends ({internshipAchievements.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, college..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span>Loading leaderboard...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: Hackathon Champions */}
            {activeTab === "champions" && (
              <div className="space-y-6">
                {/* Top 3 Podium (if >= 3 champions) */}
                {filteredChampions.length >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {/* Rank 2 (Silver) */}
                    {filteredChampions[1] && (
                      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-400/40 shadow-xl space-y-4 text-center order-2 md:order-1">
                        <div className="w-12 h-12 rounded-2xl bg-slate-500/20 text-slate-300 flex items-center justify-center mx-auto border border-slate-500/30">
                          <Medal className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Rank #2</span>
                          <h3 className="text-lg font-black text-white">{filteredChampions[1].studentName}</h3>
                          <p className="text-xs text-slate-400">{filteredChampions[1].studentCollege}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-around text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Score</span>
                            <span className="font-bold text-white">{filteredChampions[1].score} pts</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Prize Won</span>
                            <span className="font-bold text-amber-400">₹{filteredChampions[1].totalPrizeEarned.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rank 1 (Gold - Center) */}
                    {filteredChampions[0] && (
                      <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1E1B4B] to-slate-900 border border-amber-500/50 shadow-2xl space-y-4 text-center order-1 md:order-2 md:-translate-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                          <Crown className="w-8 h-8" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">🏆 Grand Champion #1</span>
                          <h3 className="text-xl font-black text-white">{filteredChampions[0].studentName}</h3>
                          <p className="text-xs text-slate-300">{filteredChampions[0].studentCollege}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex justify-around text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Champion Score</span>
                            <span className="font-black text-amber-400 text-sm">{filteredChampions[0].score} pts</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total Prize Won</span>
                            <span className="font-black text-white text-sm">₹{filteredChampions[0].totalPrizeEarned.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rank 3 (Bronze) */}
                    {filteredChampions[2] && (
                      <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-800/40 shadow-xl space-y-4 text-center order-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-800/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-800/30">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">Rank #3</span>
                          <h3 className="text-lg font-black text-white">{filteredChampions[2].studentName}</h3>
                          <p className="text-xs text-slate-400">{filteredChampions[2].studentCollege}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-around text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Score</span>
                            <span className="font-bold text-white">{filteredChampions[2].score} pts</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Prize Won</span>
                            <span className="font-bold text-amber-400">₹{filteredChampions[2].totalPrizeEarned.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Champions Table */}
                <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-500 font-bold border-b border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Rank</th>
                        <th className="py-4 px-6">Student Innovator</th>
                        <th className="py-4 px-6">College / Institution</th>
                        <th className="py-4 px-6 text-center">Podium Finishes</th>
                        <th className="py-4 px-6 text-right">Total Prize Won</th>
                        <th className="py-4 px-6 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredChampions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No student champions found.
                          </td>
                        </tr>
                      ) : (
                        filteredChampions.map((c: any) => (
                          <tr key={c.studentUid} className="hover:bg-slate-800/30 transition">
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold font-mono text-xs ${
                                c.rank === 1
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : c.rank === 2
                                  ? "bg-slate-500/20 text-slate-300 border border-slate-500/40"
                                  : c.rank === 3
                                  ? "bg-amber-800/20 text-amber-400 border border-amber-800/40"
                                  : "bg-slate-800 text-slate-400"
                              }`}>
                                #{c.rank}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                {c.rank === 1 && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                <span>{c.studentName}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">{c.totalWins} Total Wins</span>
                            </td>
                            <td className="py-4 px-6 text-slate-400">
                              {c.studentCollege || "Engineering Student"}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2 text-xs">
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
                            <td className="py-4 px-6 text-right font-mono font-bold text-amber-400">
                              ₹{c.totalPrizeEarned.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 font-black border border-blue-500/30">
                                {c.score} pts
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Live Achievements */}
            {activeTab === "achievements" && (
              <div className="space-y-4">
                {filteredAchievements.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-500">
                    No verified achievements found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredAchievements.map((ach: any) => (
                      <div
                        key={ach.id}
                        className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition space-y-3 shadow-lg"
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
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
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
            )}

            {/* TAB 3: Internship Stipends */}
            {activeTab === "internships" && (
              <div className="space-y-4">
                {filteredInternships.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-500">
                    No verified internship achievements published yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredInternships.map((intAch: any) => (
                      <div
                        key={intAch.id}
                        className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition space-y-4 shadow-lg"
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

                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
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
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
