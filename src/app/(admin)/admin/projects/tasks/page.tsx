"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Search, 
  Filter, 
  ExternalLink, 
  Loader2, 
  RotateCcw, 
  Check, 
  Send, 
  Code2, 
  Award, 
  Eye, 
  Star,
  User,
  Clock
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { UserProjectTask } from "@/lib/project-tasks-service";

export default function AdminProjectTasksEvaluationPage() {
  const [tasks, setTasks] = useState<UserProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "userProjectTasks"));
      const list: UserProjectTask[] = [];
      snap.forEach((d) => list.push(d.data() as UserProjectTask));
      setTasks(list);
    } catch (err) {
      console.error("Error fetching admin tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleEvaluate = async (task: UserProjectTask, status: "APPROVED" | "REJECTED") => {
    const feedback = window.prompt(
      `Enter evaluation feedback for Task #${task.taskNumber} (${task.title}):`,
      status === "APPROVED" 
        ? "Excellent technical execution. All requirements verified and code standards met."
        : "Please review requirements and provide a detailed explanation of your implementation."
    );
    if (feedback === null) return;

    setEvaluatingTaskId(task.id);
    try {
      const res = await fetch("/api/admin/projects/evaluate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          status,
          score: status === "APPROVED" ? 100 : 40,
          feedback,
          reviewer: "SC TECH Technical Assessment Board",
        }),
      });

      if (res.ok) {
        await fetchTasks();
      } else {
        const d = await res.json();
        alert(d.error || "Evaluation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred during evaluation");
    } finally {
      setEvaluatingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      !q || 
      t.title?.toLowerCase().includes(q) || 
      t.userId?.toLowerCase().includes(q) || 
      t.projectId?.toLowerCase().includes(q) ||
      t.submission?.explanation?.toLowerCase().includes(q);

    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const submittedCount = tasks.filter((t) => t.status === "SUBMITTED" || t.status === "UNDER_REVIEW").length;
  const approvedCount = tasks.filter((t) => t.status === "APPROVED").length;
  const rejectedCount = tasks.filter((t) => t.status === "REJECTED").length;

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/projects" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Project Task Evaluation Queue</h1>
              <p className="text-xs text-slate-400">Review student pull requests, evaluate milestones, and grade performance.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/projects/stipends"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>Stipend Disbursement Console</span>
          </Link>

          <button
            type="button"
            onClick={fetchTasks}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Assigned Tasks</span>
          <div className="text-2xl font-black text-white">{tasks.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-blue-400">Pending Review</span>
          <div className="text-2xl font-black text-white">{submittedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400">Approved Milestones</span>
          <div className="text-2xl font-black text-white">{approvedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-red-400">Revisions Requested</span>
          <div className="text-2xl font-black text-white">{rejectedCount}</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student, project, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Revision Requested</option>
          <option value="ASSIGNED">Assigned (No Submission)</option>
        </select>
      </div>

      {/* Task List Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs">Loading task submission queue...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Code2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No task submissions found</h3>
            <p className="text-xs text-slate-500">Student submissions will appear here for evaluation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-4">Task</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Submission Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((t) => {
                  const isEvaluating = evaluatingTaskId === t.id;
                  const isSubmitted = t.status === "SUBMITTED" || t.status === "UNDER_REVIEW";

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span className="text-blue-400">#{t.taskNumber}</span>
                          <span>{t.title}</span>
                          {t.isImportant && (
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${
                          t.difficulty === "EASY" ? "text-emerald-400" : t.difficulty === "MEDIUM" ? "text-amber-400" : "text-rose-400"
                        }`}>
                          {t.difficulty}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        {t.userId}
                      </td>

                      <td className="p-4 text-slate-300">
                        {t.projectId}
                      </td>

                      <td className="p-4 max-w-xs">
                        {t.submission ? (
                          <div className="space-y-1">
                            {t.submission.githubRepoUrl && (
                              <a
                                href={t.submission.githubRepoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>GitHub Repository</span>
                              </a>
                            )}
                            <p className="text-slate-400 text-[11px] line-clamp-2">
                              {t.submission.explanation}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">No submission yet</span>
                        )}
                      </td>

                      <td className="p-4">
                        {t.status === "APPROVED" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            APPROVED ✓
                          </span>
                        ) : isSubmitted ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold animate-pulse">
                            SUBMITTED
                          </span>
                        ) : t.status === "REJECTED" ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                            REJECTED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                            ASSIGNED
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isEvaluating}
                            onClick={() => handleEvaluate(t, "APPROVED")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            disabled={isEvaluating}
                            onClick={() => handleEvaluate(t, "REJECTED")}
                            className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
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
      </div>

    </div>
  );
}
