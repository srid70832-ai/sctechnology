"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Briefcase, 
  ArrowLeft, 
  Save, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Users, 
  X,
  Building,
  Layers,
  Check
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase";
import { formatINR } from "@/lib/utils";
import { PopularInternships } from "@/components/landing/PopularInternships";

export default function AdminFeaturedOpportunitiesPage() {
  const { success, error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [hackathons, setHackathons] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);

  const [selectedHackathonId, setSelectedHackathonId] = useState<string>("");
  const [selectedInternshipId1, setSelectedInternshipId1] = useState<string>("");
  const [selectedInternshipId2, setSelectedInternshipId2] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/site-settings/homepage", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHackathons(data.hackathons || []);
        setInternships(data.internships || []);
        if (data.settings) {
          setSelectedHackathonId(data.settings.featuredHackathonId || "");
          setSelectedInternshipId1(data.settings.featuredInternshipId1 || "");
          setSelectedInternshipId2(data.settings.featuredInternshipId2 || "");
          setLastUpdated(data.settings.updatedAt || null);
        }
      } else {
        error("Failed to load featured opportunities configuration.");
      }
    } catch {
      error("Network error loading featured opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/site-settings/homepage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          featuredHackathonId: selectedHackathonId || null,
          featuredInternshipId1: selectedInternshipId1 || null,
          featuredInternshipId2: selectedInternshipId2 || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success("Featured homepage opportunities updated successfully!");
        setLastUpdated(data.settings?.updatedAt || new Date().toISOString());
      } else {
        error(data.error || "Failed to update featured opportunities.");
      }
    } catch {
      error("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  // Resolve preview items
  const currentHackathon = hackathons.find((h) => h.id === selectedHackathonId) || null;
  const currentInternship1 = internships.find((i) => i.id === selectedInternshipId1) || null;
  const currentInternship2 = internships.find((i) => i.id === selectedInternshipId2) || null;

  const previewInternships = [
    ...(currentInternship1
      ? [
          {
            id: currentInternship1.id,
            title: currentInternship1.title,
            role: currentInternship1.role,
            slug: currentInternship1.slug,
            companyName: currentInternship1.companyName,
            companyLogoUrl: currentInternship1.companyLogoUrl,
            location: currentInternship1.location,
            mode: currentInternship1.mode,
            duration: currentInternship1.duration,
            stipend: currentInternship1.stipend,
          },
        ]
      : []),
    ...(currentInternship2
      ? [
          {
            id: currentInternship2.id,
            title: currentInternship2.title,
            role: currentInternship2.role,
            slug: currentInternship2.slug,
            companyName: currentInternship2.companyName,
            companyLogoUrl: currentInternship2.companyLogoUrl,
            location: currentInternship2.location,
            mode: currentInternship2.mode,
            duration: currentInternship2.duration,
            stipend: currentInternship2.stipend,
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060A12] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading Homepage Opportunities Config...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                HOMEPAGE CURATION
              </span>
              {lastUpdated && (
                <span className="text-[11px] text-slate-500">
                  Last updated: {new Date(lastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <span>Featured Homepage Opportunities</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Select the exact real published hackathon and 2 internships showcased on the public SC TECH homepage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Preview Homepage</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Featured Opportunities</span>
          </button>
        </div>
      </div>

      {/* Grid: 3 Main Curated Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. FEATURED HACKATHON CARD */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-purple-500/30 hover:border-purple-500/50 transition-all shadow-xl space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Featured Hackathon</h3>
                  <span className="text-[10px] text-purple-300">Right Homepage Card</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                1 Slot
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Published Hackathon
              </label>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="w-full bg-[#091021] border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
              >
                <option value="">-- Select a Hackathon (or latest published) --</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title} {h.prizePool ? `(Prize: ₹${h.prizePool.toLocaleString()})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Hackathon Preview Details */}
            {currentHackathon ? (
              <div className="p-4 rounded-2xl bg-[#091024] border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white text-sm">{currentHackathon.title}</div>
                <div className="text-[11px] text-purple-300 italic">{currentHackathon.tagLine}</div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Entry Fee:</span>
                    <span className="font-semibold text-emerald-400">
                      {currentHackathon.entryFee > 0 ? `₹${currentHackathon.entryFee}` : "Free Entry"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prize Pool:</span>
                    <span className="font-semibold text-cyan-400">
                      ₹{currentHackathon.prizePool?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Participants:</span>
                    <span className="font-semibold text-white">{currentHackathon.participantsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status:</span>
                    <span className="font-semibold text-blue-400">{currentHackathon.status}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#091024]/50 border border-dashed border-slate-800 text-center py-6 text-xs text-slate-500">
                No specific hackathon selected. The platform will automatically feature the latest published hackathon.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Available published: {hackathons.length}</span>
            <Link href="/admin/hackathons" className="text-purple-400 hover:underline">
              Manage Hackathons →
            </Link>
          </div>
        </div>

        {/* 2. FEATURED INTERNSHIP #1 */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-blue-500/30 hover:border-blue-500/50 transition-all shadow-xl space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Featured Internship #1</h3>
                  <span className="text-[10px] text-blue-300">Left Card #1</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                Slot 1
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Published Internship
              </label>
              <select
                value={selectedInternshipId1}
                onChange={(e) => setSelectedInternshipId1(e.target.value)}
                className="w-full bg-[#091021] border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
              >
                <option value="">-- Select Internship (or first published) --</option>
                {internships.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title} — {i.companyName} {i.stipend ? `(${i.stipend})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Internship 1 Preview */}
            {currentInternship1 ? (
              <div className="p-4 rounded-2xl bg-[#091024] border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white text-sm">{currentInternship1.title}</div>
                <div className="text-[11px] text-blue-300 flex items-center gap-1.5">
                  <Building className="w-3 h-3" />
                  <span>{currentInternship1.companyName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Stipend:</span>
                    <span className="font-semibold text-emerald-400">{currentInternship1.stipend || "Stipend"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Duration:</span>
                    <span className="font-semibold text-white">{currentInternship1.duration || "6 Weeks"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mode:</span>
                    <span className="font-semibold text-cyan-400">{currentInternship1.mode || "Remote"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location:</span>
                    <span className="font-semibold text-slate-300">{currentInternship1.location || "Remote"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#091024]/50 border border-dashed border-slate-800 text-center py-6 text-xs text-slate-500">
                No specific internship selected. The platform will automatically feature the first published active internship.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Available published: {internships.length}</span>
            <Link href="/admin/internships" className="text-blue-400 hover:underline">
              Manage Internships →
            </Link>
          </div>
        </div>

        {/* 3. FEATURED INTERNSHIP #2 */}
        <div className="p-6 rounded-3xl bg-slate-900/70 border border-cyan-500/30 hover:border-cyan-500/50 transition-all shadow-xl space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Featured Internship #2</h3>
                  <span className="text-[10px] text-cyan-300">Left Card #2</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                Slot 2
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Published Internship
              </label>
              <select
                value={selectedInternshipId2}
                onChange={(e) => setSelectedInternshipId2(e.target.value)}
                className="w-full bg-[#091021] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
              >
                <option value="">-- Select Internship (or second published) --</option>
                {internships.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title} — {i.companyName} {i.stipend ? `(${i.stipend})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Internship 2 Preview */}
            {currentInternship2 ? (
              <div className="p-4 rounded-2xl bg-[#091024] border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white text-sm">{currentInternship2.title}</div>
                <div className="text-[11px] text-cyan-300 flex items-center gap-1.5">
                  <Building className="w-3 h-3" />
                  <span>{currentInternship2.companyName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Stipend:</span>
                    <span className="font-semibold text-emerald-400">{currentInternship2.stipend || "Stipend"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Duration:</span>
                    <span className="font-semibold text-white">{currentInternship2.duration || "6 Weeks"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mode:</span>
                    <span className="font-semibold text-cyan-400">{currentInternship2.mode || "Remote"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location:</span>
                    <span className="font-semibold text-slate-300">{currentInternship2.location || "Remote"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#091024]/50 border border-dashed border-slate-800 text-center py-6 text-xs text-slate-500">
                No specific internship selected. The platform will automatically feature the second published active internship.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Available published: {internships.length}</span>
            <Link href="/admin/internships" className="text-cyan-400 hover:underline">
              Manage Internships →
            </Link>
          </div>
        </div>

      </div>

      {/* Save Action Bar */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Live Synchronized Curation</div>
            <div className="text-xs text-slate-400">
              Saving updates Firestore in real-time. Students visiting the homepage immediately see your selected opportunities.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setPreviewOpen(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Preview</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none px-7 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Featured Opportunities</span>
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-6xl bg-[#070B14] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-bold text-white">Live Public Homepage Preview</h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <PopularInternships
                internships={previewInternships}
                upcomingHackathon={currentHackathon}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
