"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  ProblemStatement, 
  saveProblemStatement, 
  DEFAULT_EVALUATION_CRITERIA 
} from "@/lib/problem-statements";
import { 
  FileCode2, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  Globe, 
  Building2, 
  ShieldCheck 
} from "lucide-react";

function ProblemCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ProblemStatement>>({
    title: "",
    shortDescription: "",
    fullProblemDescription: "",
    background: "",
    problemCategory: "Software & Web Engineering",
    domain: "Software Engineering",
    difficulty: "MEDIUM",
    organization: "SC TECH Original Challenge",
    organizationType: "SC_TECH_ORIGINAL",
    location: "India / Global",
    targetUsers: "",
    existingChallenges: "",
    expectedOutcome: "",
    proposedSolutionAreas: ["Cloud Native Microservices", "Real-time Monitoring & Dashboard"],
    requiredSkills: ["React", "TypeScript", "Node.js", "Docker"],
    technologySuggestions: ["Next.js", "Firebase / PostgreSQL", "Docker", "Tailwind CSS"],
    constraints: "Must comply with data privacy standards and handle high traffic throughput.",
    eligibility: "Open to all engineering students, developers, and tech builders.",
    teamSizeMin: 1,
    teamSizeMax: 4,
    submissionRequirements: "GitHub repo URL, live demo link, architecture documentation, demo video.",
    evaluationCriteria: DEFAULT_EVALUATION_CRITERIA,
    deadline: "2026-12-31",
    sourceUrl: "",
    sourceName: "",
    verificationStatus: "SC_TECH_ORIGINAL",
    status: "DRAFT",
  });

  // Skills and Solution Areas input helpers
  const [newSkill, setNewSkill] = useState("");
  const [newSolutionArea, setNewSolutionArea] = useState("");
  const [newTech, setNewTech] = useState("");

  useEffect(() => {
    const aiData = searchParams.get("aiData");
    if (aiData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(aiData));
        setForm((prev) => ({
          ...prev,
          ...parsed,
          evaluationCriteria: parsed.evaluationCriteria || DEFAULT_EVALUATION_CRITERIA,
        }));
        success("Prefilled with Gemini AI generated challenge architecture!");
      } catch (err) {
        console.error("Error parsing AI data:", err);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (status: ProblemStatement["status"]) => {
    if (!firebaseUser?.uid) {
      error("You must be logged in as Admin");
      return;
    }
    if (!form.title || !form.shortDescription || !form.fullProblemDescription) {
      error("Please fill in the title, summary, and full problem description.");
      return;
    }

    setSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await saveProblemStatement(
        {
          ...form,
          status,
        },
        firebaseUser.uid,
        undefined,
        token
      );

      if (res.success) {
        success(`Problem statement saved as ${status}!`);
        router.push("/admin/problem-statements");
      } else {
        error("Failed to save problem statement");
      }
    } catch {
      error("Submission error");
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
            <span>Create Real-World Problem Statement</span>
          </h1>
          <p className="text-xs text-slate-400">
            Define comprehensive requirements, target users, evaluation rubrics, and technology constraints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit("DRAFT")}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow transition cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("PUBLISHED")}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Publish Directly</span>
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8 text-xs">
        
        {/* Section 1: Core Title & Overview */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            1. Core Problem Identity
          </h2>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Problem Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Scalable Multi-Tenant Identity Federation & Access Governance"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Domain</label>
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
              >
                <option value="Software Engineering">Software Engineering</option>
                <option value="AI / Machine Learning">AI / Machine Learning</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Blockchain & Web3">Blockchain & Web3</option>
                <option value="IoT & Smart Devices">IoT & Smart Devices</option>
                <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                <option value="Fintech & Payments">Fintech & Payments</option>
                <option value="CleanTech & Energy">CleanTech & Energy</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Submission Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Short Summary Description *</label>
            <textarea
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              rows={2}
              placeholder="High-level 2-3 sentence overview visible in the card preview..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />
          </div>
        </div>

        {/* Section 2: Detailed Problem Breakdown */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            2. Detailed Problem Architecture
          </h2>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Industry Background & Status Quo</label>
            <textarea
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
              rows={3}
              placeholder="Context regarding legacy systems, market inefficiencies..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Full Problem Description *</label>
            <textarea
              value={form.fullProblemDescription}
              onChange={(e) => setForm({ ...form, fullProblemDescription: e.target.value })}
              rows={6}
              placeholder="Comprehensive architectural problem description, core workflows, and system requirements..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Existing Challenges</label>
              <textarea
                value={form.existingChallenges}
                onChange={(e) => setForm({ ...form, existingChallenges: e.target.value })}
                rows={3}
                placeholder="Bottlenecks, security issues, latency barriers..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Target Users & Personas</label>
              <textarea
                value={form.targetUsers}
                onChange={(e) => setForm({ ...form, targetUsers: e.target.value })}
                rows={3}
                placeholder="Enterprise administrators, end users, citizens..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Expected Outcome & Deliverable</label>
            <textarea
              value={form.expectedOutcome}
              onChange={(e) => setForm({ ...form, expectedOutcome: e.target.value })}
              rows={3}
              placeholder="Measurable benchmark targets, working prototype criteria..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
            />
          </div>
        </div>

        {/* Section 3: Skills, Solutions & Constraints */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            3. Skills, Tech Stack & Constraints
          </h2>

          {/* Required Skills Chip manager */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. TypeScript, Docker, Redis"
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

          {/* Solution Areas */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Proposed Solution Focus Areas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSolutionArea}
                onChange={(e) => setNewSolutionArea(e.target.value)}
                placeholder="e.g. Distributed Consensus Engine"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={addSolutionArea}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Add Area
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.proposedSolutionAreas?.map((sa, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-semibold flex items-center gap-1.5">
                  <span>{sa}</span>
                  <button type="button" onClick={() => removeSolutionArea(idx)} className="text-slate-400 hover:text-white">✕</button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Constraints & Rules</label>
              <textarea
                value={form.constraints}
                onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Submission Requirements</label>
              <textarea
                value={form.submissionRequirements}
                onChange={(e) => setForm({ ...form, submissionRequirements: e.target.value })}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Min Team Size</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.teamSizeMin}
                onChange={(e) => setForm({ ...form, teamSizeMin: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Max Team Size</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.teamSizeMax}
                onChange={(e) => setForm({ ...form, teamSizeMax: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Organization Type</label>
              <select
                value={form.organizationType}
                onChange={(e) => setForm({ ...form, organizationType: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="SC_TECH_ORIGINAL">SC TECH Original</option>
                <option value="INDUSTRY">Industry Partner</option>
                <option value="GOVERNMENT">Government Initiative</option>
                <option value="NON_PROFIT">Non-Profit / NGO</option>
                <option value="ACADEMIC">Academic / University</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Source Name</label>
              <input
                type="text"
                value={form.sourceName || ""}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                placeholder="e.g. SC TECH Original / Partner"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Official Source URL (Optional)</label>
            <input
              type="url"
              value={form.sourceUrl || ""}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              placeholder="https://official-source-link.org"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminCreateProblemStatementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400">Loading form...</div>}>
      <ProblemCreateContent />
    </Suspense>
  );
}
