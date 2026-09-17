"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderGit2, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Award, 
  CreditCard, 
  ExternalLink, 
  Loader2, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Code2, 
  FileText, 
  User, 
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { ProjectEnrollment } from "@/lib/project-lifecycle-service";
import { auth } from "@/lib/firebase";

export default function AdminProjectEnrollmentsPage() {
  const { success, error } = useToast();

  const [enrollments, setEnrollments] = useState<ProjectEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Evaluation Modal
  const [selectedEnrollment, setSelectedEnrollment] = useState<ProjectEnrollment | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalForm, setEvalForm] = useState({
    score: 85,
    status: "APPROVED" as "APPROVED" | "PARTIALLY_COMPLETED" | "REVISION_REQUIRED" | "REJECTED",
    strengths: "Clean architecture, well-structured components, robust error handling.",
    weaknesses: "Can improve test coverage for edge-case network failures.",
    improvements: "Consider adding distributed caching and CI/CD integration.",
    technicalRemarks: "Approved by SC TECH Technical Evaluation Board for official graduation.",
    evaluationDocumentUrl: "",
    evaluatorName: "Charudeshna (Founder) & Sridharan (Co-Founder)",
    stipendApproved: true,
    stipendAmount: 5000,
    certificateApproved: true,
  });

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/project-enrollments", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      } else {
        error("Failed to load project enrollments");
      }
    } catch (err) {
      console.error(err);
      error("Network error while fetching project enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const openEvaluationModal = (enr: ProjectEnrollment) => {
    setSelectedEnrollment(enr);
    setEvalForm({
      score: enr.evaluation?.score || 85,
      status: (enr.evaluation?.status as any) || "APPROVED",
      strengths: enr.evaluation?.strengths || "Clean architecture, well-structured components, robust error handling.",
      weaknesses: enr.evaluation?.weaknesses || "Can improve test coverage for edge-case network failures.",
      improvements: enr.evaluation?.improvements || "Consider adding distributed caching and CI/CD integration.",
      technicalRemarks: enr.evaluation?.technicalRemarks || "Approved by SC TECH Technical Evaluation Board for official graduation.",
      evaluationDocumentUrl: enr.evaluation?.evaluationDocumentUrl || "",
      evaluatorName: enr.evaluation?.evaluatorName || "SC TECH Lead Evaluator",
      stipendApproved: enr.evaluation?.stipendApproved !== undefined ? enr.evaluation.stipendApproved : (enr.stipendAmount ? enr.stipendAmount > 0 : true),
      stipendAmount: enr.stipendAmount || 5000,
      certificateApproved: enr.evaluation?.certificateApproved !== undefined ? enr.evaluation.certificateApproved : true,
    });
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment) return;

    setEvaluating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/project-enrollments/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          enrollmentId: selectedEnrollment.id,
          score: Number(evalForm.score),
          status: evalForm.status,
          strengths: evalForm.strengths,
          weaknesses: evalForm.weaknesses,
          improvements: evalForm.improvements,
          technicalRemarks: evalForm.technicalRemarks,
          evaluationDocumentUrl: evalForm.evaluationDocumentUrl,
          evaluatorName: evalForm.evaluatorName,
          stipendApproved: evalForm.stipendApproved,
          stipendAmount: evalForm.stipendApproved ? Number(evalForm.stipendAmount) : 0,
          certificateApproved: evalForm.certificateApproved,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        success(json.message || "Project evaluated successfully!");
        setSelectedEnrollment(null);
        loadEnrollments();
      } else {
        error(json.error || "Failed to submit evaluation");
      }
    } catch {
      error("Network error while submitting evaluation");
    } finally {
      setEvaluating(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enr) => {
    if (statusFilter !== "ALL" && enr.projectStatus !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      enr.studentName?.toLowerCase().includes(q) ||
      enr.studentEmail?.toLowerCase().includes(q) ||
      enr.projectTitle?.toLowerCase().includes(q) ||
      enr.projectId?.toLowerCase().includes(q) ||
      enr.id?.toLowerCase().includes(q)
    );
  });

  const totalCount = enrollments.length;
  const activeCount = enrollments.filter((e) => e.projectStatus === "ACTIVE").length;
  const pendingEvalCount = enrollments.filter((e) => ["SUBMITTED", "EVALUATION_PENDING", "UNDER_REVIEW"].includes(e.projectStatus)).length;
  const completedCount = enrollments.filter((e) => e.projectStatus === "COMPLETED").length;
  const lockedCount = enrollments.filter((e) => ["LOCKED", "EXPIRED"].includes(e.projectStatus)).length;

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects Control</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Student Project Enrollments & Lifecycle Control</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-project subscription tracker, 1-active-project rule enforcement, automatic deadline lock engine, and evaluation console.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEnrollments}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Live Sync</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Enrollments</span>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <span className="text-[10px] text-slate-500">Across 25 Blueprints</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-blue-400">Active In Progress</span>
          <div className="text-2xl font-black text-blue-300">{activeCount}</div>
          <span className="text-[10px] text-blue-400/80">1-Active Enforced</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-amber-400">Pending Evaluation</span>
          <div className="text-2xl font-black text-amber-300">{pendingEvalCount}</div>
          <span className="text-[10px] text-amber-400/80">Awaiting Review</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400">Completed & Graduated</span>
          <div className="text-2xl font-black text-emerald-300">{completedCount}</div>
          <span className="text-[10px] text-emerald-400/80">Certified Students</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-rose-400">Locked / Expired</span>
          <div className="text-2xl font-black text-rose-300">{lockedCount}</div>
          <span className="text-[10px] text-rose-400/80">Passed Deadline</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "ACTIVE", "SUBMITTED", "COMPLETED", "LOCKED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Enrollments */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span>Synchronizing student project lifecycle records...</span>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Enrollments Found</h3>
          <p className="text-xs text-slate-400">No project enrollments match your current search and filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Project</th>
                <th className="p-4">Duration & Deadline</th>
                <th className="p-4">Payment Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score & Stipend</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEnrollments.map((enr) => {
                const isPending = ["SUBMITTED", "EVALUATION_PENDING", "UNDER_REVIEW"].includes(enr.projectStatus);
                const isLocked = ["LOCKED", "EXPIRED"].includes(enr.projectStatus);
                const isDone = enr.projectStatus === "COMPLETED";

                return (
                  <tr key={enr.id} className="hover:bg-slate-900/90 transition">
                    <td className="p-4 space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{enr.studentName || "Student User"}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{enr.studentEmail}</div>
                      <div className="text-[10px] text-slate-600 font-mono">{enr.id}</div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="font-bold text-slate-100">{enr.projectTitle}</div>
                      <div className="text-[10px] text-indigo-400 font-mono">{enr.projectId}</div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{enr.durationMonths} Month{enr.durationMonths > 1 ? "s" : ""}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Due: {new Date(enr.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-[10px]">
                        {enr.remainingDays !== undefined && enr.remainingDays > 0 ? (
                          <span className="text-emerald-400 font-semibold">{enr.remainingDays} days left</span>
                        ) : isDone ? (
                          <span className="text-cyan-400">Completed Cycle</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">Expired</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 space-y-1">
                      {enr.paymentType === "NEXT_PROJECT_ACTIVATION" ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 inline-block">
                          ₹99 Fee Paid
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30 inline-block">
                          Full Plan Included
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : isPending
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                            : isLocked
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-3 h-3" /> : isLocked ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{enr.projectStatus}</span>
                      </span>
                    </td>

                    <td className="p-4 space-y-1">
                      {enr.evaluation?.score !== undefined ? (
                        <div className="font-bold text-white flex items-center gap-1">
                          <span className="text-indigo-400">{enr.evaluation.score}/100</span>
                          <span className="text-[10px] text-slate-500">Score</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">Not Evaluated</div>
                      )}

                      {enr.stipendAmount && enr.stipendAmount > 0 ? (
                        <div className="text-[10px] font-bold text-emerald-400">
                          ₹{enr.stipendAmount.toLocaleString()} Stipend
                        </div>
                      ) : null}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEvaluationModal(enr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto shadow-md ${
                          isPending
                            ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{enr.evaluation ? "Review Evaluation" : "Evaluate & Score"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    ACADEMIC & TECHNICAL EVALUATION BOARD
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{selectedEnrollment.id}</span>
                </div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Evaluate: {selectedEnrollment.projectTitle}</span>
                </h2>
              </div>
              <button
                onClick={() => setSelectedEnrollment(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
              >
                Close
              </button>
            </div>

            {/* Candidate & Project Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Student Candidate</span>
                <span className="font-bold text-white block mt-0.5">{selectedEnrollment.studentName}</span>
                <span className="text-[11px] text-slate-400">{selectedEnrollment.studentEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Timeline</span>
                <span className="font-semibold text-slate-200 block mt-0.5">{selectedEnrollment.durationMonths} Month Duration</span>
                <span className="text-[11px] text-slate-400">Due {new Date(selectedEnrollment.deadline).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Payment Model</span>
                <span className="font-semibold text-amber-400 block mt-0.5">
                  {selectedEnrollment.paymentType === "NEXT_PROJECT_ACTIVATION" ? "₹99 Next Project Activation" : "Full Plan Included"}
                </span>
              </div>
            </div>

            {/* Submission Links If Provided */}
            {selectedEnrollment.submission && (
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2 text-xs">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                  Student Final Submission Proof
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {selectedEnrollment.submission.githubRepoUrl && (
                    <a
                      href={selectedEnrollment.submission.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-200 flex items-center justify-between"
                    >
                      <span>GitHub Repository</span>
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    </a>
                  )}
                  {selectedEnrollment.submission.liveDemoUrl && (
                    <a
                      href={selectedEnrollment.submission.liveDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-slate-200 flex items-center justify-between"
                    >
                      <span>Live Deployment URL</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </a>
                  )}
                </div>
                {(selectedEnrollment.submission.architectureNotes || selectedEnrollment.submission.documentationText) && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    <span className="text-slate-300 font-semibold">Student Architecture Notes: </span>
                    {selectedEnrollment.submission.architectureNotes || selectedEnrollment.submission.documentationText}
                  </p>
                )}
              </div>
            )}

            {/* Evaluation Form */}
            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Evaluation Score (0 - 100) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={evalForm.score}
                    onChange={(e) => setEvalForm({ ...evalForm, score: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Decision Status *</label>
                  <select
                    value={evalForm.status}
                    onChange={(e) => setEvalForm({ ...evalForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-sm"
                  >
                    <option value="APPROVED">APPROVED (Full 8/8 Tasks Completed & Graduated)</option>
                    <option value="PARTIALLY_COMPLETED">PARTIALLY_COMPLETED (Partial Tasks e.g. 4/8 — Stipend Only, No Certificate)</option>
                    <option value="REVISION_REQUIRED">REVISION_REQUIRED (Feedback sent back)</option>
                    <option value="REJECTED">REJECTED (Did not meet standards)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Strengths & Core Competencies *</label>
                <textarea
                  rows={2}
                  required
                  value={evalForm.strengths}
                  onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
                  placeholder="e.g. Excellent architectural separation, strong validation, scalable state management..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Areas for Improvement / Weaknesses</label>
                <textarea
                  rows={2}
                  value={evalForm.weaknesses}
                  onChange={(e) => setEvalForm({ ...evalForm, weaknesses: e.target.value })}
                  placeholder="e.g. Expand automated test suites, improve database query indexation..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Official Technical Remarks *</label>
                <input
                  type="text"
                  required
                  value={evalForm.technicalRemarks}
                  onChange={(e) => setEvalForm({ ...evalForm, technicalRemarks: e.target.value })}
                  placeholder="Official SC TECH assessment verdict..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              {/* Document & Evaluator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Evaluation Document Link (PDF/Drive)</label>
                  <input
                    type="url"
                    value={evalForm.evaluationDocumentUrl}
                    onChange={(e) => setEvalForm({ ...evalForm, evaluationDocumentUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Evaluator Name & Board</label>
                  <input
                    type="text"
                    value={evalForm.evaluatorName}
                    onChange={(e) => setEvalForm({ ...evalForm, evaluatorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              {/* Stipend & Certificate Controls */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  Stipend Authorization & Certificate Clearance
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evalForm.stipendApproved}
                      onChange={(e) => setEvalForm({ ...evalForm, stipendApproved: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span className="font-semibold">Authorize Performance Stipend</span>
                  </label>

                  {evalForm.stipendApproved && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">Amount:</span>
                      <select
                        value={evalForm.stipendAmount}
                        onChange={(e) => setEvalForm({ ...evalForm, stipendAmount: Number(e.target.value) })}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold"
                      >
                        <option value={5000}>₹5,000 (8/8 Full Tasks Approved)</option>
                        <option value={2500}>₹2,500 (6-7 Tasks Approved)</option>
                        <option value={1000}>₹1,000 (4/8 Partial Tasks Approved)</option>
                        <option value={0}>₹0 (Not Eligible)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <label className={`flex items-center gap-2 text-slate-200 ${evalForm.status === "PARTIALLY_COMPLETED" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      disabled={evalForm.status === "PARTIALLY_COMPLETED"}
                      checked={evalForm.status !== "PARTIALLY_COMPLETED" && evalForm.certificateApproved}
                      onChange={(e) => setEvalForm({ ...evalForm, certificateApproved: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="font-semibold">Clear for Project Certificate Generation (Signed by Charudeshna & Sridharan)</span>
                  </label>
                  {evalForm.status === "PARTIALLY_COMPLETED" && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      ⚠️ Partial completion grants stipend eligibility but strictly blocks certificate issuance until all 8 tasks are completed.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEnrollment(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evaluating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {evaluating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Final Evaluation & Unlock Cycle</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
