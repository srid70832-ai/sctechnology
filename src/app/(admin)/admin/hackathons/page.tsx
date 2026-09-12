"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Trophy, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Users, 
  FileCode2, 
  Play, 
  Lock,
  Globe,
  Layers,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { HackathonItem, HackathonRound, formatISTDate } from "@/lib/platform-models";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminHackathonsPage() {
  const { success, error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [availableProblems, setAvailableProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState<HackathonItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    bannerUrl: "",
    shortDescription: "",
    fullDescription: "",
    startDate: "",
    startTime: "09:00 AM",
    endDate: "",
    endTime: "11:59 PM",
    registrationDeadline: "",
    registrationFee: 35,
    maxParticipants: 500,
    registrationMode: "BOTH" as "INDIVIDUAL_ONLY" | "TEAM_ONLY" | "BOTH",
    minTeamSize: 2,
    maxTeamSize: 4,
    prizePool: 50000,
    prizes: "1st Prize: ₹25,000 + Certificate of Excellence\n2nd Prize: ₹15,000 + Certificate of Merit\n3rd Prize: ₹10,000 + Certificate of Merit",
    rules: "1. All code must be written during the hackathon period.\n2. Open source libraries and frameworks are permitted.\n3. Plagiarism results in immediate disqualification.",
    guidelines: "Submit GitHub repo URL and live demo before the deadline.",
    judgingCriteria: "Innovation (25%), Technical Architecture (25%), UI/UX (20%), Practical Impact (30%)",
    contactDetails: "support@sctech.com | +91 80000 00000",
    submissionMethod: "WEBSITE" as HackathonItem["submissionMethod"],
    googleFormUrl: "",
    problemStatementIds: [] as string[],
    rounds: [] as HackathonRound[],
    status: "PUBLISHED" as HackathonItem["status"],
  });

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/hackathons", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || `Server responded with error status ${res.status}`;
        setLoadError(errMsg);
        return;
      }

      const data = await res.json();
      if (!data || !Array.isArray(data.hackathons)) {
        throw new Error("The hackathon API returned an invalid response.");
      }
      setHackathons(data.hackathons);

      // Load problem statements for linking
      try {
        const probRes = await fetch("/api/problem-statements");
        if (probRes.ok) {
          const pData = await probRes.json();
          setAvailableProblems(pData.statements || pData.problemStatements || []);
        }
      } catch (probErr) {
        console.warn("Problem statements fetch notice:", probErr);
      }
    } catch (err: any) {
      console.error("Error loading hackathon data:", err);
      setLoadError(err?.message || "Failed to load hackathon data from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, firebaseUser]);

  const openCreateModal = () => {
    setEditingHackathon(null);
    setFormData({
      title: "",
      bannerUrl: "",
      shortDescription: "",
      fullDescription: "",
      startDate: "",
      startTime: "09:00 AM",
      endDate: "",
      endTime: "11:59 PM",
      registrationDeadline: "",
      registrationFee: 35,
      maxParticipants: 500,
      registrationMode: "BOTH",
      minTeamSize: 2,
      maxTeamSize: 4,
      prizePool: 50000,
      prizes: "1st Prize: ₹25,000 + Certificate of Excellence\n2nd Prize: ₹15,000 + Certificate of Merit\n3rd Prize: ₹10,000 + Certificate of Merit",
      rules: "1. All code must be written during the hackathon period.\n2. Open source libraries and frameworks are permitted.\n3. Plagiarism results in immediate disqualification.",
      guidelines: "Submit GitHub repo URL and live demo before the deadline.",
      judgingCriteria: "Innovation (25%), Technical Architecture (25%), UI/UX (20%), Practical Impact (30%)",
      contactDetails: "support@sctech.com | +91 80000 00000",
      submissionMethod: "WEBSITE",
      googleFormUrl: "",
      problemStatementIds: [],
      rounds: [
        {
          id: `round-1-${Date.now()}`,
          roundNumber: 1,
          name: "Round 1: Ideation & Architecture",
          description: "Submit problem statement selection, initial repository, and architecture design.",
          problemStatementIds: [],
          startDate: "",
          endDate: "",
          submissionDeadline: "",
          maxScore: 100,
          status: "ACTIVE",
          submissionMethod: "WEBSITE",
          evaluationCriteria: "Innovation, Architecture, and Technical Feasibility",
        },
      ],
      status: "PUBLISHED",
    });
    setModalOpen(true);
  };

  const openEditModal = (h: HackathonItem) => {
    setEditingHackathon(h);
    setFormData({
      title: h.title,
      bannerUrl: h.bannerUrl || "",
      shortDescription: h.shortDescription,
      fullDescription: h.fullDescription || h.shortDescription,
      startDate: h.startDate ? h.startDate.split("T")[0] : "",
      startTime: h.startTime || "09:00 AM",
      endDate: h.endDate ? h.endDate.split("T")[0] : "",
      endTime: h.endTime || "11:59 PM",
      registrationDeadline: h.registrationDeadline ? h.registrationDeadline.split("T")[0] : "",
      registrationFee: h.registrationFee,
      maxParticipants: h.maxParticipants,
      registrationMode: h.registrationMode || "BOTH",
      minTeamSize: h.minTeamSize || 2,
      maxTeamSize: h.maxTeamSize || 4,
      prizePool: h.prizePool,
      prizes: Array.isArray(h.prizes) ? h.prizes.join("\n") : "",
      rules: Array.isArray(h.rules) ? h.rules.join("\n") : "",
      guidelines: h.guidelines || "",
      judgingCriteria: h.judgingCriteria || "",
      contactDetails: h.contactDetails || "",
      submissionMethod: h.submissionMethod || "WEBSITE",
      googleFormUrl: h.googleFormUrl || "",
      problemStatementIds: h.problemStatementIds || [],
      rounds: Array.isArray(h.rounds) && h.rounds.length > 0 ? h.rounds : [
        {
          id: `round-1-${Date.now()}`,
          roundNumber: 1,
          name: "Round 1: Ideation & Architecture",
          description: "Submit problem statement selection, initial repository, and architecture design.",
          problemStatementIds: h.problemStatementIds || [],
          startDate: h.startDate ? h.startDate.split("T")[0] : "",
          endDate: h.endDate ? h.endDate.split("T")[0] : "",
          submissionDeadline: h.registrationDeadline ? h.registrationDeadline.split("T")[0] : "",
          maxScore: 100,
          status: "ACTIVE",
          submissionMethod: h.submissionMethod || "WEBSITE",
          evaluationCriteria: "Innovation, Architecture, and Technical Feasibility",
        }
      ],
      status: h.status || "PUBLISHED",
    });
    setModalOpen(true);
  };

  const addRound = () => {
    const nextNum = formData.rounds.length + 1;
    const newRound: HackathonRound = {
      id: `round-${nextNum}-${Date.now()}`,
      roundNumber: nextNum,
      name: `Round ${nextNum}: ${nextNum === 2 ? "Prototype Implementation" : "Grand Finale & Presentation"}`,
      description: `Objectives and requirements for Round ${nextNum}.`,
      problemStatementIds: [],
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      submissionDeadline: formData.endDate || "",
      maxScore: 100,
      status: "UPCOMING",
      submissionMethod: "WEBSITE",
      evaluationCriteria: "Completeness, Code Quality, and Live Working Demo",
    };
    setFormData({
      ...formData,
      rounds: [...formData.rounds, newRound],
    });
  };

  const removeRound = (index: number) => {
    if (formData.rounds.length <= 1) {
      error("A hackathon must have at least one round.");
      return;
    }
    const updated = formData.rounds.filter((_, idx) => idx !== index).map((r, idx) => ({
      ...r,
      roundNumber: idx + 1,
    }));
    setFormData({ ...formData, rounds: updated });
  };

  const updateRound = (index: number, field: keyof HackathonRound, value: any) => {
    const updated = [...formData.rounds];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, rounds: updated });
  };

  const handleSaveHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.shortDescription || !formData.startDate || !formData.endDate || !formData.registrationDeadline) {
      error("Please provide Title, description, start date, end date, and registration deadline.");
      return;
    }

    setSaving(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const hackathonSlug = editingHackathon?.slug || formData.title.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);

      const payload = {
        ...(editingHackathon ? { id: editingHackathon.id } : {}),
        title: formData.title.trim(),
        slug: hackathonSlug,
        bannerUrl: formData.bannerUrl || null,
        shortDescription: formData.shortDescription.trim(),
        fullDescription: formData.fullDescription.trim(),
        startDate: formData.startDate,
        startTime: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,
        registrationDeadline: formData.registrationDeadline,
        registrationFee: Number(formData.registrationFee),
        entryFee: Number(formData.registrationFee),
        maxParticipants: Number(formData.maxParticipants),
        registrationMode: formData.registrationMode,
        minTeamSize: Number(formData.minTeamSize),
        maxTeamSize: Number(formData.maxTeamSize),
        prizePool: Number(formData.prizePool),
        prizes: formData.prizes.split("\n").map((s) => s.trim()).filter(Boolean),
        rules: formData.rules.split("\n").map((s) => s.trim()).filter(Boolean),
        guidelines: formData.guidelines || null,
        judgingCriteria: formData.judgingCriteria || null,
        contactDetails: formData.contactDetails || null,
        submissionMethod: formData.submissionMethod,
        googleFormUrl: formData.googleFormUrl || null,
        problemStatementIds: formData.problemStatementIds,
        rounds: formData.rounds,
        status: formData.status,
      };

      const res = await fetch("/api/admin/hackathons", {
        method: editingHackathon ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to save hackathon (HTTP ${res.status})`);
      }

      success(editingHackathon ? "Hackathon updated successfully!" : "Hackathon launched and saved successfully!");
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("Save hackathon error:", err);
      error(err?.message || "Error saving hackathon");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHackathon = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete hackathon "${title}"?`)) return;

    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch(`/api/admin/hackathons?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete hackathon");
      }

      success("Hackathon deleted successfully.");
      setHackathons((prev) => prev.filter((h) => h.id !== id));
    } catch (err: any) {
      error(err?.message || "Network error");
    }
  };

  const toggleLaunchStatus = async (h: HackathonItem, targetStatus: HackathonItem["status"]) => {
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/hackathons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: h.id,
          title: h.title,
          shortDescription: h.shortDescription,
          startDate: h.startDate,
          endDate: h.endDate,
          registrationDeadline: h.registrationDeadline,
          status: targetStatus,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update status");
      }

      success(`Hackathon is now ${targetStatus}!`);
      setHackathons((prev) => prev.map((item) => (item.id === h.id ? { ...item, status: targetStatus } : item)));
    } catch (err: any) {
      error(err?.message || "Failed to update status");
    }
  };

  const filteredHackathons = hackathons.filter((h) => {
    if (statusFilter !== "ALL" && h.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return h.title.toLowerCase().includes(q) || h.shortDescription.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Hackathon & Challenges Control</span>
          </h1>
          <p className="text-xs text-slate-400">
            Launch competitive hackathons, link multiple problem statements, and set deadline locking.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Hackathon</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hackathons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "PUBLISHED", "ONGOING", "CLOSED", "DRAFT"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Hackathons Grid */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span>Loading hackathons...</span>
        </div>
      ) : loadError ? (
        <div className="py-16 text-center rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Failed to Load Hackathons</h3>
          <p className="text-xs text-rose-300/80 max-w-md mx-auto">{loadError}</p>
          <button
            onClick={loadData}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-xs font-semibold text-rose-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Hackathons Configured</h3>
          <p className="text-xs text-slate-400">Click &quot;Launch New Hackathon&quot; to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHackathons.map((h) => (
            <div
              key={h.id}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Prize Pool: ₹{h.prizePool?.toLocaleString()}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      h.status === "PUBLISHED" || h.status === "ONGOING"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : h.status === "CLOSED"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {h.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">{h.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">
                    {h.shortDescription}
                  </p>
                </div>

                {/* Timeline info */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Reg. Deadline:</span>
                    <strong className="text-amber-400">{formatISTDate(h.registrationDeadline)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Start Date:</span>
                    <span>{formatISTDate(h.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Entry Fee:</span>
                    <strong className="text-emerald-400">₹{h.registrationFee}</strong>
                  </div>
                </div>

                {/* Submission Mode, Problems, Rounds, Mode */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{h.problemStatementIds?.length || 1} Problems</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{h.rounds?.length || 1} {h.rounds?.length === 1 ? "Round" : "Rounds"}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span>
                      {h.registrationMode === "INDIVIDUAL_ONLY"
                        ? "Individual Only"
                        : h.registrationMode === "TEAM_ONLY"
                        ? `Team Only (${h.minTeamSize || 2}-${h.maxTeamSize || 4})`
                        : `Indiv + Team (${h.minTeamSize || 2}-${h.maxTeamSize || 4})`}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-bold text-slate-400 border border-slate-800">
                    {h.submissionMethod || "WEBSITE"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {h.status !== "ONGOING" && (
                      <button
                        onClick={() => toggleLaunchStatus(h, "ONGOING")}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-[10px] font-bold border border-emerald-500/30"
                      >
                        Launch
                      </button>
                    )}
                    {h.status !== "CLOSED" && (
                      <button
                        onClick={() => toggleLaunchStatus(h, "CLOSED")}
                        className="px-2.5 py-1 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-[10px] font-bold border border-rose-500/30"
                      >
                        Close
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/hackathons/${h.id}/results`}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1"
                      title="Manage Podium Winners & Results"
                    >
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>Results</span>
                    </Link>
                    <Link
                      href={`/hackathons/${h.slug || h.id}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => openEditModal(h)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHackathon(h.id, h.title)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT HACKATHON MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>{editingHackathon ? "Edit Hackathon" : "Create New Hackathon"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveHackathon} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Hackathon Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. SC TECH NATIONAL AI HACKATHON 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Banner Image URL</label>
                  <input
                    type="url"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    placeholder="https://.../banner.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Short Description *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Overview of the hackathon theme and engineering goals..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              {/* Dates & Timeline (CRITICAL FOR DEADLINE ENFORCEMENT) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Timeline & Server Deadline Locking
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 text-[10px]">Registration Deadline *</label>
                    <input
                      type="date"
                      required
                      value={formData.registrationDeadline}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-bold text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px]">Hackathon Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px]">Hackathon End Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Entry Fee (₹ INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.registrationFee}
                    onChange={(e) => setFormData({ ...formData, registrationFee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Prize Pool (₹ INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Max Participants</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              {/* Participation & Team Mode */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Registration & Team Mode
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-bold">Registration Mode</label>
                    <select
                      value={formData.registrationMode}
                      onChange={(e) => setFormData({ ...formData, registrationMode: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-semibold"
                    >
                      <option value="BOTH">BOTH (Individual + Team)</option>
                      <option value="INDIVIDUAL_ONLY">Individual Only</option>
                      <option value="TEAM_ONLY">Team Only</option>
                    </select>
                  </div>

                  {formData.registrationMode !== "INDIVIDUAL_ONLY" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[10px] font-bold">Min Team Size</label>
                        <input
                          type="number"
                          min={2}
                          max={10}
                          value={formData.minTeamSize}
                          onChange={(e) => setFormData({ ...formData, minTeamSize: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 text-[10px] font-bold">Max Team Size</label>
                        <input
                          type="number"
                          min={formData.minTeamSize || 2}
                          max={10}
                          value={formData.maxTeamSize}
                          onChange={(e) => setFormData({ ...formData, maxTeamSize: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Hackathon Rounds & Shortlisting Configuration */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hackathon Rounds & Shortlisting Pipeline</span>
                    </span>
                    <p className="text-[10px] text-slate-400">
                      Configure sequential elimination rounds with independent deadlines and problem assignments.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRound}
                    className="px-2.5 py-1 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Add Round</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.rounds.map((round, rIndex) => (
                    <div
                      key={round.id || rIndex}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                            Round {round.roundNumber}
                          </span>
                          <input
                            type="text"
                            value={round.name}
                            onChange={(e) => updateRound(rIndex, "name", e.target.value)}
                            placeholder="Round Name (e.g. Round 1: Ideation)"
                            className="bg-transparent text-white font-bold text-xs focus:outline-none border-b border-slate-700 focus:border-amber-400 px-1 py-0.5 w-64"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={round.status}
                            onChange={(e) => updateRound(rIndex, "status", e.target.value as any)}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="UPCOMING">UPCOMING</option>
                            <option value="EVALUATION">EVALUATION</option>
                            <option value="COMPLETED">COMPLETED</option>
                          </select>
                          {formData.rounds.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRound(rIndex)}
                              className="p-1 rounded-lg hover:bg-rose-900/30 text-rose-400"
                              title="Delete Round"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-400 block mb-0.5">Round Start Date</label>
                          <input
                            type="date"
                            value={round.startDate ? round.startDate.split("T")[0] : ""}
                            onChange={(e) => updateRound(rIndex, "startDate", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-0.5">Round End Date</label>
                          <input
                            type="date"
                            value={round.endDate ? round.endDate.split("T")[0] : ""}
                            onChange={(e) => updateRound(rIndex, "endDate", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-amber-400 font-bold block mb-0.5">Submission Deadline *</label>
                          <input
                            type="date"
                            value={round.submissionDeadline ? round.submissionDeadline.split("T")[0] : ""}
                            onChange={(e) => updateRound(rIndex, "submissionDeadline", e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-400 block mb-0.5">Description & Deliverables</label>
                          <input
                            type="text"
                            value={round.description}
                            onChange={(e) => updateRound(rIndex, "description", e.target.value)}
                            placeholder="e.g. Architecture design, GitHub repo, initial README"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-0.5">Evaluation Criteria / Rubric</label>
                          <input
                            type="text"
                            value={round.evaluationCriteria || ""}
                            onChange={(e) => updateRound(rIndex, "evaluationCriteria", e.target.value)}
                            placeholder="e.g. Innovation (30%), Architecture (30%), Feasibility (40%)"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Mode (Website vs Google Form) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Submission Method</label>
                  <select
                    value={formData.submissionMethod}
                    onChange={(e) => setFormData({ ...formData, submissionMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  >
                    <option value="WEBSITE">OPTION 1: Website Submission (Portal Form)</option>
                    <option value="GOOGLE_FORM">OPTION 2: Google Form</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live for Registration)</option>
                    <option value="ONGOING">ONGOING (Submission Active)</option>
                    <option value="CLOSED">CLOSED (Locked)</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>

                {formData.submissionMethod === "GOOGLE_FORM" && (
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-amber-400 font-bold">Google Form URL *</label>
                    <input
                      type="url"
                      required
                      value={formData.googleFormUrl}
                      onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                      placeholder="https://forms.gle/... or https://docs.google.com/forms/d/..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-slate-100"
                    />
                  </div>
                )}
              </div>

              {/* Multiple Problem Statements Linking */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    Link Problem Statements to this Hackathon
                  </span>
                  <Link
                    href="/admin/problem-statements"
                    target="_blank"
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Create New Challenge +
                  </Link>
                </div>

                {availableProblems.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    No problem statements found. You can create them in the Problem Statements panel.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {availableProblems.map((prob) => {
                      const isSelected = formData.problemStatementIds.includes(prob.id);
                      return (
                        <label
                          key={prob.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition text-[11px] ${
                            isSelected
                              ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  problemStatementIds: [...formData.problemStatementIds, prob.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  problemStatementIds: formData.problemStatementIds.filter((id) => id !== prob.id),
                                });
                              }
                            }}
                            className="rounded accent-indigo-500"
                          />
                          <span className="truncate">{prob.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Rules & Guidelines (One per line)</label>
                <textarea
                  rows={3}
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Prize Breakdown (One per line)</label>
                <textarea
                  rows={2}
                  value={formData.prizes}
                  onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingHackathon ? "Update Hackathon" : "Launch Hackathon"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
