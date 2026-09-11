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
  ArrowLeft, 
  CheckCircle2, 
  FileCode2, 
  ExternalLink, 
  Users, 
  Share2, 
  ShieldCheck, 
  Loader2,
  Calendar,
  Lock
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { formatINR, formatDate } from "@/lib/utils";

export default function HackathonResultsPage({ params }: { params: { id: string } }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/hackathons/${params.id}/results`);
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error("Fetch results error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [params.id]);

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      success("Results link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span>Loading official results...</span>
      </div>
    );
  }

  const hackathon = data?.hackathon;
  const results = data?.results;
  const hasResults = data?.hasResults;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Navigation & Share */}
        <div className="flex items-center justify-between">
          <Link
            href={`/hackathons/${params.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hackathon</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/leaderboard"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-purple-300 hover:text-white transition flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Global Leaderboard</span>
            </Link>
            <button
              onClick={copyShareLink}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Results</span>
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#1E1B4B] via-[#0F172A] to-[#0B0F19] border border-amber-500/30 shadow-2xl text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Trophy className="w-64 h-64 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30 mx-auto">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Official Hackathon Results</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {hackathon?.title || "Hackathon Winners"}
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            {hasResults
              ? `Official verified winners announced on ${formatDate(results?.publishedAt || new Date())}. Total prize pool distributed: ₹${(results?.totalPrizeDistributed || hackathon?.prizePool || 50000).toLocaleString()}.`
              : "Submissions for this hackathon are currently undergoing official jury evaluation. Check back soon for winner announcements!"}
          </p>

          {results?.announcementNotes && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 text-left leading-relaxed">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Jury & Organizer Remarks:
              </span>
              {results.announcementNotes}
            </div>
          )}
        </div>

        {/* Results Section */}
        {hasResults && Array.isArray(results?.winners) && results.winners.length > 0 ? (
          <div className="space-y-8">
            {/* Winners Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.winners.slice(0, 3).map((w: any) => {
                const isFirst = w.rank === 1;
                const isSecond = w.rank === 2;
                const isThird = w.rank === 3;

                const borderColor = isFirst
                  ? "border-amber-500/50 shadow-amber-500/10"
                  : isSecond
                  ? "border-slate-400/40 shadow-slate-400/10"
                  : "border-amber-700/40 shadow-amber-700/10";

                const badgeBg = isFirst
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : isSecond
                  ? "bg-slate-500/20 text-slate-300 border-slate-500/30"
                  : "bg-amber-800/20 text-amber-400 border-amber-800/30";

                return (
                  <div
                    key={w.teamId || w.rank}
                    className={`p-6 sm:p-8 rounded-3xl bg-slate-900/90 border shadow-2xl space-y-6 flex flex-col justify-between ${borderColor} ${
                      isFirst ? "md:-translate-y-3 bg-gradient-to-b from-[#1E1B4B]/80 to-slate-900/90" : ""
                    }`}
                  >
                    {/* Header */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeBg} flex items-center gap-1.5`}>
                          {isFirst && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                          {isSecond && <Medal className="w-3.5 h-3.5 text-slate-300" />}
                          {isThird && <Award className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{w.rankTitle || `${w.rank} Place`}</span>
                        </span>

                        <span className="text-sm font-mono font-black text-white bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                          ₹{Number(w.prizeAmount).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white">{w.teamName}</h3>
                        <p className="text-xs text-blue-400 font-mono">Team Code: {w.teamCode || w.teamId}</p>
                      </div>

                      {/* Project Showcase */}
                      {w.projectTitle && (
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>{w.projectTitle}</span>
                          </div>
                          {w.projectDescription && (
                            <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                              {w.projectDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            {w.repoUrl && (
                              <a
                                href={w.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <FileCode2 className="w-3 h-3" />
                                <span>Code</span>
                              </a>
                            )}
                            {w.liveUrl && (
                              <a
                                href={w.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Live App</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Members & Certificates */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          <span>Winning Team Members</span>
                        </span>
                        <span>{w.members?.length || 0} Members</span>
                      </div>

                      <div className="space-y-2">
                        {w.members?.map((m: any, idx: number) => (
                          <div
                            key={m.userId || idx}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {m.role === "LEADER" && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                                <span>{m.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                {m.college || "Engineering Student"}
                              </span>
                            </div>

                            {m.certificateId && (
                              <Link
                                href={`/verify/${m.certificateId}`}
                                target="_blank"
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold transition flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>Verify Cert</span>
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Special Mentions (if any) */}
            {results.winners.length > 3 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Special Recognitions & Honorable Mentions</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {results.winners.slice(3).map((w: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {w.rankTitle}
                        </span>
                        {w.prizeAmount > 0 && (
                          <span className="text-xs font-mono font-bold text-white">
                            ₹{Number(w.prizeAmount).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-white text-sm">{w.teamName}</div>
                      {w.projectTitle && <p className="text-xs text-blue-400">Project: {w.projectTitle}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Results Pending Jury Publication</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              The project submissions for <strong>{hackathon?.title}</strong> are currently being reviewed and scored across architecture, innovation, and implementation. Winners will be officially published here with verified digital certificates.
            </p>
            <Link
              href="/hackathons"
              className="inline-flex px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
            >
              Explore Other Hackathons
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
