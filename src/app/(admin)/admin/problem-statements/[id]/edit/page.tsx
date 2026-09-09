"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  ProblemStatement, 
  getProblemStatementById, 
  saveProblemStatement, 
  DEFAULT_EVALUATION_CRITERIA 
} from "@/lib/problem-statements";
import { 
  FileCode2, 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Globe 
} from "lucide-react";

export default function AdminEditProblemStatementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ProblemStatement>>({});

  const [newSkill, setNewSkill] = useState("");
  const [newSolutionArea, setNewSolutionArea] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const item = await getProblemStatementById(id);
        if (item) {
          setForm(item);
        } else {
          error("Problem statement not found");
        }
      } catch (err) {
        console.error("Error loading problem statement:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (status: ProblemStatement["status"]) => {
    if (!firebaseUser?.uid || !id) return;
    setSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await saveProblemStatement(
        {
          ...form,
          status,
        },
        firebaseUser.uid,
        id,
        token
      );

      if (res.success) {
        success(`Problem statement updated as ${status}!`);
        router.push("/admin/problem-statements");
      } else {
        error("Update failed");
      }
    } catch {
      error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm({ ...form, requiredSkills: [...(form.requiredSkills || []), newSkill.trim()] });
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    setForm({
      ...form,
      requiredSkills: form.requiredSkills?.filter((_, i) => i !== index),
    });
  };

  const addSolutionArea = () => {
    if (!newSolutionArea.trim()) return;
    setForm({ ...form, proposedSolutionAreas: [...(form.proposedSolutionAreas || []), newSolutionArea.trim()] });
    setNewSolutionArea("");
  };

  const removeSolutionArea = (index: number) => {
    setForm({
      ...form,
      proposedSolutionAreas: form.proposedSolutionAreas?.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading problem statement...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin/problem-statements" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Problem Statements</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <FileCode2 className="w-7 h-7 text-blue-400" />
            <span>Edit Problem Statement</span>
          </h1>
          <p className="text-xs text-slate-400">
            ID: <span className="font-mono text-slate-300">{id}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(form.status || "DRAFT")}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow transition cursor-pointer disabled:opacity-50"
          >
            Save Changes
          </button>

          {form.status !== "PUBLISHED" ? (
            <button
              type="button"
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Publish Statement</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit("DRAFT")}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Unpublish to Draft</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8 text-xs">
        
        {/* Core Identity */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            1. Core Identity
          </h2>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Problem Title</label>
            <input
              type="text"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Domain</label>
              <input
                type="text"
                value={form.domain || ""}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Difficulty</label>
              <select
                value={form.difficulty || "MEDIUM"}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Deadline</label>
              <input
                type="date"
                value={form.deadline || ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Short Summary</label>
            <textarea
              value={form.shortDescription || ""}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            2. Detailed Problem Architecture
          </h2>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Full Problem Description</label>
            <textarea
              value={form.fullProblemDescription || ""}
              onChange={(e) => setForm({ ...form, fullProblemDescription: e.target.value })}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Expected Outcome</label>
            <textarea
              value={form.expectedOutcome || ""}
              onChange={(e) => setForm({ ...form, expectedOutcome: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />
          </div>
        </div>

        {/* Skills & Solution Areas */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            3. Skills & Solution Areas
          </h2>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. PyTorch, Docker"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.requiredSkills?.map((sk, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold flex items-center gap-1.5">
                  <span>{sk}</span>
                  <button type="button" onClick={() => removeSkill(idx)} className="text-slate-400 hover:text-white">✕</button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Min Team Size</label>
              <input
                type="number"
                value={form.teamSizeMin || 1}
                onChange={(e) => setForm({ ...form, teamSizeMin: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Max Team Size</label>
              <input
                type="number"
                value={form.teamSizeMax || 4}
                onChange={(e) => setForm({ ...form, teamSizeMax: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Organization</label>
              <input
                type="text"
                value={form.organization || ""}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Source Name</label>
              <input
                type="text"
                value={form.sourceName || ""}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
