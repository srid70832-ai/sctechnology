"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Trophy, Star, CheckCircle2, ArrowLeft, Loader2, Send } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";

export default function JudgeDashboardPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Score modal state
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [problemScore, setProblemScore] = useState(18);
  const [functionalityScore, setFunctionalityScore] = useState(22);
  const [codeQualityScore, setCodeQualityScore] = useState(18);
  const [uiUxScore, setUiUxScore] = useState(14);
  const [innovationScore, setInnovationScore] = useState(9);
  const [presentationScore, setPresentationScore] = useState(9);
  const [feedback, setFeedback] = useState("Exceptional engineering execution and scalable database design.");
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/judge/hackathons");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/judge/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          problemScore,
          functionalityScore,
          codeQualityScore,
          uiUxScore,
          innovationScore,
          presentationScore,
          feedback,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        success(`Score submitted successfully! Total: ${data.score.totalScore}/100`);
        setSelectedSub(null);
        fetchAssignments();
      } else {
        error(data.error || "Failed to submit score");
      }
    } catch {
      error("Scoring submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Judge Evaluation Panel</h1>
              <p className="text-xs text-slate-400">Dr. Sarah Chen • AI Systems Research Lab</p>
            </div>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
          ROLE: HACKATHON JUDGE
        </span>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span>Loading assigned hackathons...</span>
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-6 max-w-5xl">
          {assignments.map((asg) => (
            <div key={asg.id} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{asg.hackathon.title}</h3>
                  <p className="text-xs text-slate-400">Total Submissions: {asg.hackathon.submissions.length}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                  {asg.hackathon.status}
                </span>
              </div>

              {asg.hackathon.submissions.length > 0 ? (
                <div className="space-y-3">
                  {asg.hackathon.submissions.map((sub: any) => (
                    <div key={sub.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">{sub.projectName}</h4>
                        <p className="text-xs text-slate-400">By {sub.user.name} • Repo: <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{sub.repoUrl}</a></p>
                      </div>

                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                      >
                        Evaluate & Score
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950 text-center text-xs text-slate-500">
                  Submissions are currently in progress. Candidate projects will appear here for rubric scoring.
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
          No hackathons currently assigned to this judge account.
        </div>
      )}

      {/* Scoring Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Evaluate: {selectedSub.projectName}</h3>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleScoreSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Problem Understanding (Max 20)</label>
                  <input
                    type="number"
                    max={20}
                    min={0}
                    value={problemScore}
                    onChange={(e) => setProblemScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Functionality (Max 25)</label>
                  <input
                    type="number"
                    max={25}
                    min={0}
                    value={functionalityScore}
                    onChange={(e) => setFunctionalityScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Code Quality (Max 20)</label>
                  <input
                    type="number"
                    max={20}
                    min={0}
                    value={codeQualityScore}
                    onChange={(e) => setCodeQualityScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">UI/UX (Max 15)</label>
                  <input
                    type="number"
                    max={15}
                    min={0}
                    value={uiUxScore}
                    onChange={(e) => setUiUxScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Innovation (Max 10)</label>
                  <input
                    type="number"
                    max={10}
                    min={0}
                    value={innovationScore}
                    onChange={(e) => setInnovationScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Presentation (Max 10)</label>
                  <input
                    type="number"
                    max={10}
                    min={0}
                    value={presentationScore}
                    onChange={(e) => setPresentationScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Judge Feedback</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Calculated Score:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {problemScore + functionalityScore + codeQualityScore + uiUxScore + innovationScore + presentationScore} / 100
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                {submitting ? "Submitting Score..." : "Lock & Submit Final Evaluation"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
