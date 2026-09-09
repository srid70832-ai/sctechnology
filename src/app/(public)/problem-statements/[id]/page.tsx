"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProblemStatement, getProblemStatementById } from "@/lib/problem-statements";
import { 
  FileCode2, 
  ArrowLeft, 
  Users, 
  Calendar, 
  Globe, 
  Building2, 
  Bookmark, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ShieldAlert, 
  Award,
  Loader2,
  Rocket
} from "lucide-react";

export default function ProblemStatementDetailPage() {
  const params = useParams();
  const rawId = params.id as string;

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [problem, setProblem] = useState<ProblemStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      if (!rawId) return;
      try {
        const item = await getProblemStatementById(rawId);
        if (item && item.status === "PUBLISHED") {
          setProblem(item);
        } else {
          setProblem(null);
        }
      } catch (err) {
        console.error("Error loading problem detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [rawId]);

  const handleSaveProblem = async () => {
    if (!firebaseUser?.uid || !problem) {
      window.location.href = `/login?redirect=/problem-statements/${rawId}`;
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "savedProblems"), {
        userId: firebaseUser.uid,
        problemStatementId: problem.id || rawId,
        problemTitle: problem.title,
        domain: problem.domain,
        difficulty: problem.difficulty,
        createdAt: serverTimestamp(),
      });
      setIsSaved(true);
      success("Problem Statement saved to your dashboard!");
    } catch {
      error("Failed to save problem statement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading challenge details...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="p-16 text-center max-w-md mx-auto space-y-4">
          <FileCode2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-xl font-bold text-white">Problem Statement Not Found</h2>
          <p className="text-xs text-slate-400">
            This challenge is currently unavailable or has not been published yet.
          </p>
          <Link href="/problem-statements" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs inline-block">
            &larr; Back to Problem Statements
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Navigation Breadcrumb */}
        <Link href="/problem-statements" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Challenges</span>
        </Link>

        {/* Hero Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                  {problem.domain}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  problem.difficulty === "HARD" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                  problem.difficulty === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}>
                  {problem.difficulty}
                </span>
                {problem.organizationType === "SC_TECH_ORIGINAL" && (
                  <span className="px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                    SC TECH Original
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {problem.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {problem.organization || "SC TECH"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  {problem.location || "India / Global"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Team Size: {problem.teamSizeMin}-{problem.teamSizeMax}
                </span>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSaveProblem}
                disabled={saving || isSaved}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
                <span>{isSaved ? "Saved" : "Save Problem"}</span>
              </button>

              <Link
                href={`/problem-statements/${problem.id || rawId}/build`}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>Build Project</span>
              </Link>
            </div>
          </div>

          {/* Short Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Challenge Summary</h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {problem.shortDescription}
            </p>
          </div>

          {/* Background */}
          {problem.background && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Industry Context & Status Quo</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {problem.background}
              </p>
            </div>
          )}

          {/* Detailed Problem Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Detailed Technical Problem Breakdown</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {problem.fullProblemDescription}
            </p>
          </div>

          {/* Target Users & Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Target Users & Beneficiaries</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{problem.targetUsers}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Existing Bottlenecks & Challenges</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{problem.existingChallenges}</p>
            </div>
          </div>

          {/* Expected Outcome */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-950/60 border border-blue-500/30 space-y-2">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Expected Deliverables & Benchmarks</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {problem.expectedOutcome}
            </p>
          </div>

          {/* Proposed Solution Areas */}
          {problem.proposedSolutionAreas && problem.proposedSolutionAreas.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Suggested Solution Focus Areas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {problem.proposedSolutionAreas.map((sa, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>{sa}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Tech Suggestions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Required Skills & Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {problem.requiredSkills?.map((sk, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Evaluation Criteria Matrix */}
          {problem.evaluationCriteria && problem.evaluationCriteria.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Evaluation Criteria & Rubric</h3>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                      <th className="pb-2">Evaluation Criterion</th>
                      <th className="pb-2">Weight / Marks</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {problem.evaluationCriteria.map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold text-white">{c.category}</td>
                        <td className="py-2.5 font-mono text-blue-400">{c.maxMarks} pts</td>
                        <td className="py-2.5 text-slate-400">{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submission & Source Footer */}
          <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white">Source & Attribution</span>
              <p className="text-[11px] text-slate-400">
                {problem.sourceUrl ? `Verified source: ${problem.sourceName || "Official"}` : "SC TECH Original Challenge Design"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {problem.sourceUrl && (
                <a
                  href={problem.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <span>View Original Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <Link
                href={`/problem-statements/${problem.id || rawId}/build`}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                <span>Build Project Now</span>
              </Link>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
