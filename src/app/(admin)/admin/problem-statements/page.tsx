"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  ProblemStatement, 
  getAllProblemStatementsAdmin, 
  saveProblemStatement, 
  updateProblemStatus, 
  deleteProblemStatement,
  DEFAULT_EVALUATION_CRITERIA,
  EvaluationCriterion
} from "@/lib/problem-statements";
import { 
  FileCode2, 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Eye, 
  Edit3, 
  Trash2, 
  Users, 
  Layers, 
  Globe, 
  Loader2,
  ExternalLink,
  ShieldCheck,
  Send,
  Calendar,
  Wand2,
  RefreshCw,
  Trophy,
  Sliders,
  Check,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { formatISTDate } from "@/lib/platform-models";
import { auth } from "@/lib/firebase";

export default function AdminProblemStatementsPage() {
  const { user, firebaseUser } = useAuth();
  const { success, error, toast } = useToast();

  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [hackathons, setHackathons] = useState<{ id: string; title: string; slug?: string }[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Gemini AI Generator Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiMode, setAiMode] = useState<"CREATE" | "ENHANCE">("CREATE");
  const [aiForm, setAiForm] = useState({
    topic: "AI-Powered Smart Healthcare Diagnostics & Rural Triage",
    domain: "Healthcare & AI",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
    targetUsers: "Rural clinic doctors, health workers, and citizens",
    constraints: "Low-latency offline processing with sync to cloud backend",
    customPrompt: "Focus on automated image triage and emergency SMS dispatch.",
    enhanceAction: "ENHANCE" as "ENHANCE" | "REWRITE" | "ADD_CONSTRAINTS" | "ADD_EVALUATION" | "CREATE_VARIATIONS",
    enhanceInstructions: "Improve technical depth, add realistic latency benchmarks and edge test cases.",
  });

  // Editor Modal State
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Partial<ProblemStatement> | null>(null);
  const [savingProblem, setSavingProblem] = useState(false);

  // Diff / Preview Modal State for AI Enhancement
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [enhancedDiff, setEnhancedDiff] = useState<{ original: any; enhanced: any } | null>(null);

  // Load Hackathons for Selector
  const loadHackathons = async () => {
    try {
      const res = await fetch("/api/hackathons");
      if (res.ok) {
        const data = await res.json();
        setHackathons(data.hackathons || []);
      }
    } catch (err) {
      console.warn("Failed to load hackathons list:", err);
    }
  };

  // Load Problem Statements
  const loadProblems = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await auth.currentUser?.getIdToken() || await firebaseUser?.getIdToken();
      const list = await getAllProblemStatementsAdmin(
        statusFilter, 
        selectedHackathonId === "ALL" ? undefined : selectedHackathonId, 
        token
      );
      setProblems(list);
    } catch (err) {
      console.error("Error loading problem statements:", err);
      setProblems([]);
      setLoadError(err instanceof Error ? err.message : "Unable to load problem statements");
      error("Failed to load problem statements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  useEffect(() => {
    loadProblems();
  }, [statusFilter, selectedHackathonId, firebaseUser]);

  // Status Change Handler
  const handleStatusChange = async (
    id: string, 
    newStatus: ProblemStatement["status"], 
    scheduledReleaseAt?: string | null
  ) => {
    const currentUid = auth.currentUser?.uid || firebaseUser?.uid;
    if (!currentUid) {
      error("Authentication required");
      return;
    }
    setProcessingId(id);
    try {
      const token = await auth.currentUser?.getIdToken() || await firebaseUser?.getIdToken();
      const ok = await updateProblemStatus(id, newStatus, currentUid, token, scheduledReleaseAt);
      if (ok) {
        success(`Problem statement status updated to ${newStatus}`);
        await loadProblems();
      } else {
        error("Status update failed");
      }
    } catch {
      error("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this problem statement?")) return;
    const currentUid = auth.currentUser?.uid || firebaseUser?.uid;
    if (!currentUid) return;
    try {
      const token = await auth.currentUser?.getIdToken() || await firebaseUser?.getIdToken();
      const ok = await deleteProblemStatement(id, currentUid, token);
      if (ok) {
        setProblems(problems.filter((p) => p.id !== id));
        success("Problem statement deleted successfully");
      }
    } catch {
      error("Failed to delete problem statement");
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const targetHackathon = hackathons.find((h) => h.id === selectedHackathonId);
    setEditingProblem({
      title: "",
      problemCode: `PS-0${problems.filter((p) => selectedHackathonId === "ALL" || p.hackathonId === selectedHackathonId).length + 1}`,
      hackathonId: selectedHackathonId !== "ALL" ? selectedHackathonId : (hackathons[0]?.id || null),
      hackathonTitle: targetHackathon?.title || (hackathons[0]?.title || ""),
      category: "Software Engineering",
      domain: "Web & Cloud Architecture",
      difficulty: "MEDIUM",
      description: "",
      shortDescription: "",
      background: "",
      targetUsers: "Students, developers, and industry engineers",
      objectives: [
        "Implement core real-time processing engine",
        "Design scalable multi-tenant architecture",
        "Deploy working live demonstration with automated tests"
      ],
      requirements: [
        "Interactive web dashboard with responsive layout",
        "REST/WebSocket backend with robust validation",
        "Comprehensive README and architecture blueprint"
      ],
      constraints: "Must achieve sub-200ms latency and zero-trust authentication.",
      expectedSolution: "Full-stack web/cloud prototype with GitHub repository and live deployment URL.",
      evaluationCriteria: DEFAULT_EVALUATION_CRITERIA,
      resources: [
        "https://docs.sctech.com/api-reference",
        "https://github.com/sctech-starter-kit"
      ],
      status: "DRAFT",
      displayOrder: problems.length + 1,
    });
    setEditorModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (problem: ProblemStatement) => {
    setEditingProblem({ ...problem });
    setEditorModalOpen(true);
  };

  // Save Problem from Modal
  const handleSaveProblemModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProblem || !editingProblem.title?.trim()) {
      error("Please provide a valid problem statement title");
      return;
    }

    setSavingProblem(true);
    try {
      const currentUid = auth.currentUser?.uid || firebaseUser?.uid || "ADMIN";
      const token = await auth.currentUser?.getIdToken() || await firebaseUser?.getIdToken();
      
      const targetHackathon = hackathons.find((h) => h.id === editingProblem.hackathonId);
      const payload: Partial<ProblemStatement> = {
        ...editingProblem,
        hackathonTitle: targetHackathon?.title || editingProblem.hackathonTitle || "",
        shortDescription: editingProblem.description || editingProblem.shortDescription || "",
        fullProblemDescription: editingProblem.fullProblemDescription || editingProblem.description || "",
      };

      const res = await saveProblemStatement(payload, currentUid, editingProblem.id, token);
      if (res.success) {
        success(editingProblem.id ? "Problem statement updated successfully!" : "Problem statement created successfully!");
        setEditorModalOpen(false);
        setEditingProblem(null);
        await loadProblems();
      } else {
        error(res.error || "Failed to save problem statement");
      }
    } catch (err: any) {
      error(err?.message || "Failed to save problem statement");
    } finally {
      setSavingProblem(false);
    }
  };

  // Gemini AI Generator Handler
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingAi(true);
    try {
      const token = await auth.currentUser?.getIdToken() || await firebaseUser?.getIdToken();
      const targetHackathon = hackathons.find((h) => h.id === selectedHackathonId);
      
      const res = await fetch("/api/admin/ai/problem-statements/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: aiForm.topic,
          domain: aiForm.domain,
          difficulty: aiForm.difficulty,
          targetUsers: aiForm.targetUsers,
          constraints: aiForm.constraints,
          customPrompt: aiForm.customPrompt,
          hackathonId: selectedHackathonId !== "ALL" ? selectedHackathonId : (hackathons[0]?.id || null),
          hackathonTitle: targetHackathon?.title || "SC TECH National Innovation Challenge",
          displayOrder: problems.length + 1,
        }),
      });

      const data = await res.json();
      if (res.ok && data.problem) {
        success("Problem Statement generated by Gemini AI! Loaded into Editor as DRAFT.");
        setAiModalOpen(false);
        setEditingProblem(data.problem);
        setEditorModalOpen(true);
      } else {
        error(data.error || "Generation failed with Gemini AI");
      }
    } catch {
      error("Failed to generate with Gemini AI");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Gemini AI Enhance Handler
  const handleAiEnhance = async (problemToEnhance: Partial<ProblemStatement>) => {
    setGeneratingAi(true);
    try {
      const token = await auth.currentUser?.getIdToken() || await firebaseUser?.getIdToken();
      const targetHackathon = hackathons.find((h) => h.id === problemToEnhance.hackathonId || h.id === selectedHackathonId);

      const res = await fetch("/api/admin/ai/problem-statements/enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          existingProblem: problemToEnhance,
          action: aiForm.enhanceAction,
          instructions: aiForm.enhanceInstructions,
          hackathonTitle: targetHackathon?.title,
        }),
      });

      const data = await res.json();
      if (res.ok && data.enhancedProblem) {
        setEnhancedDiff({ original: problemToEnhance, enhanced: data.enhancedProblem });
        setDiffModalOpen(true);
      } else {
        error(data.error || "Enhancement failed with Gemini AI");
      }
    } catch {
      error("Failed to enhance problem statement");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Apply Enhanced AI Version to Editor
  const handleApplyEnhancedVersion = () => {
    if (enhancedDiff?.enhanced) {
      setEditingProblem({
        ...editingProblem,
        ...enhancedDiff.enhanced,
      });
      setDiffModalOpen(false);
      setEnhancedDiff(null);
      success("Applied Gemini AI enhancements to editor draft!");
    }
  };

  const filteredProblems = problems.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (selectedHackathonId !== "ALL" && item.hackathonId !== selectedHackathonId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.problemCode?.toLowerCase().includes(q) ||
      item.domain?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.organization?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: problems.length,
    published: problems.filter((p) => p.status === "PUBLISHED").length,
    scheduled: problems.filter((p) => p.status === "SCHEDULED").length,
    drafts: problems.filter((p) => p.status === "DRAFT").length,
    archived: problems.filter((p) => p.status === "ARCHIVED" || p.status === "CLOSED").length,
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin/hackathons" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hackathons Control</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <FileCode2 className="w-7 h-7 text-indigo-400" />
            <span>Hackathon Problem Statements Architecture</span>
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative source of truth for hackathon challenge statements with Admin-only Gemini AI generation, draft lifecycle, and scheduled release engine.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setAiMode("CREATE");
              setAiModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Gemini AI Assistant</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Statement</span>
          </button>
        </div>
      </div>

      {/* Hackathon Selector Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block">Currently Managing</span>
            <span className="text-sm font-black text-white">
              {selectedHackathonId === "ALL" 
                ? "All Hackathons (Global Overview)" 
                : (hackathons.find((h) => h.id === selectedHackathonId)?.title || selectedHackathonId)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Select Hackathon:</span>
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Hackathons (All Statements)</option>
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div 
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "ALL" ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10" : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400">Total Statements</span>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <p className="text-[10px] text-slate-500">In database</p>
        </div>

        <div 
          onClick={() => setStatusFilter("PUBLISHED")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "PUBLISHED" ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10" : "bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500/50"
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-400">Published (Live)</span>
          <div className="text-2xl font-black text-emerald-300">{stats.published}</div>
          <p className="text-[10px] text-emerald-400/80">Visible to Students</p>
        </div>

        <div 
          onClick={() => setStatusFilter("SCHEDULED")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "SCHEDULED" ? "bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/10" : "bg-slate-900/80 border-purple-500/30 hover:border-purple-500/50"
          }`}
        >
          <span className="text-[11px] font-semibold text-purple-400">Scheduled Release</span>
          <div className="text-2xl font-black text-purple-300">{stats.scheduled}</div>
          <p className="text-[10px] text-purple-400/80">Auto-release timer</p>
        </div>

        <div 
          onClick={() => setStatusFilter("DRAFT")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "DRAFT" ? "bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/10" : "bg-slate-900/80 border-amber-500/30 hover:border-amber-500/50"
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-400">Drafts</span>
          <div className="text-2xl font-black text-amber-300">{stats.drafts}</div>
          <p className="text-[10px] text-slate-500">Hidden from Students</p>
        </div>

        <div 
          onClick={() => setStatusFilter("ARCHIVED")}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            statusFilter === "ARCHIVED" ? "bg-slate-800 border-slate-600 shadow-lg" : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400">Archived</span>
          <div className="text-2xl font-black text-slate-300">{stats.archived}</div>
          <p className="text-[10px] text-slate-500">Closed challenges</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 text-xs overflow-x-auto w-full sm:w-auto">
          {["ALL", "PUBLISHED", "SCHEDULED", "DRAFT", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, code, category, or domain..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Problem Statements Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-3 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span>Synchronizing hackathon problem statements from Firestore...</span>
        </div>
      ) : loadError ? (
        <div className="p-16 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4">
          <FileCode2 className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Unable to load problem statements</h3>
          <p className="text-xs text-rose-200/80 max-w-xl mx-auto break-words">{loadError}</p>
          <button
            type="button"
            onClick={loadProblems}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
          >
            Retry Sync
          </button>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <FileCode2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No problem statements found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click &quot;Gemini AI Assistant&quot; to generate industry problem blueprints or &quot;Create Statement&quot; to author manually.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setAiMode("CREATE");
                setAiModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Generate with Gemini AI
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs"
            >
              Create Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="p-4 font-semibold">Code & Title</th>
                <th className="p-4 font-semibold">Hackathon</th>
                <th className="p-4 font-semibold">Category & Domain</th>
                <th className="p-4 font-semibold">Difficulty</th>
                <th className="p-4 font-semibold">Status & Release</th>
                <th className="p-4 font-semibold">Order</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredProblems.map((p) => {
                const isPublished = p.status === "PUBLISHED";
                const isScheduled = p.status === "SCHEDULED";
                const isDraft = p.status === "DRAFT";

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 max-w-sm space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                          {p.problemCode || "PS-01"}
                        </span>
                        {p.isAiGenerated && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            <span>AI</span>
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-white leading-snug line-clamp-1">{p.title}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{p.description || p.shortDescription}</p>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-300 block">
                        {p.hackathonTitle || (hackathons.find((h) => h.id === p.hackathonId)?.title) || "Unassigned"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.hackathonId || "Global"}</span>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-slate-300 block">{p.category || p.domain || "Technology"}</span>
                      <span className="text-[10px] text-slate-500">{p.domain}</span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.difficulty === "HARD" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                        p.difficulty === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        {p.difficulty || "MEDIUM"}
                      </span>
                    </td>

                    <td className="p-4 space-y-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        isPublished ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        isScheduled ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                        isDraft ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {isPublished && <CheckCircle2 className="w-3 h-3" />}
                        {isScheduled && <Clock className="w-3 h-3" />}
                        <span>{p.status}</span>
                      </span>

                      {isScheduled && p.scheduledReleaseAt && (
                        <div className="text-[10px] text-purple-300 font-mono">
                          Release: {formatISTDate(p.scheduledReleaseAt)}
                        </div>
                      )}

                      {isPublished && p.publishedAt && (
                        <div className="text-[10px] text-slate-500">
                          Published: {formatISTDate(p.publishedAt)}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs">
                        #{p.displayOrder || 1}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Status Action */}
                        {!isPublished ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(p.id!, "PUBLISHED")}
                            disabled={processingId === p.id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition cursor-pointer"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(p.id!, "DRAFT")}
                            disabled={processingId === p.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingProblem(p);
                            handleAiEnhance(p);
                          }}
                          disabled={generatingAi}
                          className="p-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white transition cursor-pointer"
                          title="Enhance with Gemini AI"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Statement"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id!)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-500 hover:text-rose-300 transition cursor-pointer"
                          title="Delete Statement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* GEMINI AI ASSISTANT MODAL (Create / Enhance) */}
      <AnimatePresence>
        {aiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Gemini Problem Statement Assistant</h3>
                    <p className="text-[11px] text-slate-400">
                      Context: <strong className="text-indigo-400">{selectedHackathonId === "ALL" ? "National Challenge" : (hackathons.find((h) => h.id === selectedHackathonId)?.title || selectedHackathonId)}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAiGenerate} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Problem Topic / Concept Idea *</label>
                  <input
                    type="text"
                    required
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    placeholder="e.g. Smart Healthcare for Rural Areas, Autonomous Drone Delivery, or Cybersecurity Threat Detection"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Domain / Category</label>
                    <select
                      value={aiForm.domain}
                      onChange={(e) => setAiForm({ ...aiForm, domain: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200"
                    >
                      <option value="Healthcare & AI">Healthcare & AI</option>
                      <option value="FinTech & Blockchain">FinTech & Blockchain</option>
                      <option value="EdTech & Smart Learning">EdTech & Smart Learning</option>
                      <option value="Cybersecurity & Defense">Cybersecurity & Defense</option>
                      <option value="CleanTech & Sustainability">CleanTech & Sustainability</option>
                      <option value="Cloud & Distributed Systems">Cloud & Distributed Systems</option>
                      <option value="Robotics & Autonomous IoT">Robotics & Autonomous IoT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Challenge Difficulty</label>
                    <select
                      value={aiForm.difficulty}
                      onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200"
                    >
                      <option value="EASY">EASY (Beginner Friendly)</option>
                      <option value="MEDIUM">MEDIUM (Intermediate Full-Stack)</option>
                      <option value="HARD">HARD (Advanced Systems / Deep Tech)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Stakeholders / Users</label>
                  <input
                    type="text"
                    value={aiForm.targetUsers}
                    onChange={(e) => setAiForm({ ...aiForm, targetUsers: e.target.value })}
                    placeholder="e.g. Rural doctors, health workers, students, banking consumers"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Key Constraints / Technical Limits</label>
                  <input
                    type="text"
                    value={aiForm.constraints}
                    onChange={(e) => setAiForm({ ...aiForm, constraints: e.target.value })}
                    placeholder="e.g. Must support offline sync, sub-200ms latency, zero-trust security"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Special Admin Instructions</label>
                  <textarea
                    rows={2}
                    value={aiForm.customPrompt}
                    onChange={(e) => setAiForm({ ...aiForm, customPrompt: e.target.value })}
                    placeholder="e.g. Include specific evaluation breakdown for live demo reliability and test coverage..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500">
                    💡 Gemini will generate a structured DRAFT. You review, edit, and manually publish.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAiModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generatingAi}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/30"
                    >
                      {generatingAi ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Architecting Blueprint...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Generate with Gemini</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE PROBLEM STATEMENT EDITOR MODAL */}
      {editorModalOpen && editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    {editingProblem.id ? "EDIT PROBLEM STATEMENT" : "CREATE NEW PROBLEM STATEMENT"}
                  </span>
                  {editingProblem.isAiGenerated && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Gemini AI Generated</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-white">
                  {editingProblem.title || "Untitled Problem Blueprint"}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAiEnhance(editingProblem)}
                  disabled={generatingAi || !editingProblem.title}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Enhance with Gemini</span>
                </button>

                <button
                  onClick={() => setEditorModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProblemModal} className="space-y-4 text-xs">
              
              {/* Row 1: Associated Hackathon & Problem Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Assigned Hackathon *</label>
                  <select
                    value={editingProblem.hackathonId || ""}
                    onChange={(e) => {
                      const sel = hackathons.find((h) => h.id === e.target.value);
                      setEditingProblem({
                        ...editingProblem,
                        hackathonId: e.target.value,
                        hackathonTitle: sel?.title || "",
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-bold"
                  >
                    <option value="">No Hackathon (General Problem Bank)</option>
                    {hackathons.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Problem Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProblem.problemCode || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, problemCode: e.target.value })}
                    placeholder="e.g. PS-01, AI-HLT-01"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-indigo-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Title */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Problem Title *</label>
                <input
                  type="text"
                  required
                  value={editingProblem.title || ""}
                  onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                  placeholder="e.g. AI-Powered Smart Healthcare Diagnostics & Rural Triage"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm"
                />
              </div>

              {/* Row 3: Category, Domain, Difficulty, Display Order */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <input
                    type="text"
                    value={editingProblem.category || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, category: e.target.value })}
                    placeholder="e.g. Healthcare, FinTech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Domain</label>
                  <input
                    type="text"
                    value={editingProblem.domain || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, domain: e.target.value })}
                    placeholder="e.g. Web & Cloud"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Difficulty</label>
                  <select
                    value={editingProblem.difficulty || "MEDIUM"}
                    onChange={(e) => setEditingProblem({ ...editingProblem, difficulty: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={editingProblem.displayOrder || 1}
                    onChange={(e) => setEditingProblem({ ...editingProblem, displayOrder: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Row 4: Short Description */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Executive Summary / Description *</label>
                <textarea
                  rows={2}
                  required
                  value={editingProblem.description || editingProblem.shortDescription || ""}
                  onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value, shortDescription: e.target.value })}
                  placeholder="Concise 2-3 sentence overview of the challenge..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 leading-relaxed"
                />
              </div>

              {/* Row 5: Background & Target Users */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Background Context</label>
                  <textarea
                    rows={2}
                    value={editingProblem.background || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, background: e.target.value })}
                    placeholder="Real-world context and inefficiencies..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Users</label>
                  <textarea
                    rows={2}
                    value={editingProblem.targetUsers || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, targetUsers: e.target.value })}
                    placeholder="Specific personas impacted..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Row 6: Objectives & Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Objectives (One per line)</label>
                  <textarea
                    rows={3}
                    value={Array.isArray(editingProblem.objectives) ? editingProblem.objectives.join("\n") : (editingProblem.objectives || "")}
                    onChange={(e) => setEditingProblem({ ...editingProblem, objectives: e.target.value.split("\n").filter(Boolean) })}
                    placeholder="Milestone 1&#10;Milestone 2&#10;Milestone 3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Requirements (One per line)</label>
                  <textarea
                    rows={3}
                    value={Array.isArray(editingProblem.requirements) ? editingProblem.requirements.join("\n") : (editingProblem.requirements || "")}
                    onChange={(e) => setEditingProblem({ ...editingProblem, requirements: e.target.value.split("\n").filter(Boolean) })}
                    placeholder="Functional requirement 1&#10;Technical requirement 2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Row 7: Constraints & Expected Solution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Constraints</label>
                  <textarea
                    rows={2}
                    value={editingProblem.constraints || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, constraints: e.target.value })}
                    placeholder="Latency, privacy, compliance limits..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Expected Solution / Deliverables</label>
                  <textarea
                    rows={2}
                    value={editingProblem.expectedSolution || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, expectedSolution: e.target.value })}
                    placeholder="GitHub repository, live URL, demo video..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Row 8: Publication Status & Scheduling */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Publication Status & Student Visibility Engine
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Status *</label>
                    <select
                      value={editingProblem.status || "DRAFT"}
                      onChange={(e) => setEditingProblem({ ...editingProblem, status: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-bold"
                    >
                      <option value="DRAFT">DRAFT (Hidden from Students)</option>
                      <option value="SCHEDULED">SCHEDULED (Auto-release on timer)</option>
                      <option value="PUBLISHED">PUBLISHED (Immediately Live for Students)</option>
                      <option value="ARCHIVED">ARCHIVED (Archived / Closed)</option>
                    </select>
                  </div>

                  {editingProblem.status === "SCHEDULED" && (
                    <div>
                      <label className="text-purple-300 font-bold block mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Scheduled Release Time (IST) *</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={editingProblem.scheduledReleaseAt ? editingProblem.scheduledReleaseAt.slice(0, 16) : ""}
                        onChange={(e) => setEditingProblem({ ...editingProblem, scheduledReleaseAt: new Date(e.target.value).toISOString() })}
                        className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-3.5 py-2 text-white font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[10px] text-slate-500">
                  {editingProblem.status === "PUBLISHED" ? (
                    <span className="text-emerald-400 font-semibold">✓ Will be immediately visible on student hackathon page.</span>
                  ) : editingProblem.status === "SCHEDULED" ? (
                    <span className="text-purple-400 font-semibold">⏰ Will unlock automatically on release date.</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">🔒 Draft remains hidden from students.</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProblem}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {savingProblem && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingProblem.id ? "Save Changes" : "Save Problem Statement"}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* GEMINI AI ENHANCEMENT DIFF & PREVIEW MODAL */}
      {diffModalOpen && enhancedDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0B0F19] border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Gemini AI Enhancement Preview</h3>
                  <p className="text-[11px] text-slate-400">
                    Review Gemini&apos;s architectural improvements before applying to your draft.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDiffModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Original */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Version</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white">{enhancedDiff.original.title}</h4>
                  <p className="text-slate-400 text-[11px]">{enhancedDiff.original.description || enhancedDiff.original.shortDescription}</p>
                </div>
                {enhancedDiff.original.constraints && (
                  <div className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Constraints:</strong> {enhancedDiff.original.constraints}
                  </div>
                )}
              </div>

              {/* Enhanced */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/40 space-y-3">
                <span className="text-[10px] text-purple-300 uppercase font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Gemini Enhanced Version</span>
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white">{enhancedDiff.enhanced.title}</h4>
                  <p className="text-purple-200/90 text-[11px] leading-relaxed">{enhancedDiff.enhanced.description}</p>
                </div>
                {enhancedDiff.enhanced.constraints && (
                  <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <strong className="text-purple-300">Enhanced Constraints:</strong> {enhancedDiff.enhanced.constraints}
                  </div>
                )}
                {enhancedDiff.enhanced.requirements?.length > 0 && (
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <strong className="text-indigo-300">Key Requirements:</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                      {enhancedDiff.enhanced.requirements.slice(0, 3).map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDiffModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Discard AI Changes
              </button>
              <button
                type="button"
                onClick={handleApplyEnhancedVersion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Apply Enhanced Version</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
