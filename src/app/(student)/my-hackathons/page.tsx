"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Trophy, Calendar, CheckCircle2, ArrowRight, Loader2, Code2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function MyHackathonsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch("/api/student/profile");
        if (res.ok) {
          const data = await res.json();
          setHackathons(data.user?.hackathons || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHackathons();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">My Hackathons & Submissions</h1>
              <p className="text-xs text-slate-400">View your active registrations, project repository submissions, and evaluation scores.</p>
            </div>
            <Link
              href="/hackathons"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Browse Hackathons
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading hackathons...</span>
            </div>
          ) : hackathons.length > 0 ? (
            <div className="space-y-4">
              {hackathons.map((reg) => (
                <div key={reg.id} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">{reg.hackathon.title}</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Registration ID: <strong className="font-mono text-blue-400">{reg.registrationNo}</strong>
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 self-start sm:self-auto">
                      CONFIRMED
                    </span>
                  </div>

                  {reg.submission ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Submitted Project:</span>
                        <span className="font-bold text-white">{reg.submission.projectName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">GitHub Repository:</span>
                        <a href={reg.submission.repoUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                          {reg.submission.repoUrl}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs flex justify-between items-center text-slate-300">
                      <span>Project submission is open. Submit your GitHub repository before deadline.</span>
                      <Link
                        href={`/hackathons/${reg.hackathon.slug}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-[11px]"
                      >
                        Submit Project
                      </Link>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 text-xs text-slate-400">
                    <span>Date: {formatDate(reg.hackathon.startDate)} - {formatDate(reg.hackathon.endDate)}</span>
                    <Link href={`/hackathons/${reg.hackathon.slug}`} className="text-blue-400 hover:text-blue-300 font-semibold">
                      Hackathon Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">You haven&apos;t joined a hackathon yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Register for upcoming SC TECH Hackathons to build innovative software, win prizes, and earn verified participation credentials.
              </p>
              <Link href="/hackathons" className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs">
                Explore Hackathons
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
