"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Activity, 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Loader2, 
  Github, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Video,
  FileText,
  Sparkles,
  RotateCw,
  Check
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { SubmissionItem, formatISTDate } from "@/lib/platform-models";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminSubmissionsPage() {
  const { success, error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [newStatus, setNewStatus] = useState<SubmissionItem["status"]>("APPROVED");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/submissions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        error("Failed to load submissions");
      }
    } catch {
      error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadSubmissions();
    }
  }, [authLoading, firebaseUser]);

  const openReviewModal = (sub: SubmissionItem) => {
    setSelectedSubmission(sub);
    setNewStatus(sub.status);
    setAdminNotes(sub.adminNotes || "");
    setReviewModalOpen(true);
  };

  const handleRunAiEvaluation = async (sub: SubmissionItem) => {
    setEvaluatingId(sub.id);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/ai/evaluate-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          submissionId: sub.id,
          projectName: sub.targetTitle,
          description: sub.description,
          githubUrl: sub.githubUrl,
          liveUrl: sub.liveUrl,
          demoVideoUrl: sub.demoVideoUrl,
          techStack: sub.techStack,
          targetTitle: sub.targetTitle,
          roundNumber: sub.roundNumber || 1,
        }),
      });

      const json = await res.json();
      if (res.ok && json.evaluation) {
        success("Gemini AI evaluation completed!");
        const updatedSub: SubmissionItem = { ...sub, aiEvaluation: json.evaluation };
        setSubmissions((prev) => prev.map((s) => (s.id === sub.id ? updatedSub : s)));
        if (selectedSubmission && selectedSubmission.id === sub.id) {
          setSelectedSubmission(updatedSub);
        }
      } else {
        error(json.error || "AI evaluation failed");
      }
    } catch {
      error("Network error during AI evaluation");
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleAutoFillShortlist = () => {
    if (!selectedSubmission?.aiEvaluation) return;
    const { recommendation, overallScore, feedbackSummary } = selectedSubmission.aiEvaluation;
    setNewStatus(recommendation === "SHORTLIST" ? "APPROVED" : "UNDER_REVIEW");
    setAdminNotes(
      `[AI Evaluation: ${recommendation} - Score: ${overallScore}/100]\n${feedbackSummary}`
    );
    success("AI evaluation summary copied into review notes!");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setUpdating(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: selectedSubmission.id,
          status: newStatus,
          adminNotes,
        }),
      });

      if (res.ok) {
        success(`Submission status updated to ${newStatus}`);
        setSubmissions(
          submissions.map((s) =>
            s.id === selectedSubmission.id ? { ...s, status: newStatus, adminNotes } : s
          )
        );
        setReviewModalOpen(false);
      } else {
        error("Failed to update status");
      }
    } catch {
      error("Network error");
    } finally {
      setUpdating(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && s.targetType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentName?.toLowerCase().includes(q) ||
      s.studentEmail?.toLowerCase().includes(q) ||
      s.targetTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Activity className="w-7 h-7 text-rose-400" />
            <span>Student Submissions Review Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400">
            Audit GitHub code repositories, live deployments, evaluate student solutions, and update evaluation status.
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          Refresh Submissions
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          <span>Loading submissions telemetry...</span>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Activity className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Submissions Found</h3>
          <p className="text-xs text-slate-400">No student project or hackathon submissions match criteria.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/60">
                  <th className="p-4">Student</th>
                  <th className="p-4">Target / Challenge</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4">Links</th>
                  <th className="p-4">Gemini AI Evaluation</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubmissions.map((s) => {
                  const isEvaluatingThis = evaluatingId === s.id;
                  const aiEval = s.aiEvaluation;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="font-bold text-white">{s.studentName}</div>
                        <div className="text-[11px] text-slate-400">{s.studentEmail}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200 max-w-xs truncate">{s.targetTitle}</div>
                        {s.roundNumber && (
                          <span className="text-[10px] text-amber-400 font-semibold">Round {s.roundNumber}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300">
                          {s.targetType}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 whitespace-nowrap">
                        {formatISTDate(s.submittedAt?.toMillis ? new Date(s.submittedAt.toMillis()) : s.submittedAt)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {s.githubUrl && (
                            <a
                              href={s.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white text-blue-400"
                              title="GitHub Repository"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {s.liveUrl && (
                            <a
                              href={s.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white text-emerald-400"
                              title="Live Demo"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {s.demoVideoUrl && (
                            <a
                              href={s.demoVideoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white text-rose-400"
                              title="Demo Video"
                            >
                              <Video className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {aiEval ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  aiEval.overallScore >= 75
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : aiEval.overallScore >= 60
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}
                              >
                                {aiEval.overallScore}/100
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  aiEval.recommendation === "SHORTLIST"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : aiEval.recommendation === "REVIEW_REQUIRED"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}
                              >
                                {aiEval.recommendation}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {aiEval.aiAssistanceIndicator}
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isEvaluatingThis}
                            onClick={() => handleRunAiEvaluation(s)}
                            className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold flex items-center gap-1.5 transition"
                          >
                            {isEvaluatingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-purple-400" />
                            )}
                            <span>{isEvaluatingThis ? "Evaluating..." : "Run AI Eval"}</span>
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : s.status === "UNDER_REVIEW"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : s.status === "REJECTED"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openReviewModal(s)}
                          className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold"
                        >
                          Review & AI
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEW & STATUS UPDATE MODAL WITH GEMINI AI EVALUATION */}
      {reviewModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                <span>Review & AI Evaluation: {selectedSubmission.studentName}</span>
              </h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Submission Target & Links */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Target Challenge</span>
                    <div className="font-bold text-white">{selectedSubmission.targetTitle}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSubmission.githubUrl && (
                      <a
                        href={selectedSubmission.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 hover:text-white flex items-center gap-1.5 text-[11px]"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub Repo</span>
                      </a>
                    )}
                    {selectedSubmission.liveUrl && (
                      <a
                        href={selectedSubmission.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white flex items-center gap-1.5 text-[11px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Student Solution Description</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-900">
                    {selectedSubmission.description}
                  </p>
                </div>
              </div>

              {/* Gemini AI Evaluation Section */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-purple-200">Google Gemini AI Evaluation Engine</span>
                  </div>

                  <button
                    type="button"
                    disabled={evaluatingId === selectedSubmission.id}
                    onClick={() => handleRunAiEvaluation(selectedSubmission)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition"
                  >
                    {evaluatingId === selectedSubmission.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {selectedSubmission.aiEvaluation ? "Re-evaluate with AI" : "Run AI Evaluation"}
                    </span>
                  </button>
                </div>

                {selectedSubmission.aiEvaluation ? (
                  <div className="space-y-3 pt-2">
                    {/* Score & Recommendation Banner */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Overall Weighted Score</span>
                        <span className="text-xl font-black text-purple-300">
                          {selectedSubmission.aiEvaluation.overallScore}/100
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Recommendation</span>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                            selectedSubmission.aiEvaluation.recommendation === "SHORTLIST"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : selectedSubmission.aiEvaluation.recommendation === "REVIEW_REQUIRED"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {selectedSubmission.aiEvaluation.recommendation}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAutoFillShortlist}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Auto-Fill Status & Notes</span>
                      </button>
                    </div>

                    {/* AI Assistance Indicator Banner */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          AI Assistance Analysis
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-purple-300 font-semibold">
                          {selectedSubmission.aiEvaluation.aiAssistanceIndicator}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {selectedSubmission.aiEvaluation.aiAssistanceRationale}
                      </p>
                      <p className="text-[9px] text-slate-500 italic">
                        Note: AI assistance indicators are informational and do not automatically disqualify students.
                      </p>
                    </div>

                    {/* Rubric Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: "Technical Quality", score: selectedSubmission.aiEvaluation.technicalQualityScore },
                        { label: "Problem Understanding", score: selectedSubmission.aiEvaluation.problemUnderstandingScore },
                        { label: "Innovation", score: selectedSubmission.aiEvaluation.innovationScore },
                        { label: "Completeness", score: selectedSubmission.aiEvaluation.completenessScore },
                        { label: "Documentation", score: selectedSubmission.aiEvaluation.documentationScore },
                        { label: "Requirement Compliance", score: selectedSubmission.aiEvaluation.requirementComplianceScore },
                      ].map((metric) => (
                        <div key={metric.label} className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block truncate">{metric.label}</span>
                          <div className="flex items-center justify-between mt-1">
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mr-2">
                              <div
                                className="bg-purple-500 h-full rounded-full"
                                style={{ width: `${metric.score}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-white whitespace-nowrap">
                              {metric.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Feedback Summary */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        AI Feedback Summary
                      </span>
                      <p className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed text-[11px]">
                        {selectedSubmission.aiEvaluation.feedbackSummary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No AI evaluation run yet for this submission. Click &quot;Run AI Evaluation&quot; to inspect code quality, architecture rubric, and shortlisting guidance.
                  </p>
                )}
              </div>

              {/* Status Update & Admin Notes Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-3 pt-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Final Evaluation Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="APPROVED">APPROVED (Shortlisted / Qualified)</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Review Feedback / Admin Notes</label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Feedback provided to the student regarding code quality or score..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2"
                  >
                    {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Evaluation Status</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
