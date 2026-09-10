"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Loader2, 
  Calendar, 
  Award,
  Crown,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";

export default function AdminHackathonsResultsIndexPage() {
  const { error } = useToast();
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/admin/hackathons", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setHackathons(data.hackathons || []);
        }
      } catch (err) {
        console.error(err);
        error("Failed to load hackathons");
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, []);

  const filtered = hackathons.filter((h) =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/hackathons"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hackathons Management</span>
        </Link>

        <Link
          href="/leaderboard"
          target="_blank"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
        >
          <span>View Public Leaderboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase">
            Results & Winners Administration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Hackathon Winner Publishing Center</h1>
        <p className="text-xs text-slate-400">
          Select a hackathon below to manage podium winners, generate digital certificates, and publish to the Global Leaderboard.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hackathons..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="p-16 flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span>Loading hackathons...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((h) => (
            <div
              key={h.id}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Prize: ₹{h.prizePool?.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{h.status}</span>
                </div>
                <h3 className="text-lg font-black text-white">{h.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{h.tagLine || h.description}</p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <Link
                  href={`/admin/hackathons/${h.id}/results`}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Manage Results & Winners</span>
                </Link>

                <Link
                  href={`/hackathons/${h.slug || h.id}/results`}
                  target="_blank"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="View Public Results Page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
