"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  ArrowLeft, 
  Save, 
  Send, 
  CheckCircle2, 
  Users, 
  FileCode2, 
  ShieldCheck, 
  Loader2, 
  Plus, 
  Trash2,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase";

export default function AdminHackathonResultsPage({ params }: { params: { id: string } }) {
  const { success, error } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hackathon, setHackathon] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [soloRegistrations, setSoloRegistrations] = useState<any[]>([]);
  const [announcementNotes, setAnnouncementNotes] = useState("");

  // Podium Winners Form
  const [winners, setWinners] = useState<any[]>([
    {
      rank: 1,
      rankTitle: "Champion / 1st Place",
      teamId: "",
      teamCode: "",
      teamName: "",
      leaderId: "",
      leaderName: "",
      members: [],
      prizeAmount: 25000,
      projectTitle: "",
      projectDescription: "",
      repoUrl: "",
      liveUrl: "",
    },
    {
      rank: 2,
      rankTitle: "1st Runner Up / 2nd Place",
      teamId: "",
      teamCode: "",
      teamName: "",
      leaderId: "",
      leaderName: "",
      members: [],
      prizeAmount: 15000,
      projectTitle: "",
      projectDescription: "",
      repoUrl: "",
      liveUrl: "",
    },
    {
      rank: 3,
      rankTitle: "2nd Runner Up / 3rd Place",
      teamId: "",
      teamCode: "",
      teamName: "",
      leaderId: "",
      leaderName: "",
      members: [],
      prizeAmount: 10000,
      projectTitle: "",
      projectDescription: "",
      repoUrl: "",
      liveUrl: "",
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/hackathons/${params.id}/results`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setHackathon(data.hackathon);
        setTeams(data.teams || []);
        setSoloRegistrations(data.soloRegistrations || []);

        if (data.existingResults?.winners && data.existingResults.winners.length > 0) {
          setWinners(data.existingResults.winners);
          setAnnouncementNotes(data.existingResults.announcementNotes || "");
        }
      } else {
        error("Failed to load hackathon data");
      }
    } catch (err) {
      console.error(err);
      error("Error loading hackathon results portal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleSelectTeamForRank = (index: number, selectedTeamId: string) => {
    const updated = [...winners];
    if (!selectedTeamId) {
      updated[index] = {
        ...updated[index],
        teamId: "",
        teamCode: "",
        teamName: "",
        leaderId: "",
        leaderName: "",
        members: [],
        projectTitle: "",
        projectDescription: "",
        repoUrl: "",
        liveUrl: "",
      };
      setWinners(updated);
      return;
    }

    const team = teams.find((t) => t.id === selectedTeamId || t.teamId === selectedTeamId);
    if (team) {
      updated[index] = {
        ...updated[index],
        teamId: team.id,
        teamCode: team.teamId,
        teamName: team.name,
        leaderId: team.leaderId,
        leaderName: team.leaderName,
        members: team.members || [],
        projectTitle: team.submission?.projectName || "",
        projectDescription: team.submission?.description || "",
        repoUrl: team.submission?.repoUrl || "",
        liveUrl: team.submission?.liveUrl || "",
      };
      setWinners(updated);
    }
  };

  const updateWinnerField = (index: number, field: string, value: any) => {
    const updated = [...winners];
    updated[index] = { ...updated[index], [field]: value };
    setWinners(updated);
  };

  const handleSaveOrPublish = async (isPublish: boolean) => {
    // Validate that at least 1st place is chosen
    if (!winners[0]?.teamName?.trim()) {
      error("Please select at least the 1st Place winning team.");
      return;
    }

    const validWinners = winners.filter((w) => w.teamName?.trim());

    if (isPublish) {
      if (!confirm(`Are you sure you want to PUBLISH official results for "${hackathon.title}"? This will immediately issue verified Winner Certificates and publish student achievements to the Global Leaderboard.`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/hackathons/${params.id}/results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          winners: validWinners,
          announcementNotes,
          isPublish,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message || (isPublish ? "Results published successfully!" : "Draft saved successfully."));
        loadData();
      } else {
        error(data.error || "Failed to save results");
      }
    } catch {
      error("Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading result management portal...</span>
      </div>
    );
  }

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveOrPublish(false)}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={() => handleSaveOrPublish(true)}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? "Publishing..." : "Publish Official Results"}</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-blue-500/30 shadow-2xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 uppercase">
            Winner Publishing Portal
          </span>
          <span className="text-xs text-slate-400 font-mono">Prize Pool: ₹{hackathon?.prizePool?.toLocaleString()}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{hackathon?.title}</h1>
        <p className="text-xs text-slate-400">
          Select winning teams directly from the {teams.length} registered teams. When published, certificates are generated automatically for all team members.
        </p>
      </div>

      {/* Organizer Notes */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Jury & Organizer Remarks (Public Announcement Statement)
        </label>
        <textarea
          rows={3}
          value={announcementNotes}
          onChange={(e) => setAnnouncementNotes(e.target.value)}
          placeholder="Congratulations to all participants! We witnessed exceptional technical architecture, AI integrations, and problem-solving..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Podium Cards Config */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Select Official Winners (1st, 2nd, 3rd Place)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Array.isArray(winners) ? winners : []).slice(0, 3).map((w, index) => {
            const isFirst = w.rank === 1;
            const isSecond = w.rank === 2;
            const isThird = w.rank === 3;

            return (
              <div
                key={w.rank}
                className={`p-6 rounded-3xl bg-slate-900 border shadow-xl space-y-4 ${
                  isFirst
                    ? "border-amber-500/50 bg-gradient-to-b from-[#1E1B4B]/80 to-slate-900"
                    : isSecond
                    ? "border-slate-400/40"
                    : "border-amber-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isFirst && <Crown className="w-4 h-4 text-amber-400" />}
                    {isSecond && <Medal className="w-4 h-4 text-slate-300" />}
                    {isThird && <Award className="w-4 h-4 text-amber-600" />}
                    <span className="text-xs font-black text-white">{w.rankTitle}</span>
                  </div>
                </div>

                {/* Team Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Select Registered Team *
                  </label>
                  <select
                    value={w.teamId}
                    onChange={(e) => handleSelectTeamForRank(index, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.teamId}) - {t.members?.length || 1} Members
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prize Amount */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Prize Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={w.prizeAmount}
                    onChange={(e) => updateWinnerField(index, "prizeAmount", Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Project Details */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={w.projectTitle}
                    onChange={(e) => updateWinnerField(index, "projectTitle", e.target.value)}
                    placeholder="Project Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    GitHub Repo URL
                  </label>
                  <input
                    type="url"
                    value={w.repoUrl}
                    onChange={(e) => updateWinnerField(index, "repoUrl", e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Auto-Loaded Members */}
                {w.members?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Team Members ({w.members.length}):
                    </span>
                    {w.members.map((m: any, mIdx: number) => (
                      <div key={m.userId || mIdx} className="p-2 rounded-lg bg-slate-950 text-[11px] text-slate-300 flex justify-between">
                        <span>{m.name} {m.role === "LEADER" ? "(Leader)" : ""}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{m.college || "Student"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
