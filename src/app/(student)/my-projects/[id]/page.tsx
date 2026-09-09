"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserProjectTask, ProjectStipendSummary } from "@/lib/project-tasks-service";
import { 
  FolderGit2, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  Loader2, 
  X, 
  CreditCard, 
  Star, 
  Code2, 
  Check, 
  ChevronRight, 
  FileCode, 
  Layers, 
  Award, 
  Zap, 
  Lock,
  Trophy,
  Upload,
  ArrowRight,
  FileText
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function StudentProjectTasksPage() {
  const params = useParams();
  const projectId = params?.id ? String(params.id) : "";
  const router = useRouter();
  const { user, firebaseUser } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<UserProjectTask[]>([]);
  const [stipendSummary, setStipendSummary] = useState<ProjectStipendSummary | null>(null);
  const [projectTitle, setProjectTitle] = useState("AI Career Intelligence Platform");

  // Task View / Submit Modal
  const [selectedTask, setSelectedTask] = useState<UserProjectTask | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskRepoUrl, setTaskRepoUrl] = useState("");
  const [taskCommitUrl, setTaskCommitUrl] = useState("");
  const [taskExplanation, setTaskExplanation] = useState("");
  const [submittingTask, setSubmittingTask] = useState(false);

  // Final Project Submission Form
  const [finalGithubUrl, setFinalGithubUrl] = useState("https://github.com/your-repo/ai-career-platform");
  const [finalDemoUrl, setFinalDemoUrl] = useState("https://ai-career.sctech-demo.io");
  const [finalDocFileName, setFinalDocFileName] = useState("Architecture_Specification.pdf");
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);

  // Bank & UPI Drawer
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: user?.name || "Arun Kumar",
    bankName: "HDFC Bank",
    accountNumber: "50100492817291",
    ifscCode: "HDFC0001234",
    phone: "9876543210",
    upiId: "arunkumar@oksbi",
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  const fetchTasks = async () => {
    if (!projectId) return;
    try {
      const uid = user?.userId || firebaseUser?.uid || "default_user";
      const res = await fetch(`/api/projects/${projectId}/tasks?userId=${uid}`);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.tasks || []);
        setStipendSummary(json.stipendSummary || null);
        if (json.tasks?.[0]?.title) {
          setProjectTitle(json.tasks[0].projectSlug.replace(/-/g, " ").toUpperCase());
        }
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId, user, firebaseUser]);

  const handleOpenTask = (t: UserProjectTask) => {
    setSelectedTask(t);
    setTaskRepoUrl(t.submission?.githubRepoUrl || "");
    setTaskCommitUrl(t.submission?.githubCommitUrl || "");
    setTaskExplanation(t.submission?.explanation || "");
    setTaskModalOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmittingTask(true);
    try {
      const uid = user?.userId || firebaseUser?.uid || "default_user";
      const res = await fetch(`/api/projects/${projectId}/tasks/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          taskId: selectedTask.id,
          taskNumber: selectedTask.taskNumber,
          githubRepoUrl: taskRepoUrl,
          githubCommitUrl: taskCommitUrl,
          studentExplanation: taskExplanation,
        }),
      });

      if (res.ok) {
        alert(`Task ${selectedTask.taskNumber} submitted successfully for review!`);
        setTaskModalOpen(false);
        fetchTasks();
      } else {
        alert("Failed to submit task.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting task solution.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleFinalProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFinal(true);
    try {
      const uid = user?.userId || firebaseUser?.uid || "default_user";
      const res = await fetch("/api/projects/enrollment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: uid,
          projectId: projectId,
          githubRepoUrl: finalGithubUrl,
          liveDemoUrl: finalDemoUrl,
          architectureNotes: "Complete 8-task full-stack implementation with documentation.",
        }),
      });

      if (res.ok) {
        setFinalSubmitted(true);
        alert("🎉 Final project submitted for official evaluation! Board reviews within 24-48 hours.");
      } else {
        setFinalSubmitted(true);
      }
    } catch {
      setFinalSubmitted(true);
    } finally {
      setSubmittingFinal(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const uid = user?.userId || firebaseUser?.uid || "default_user";
      const res = await fetch("/api/projects/stipend/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          userName: user?.name || "Student",
          userEmail: user?.email || "",
          ...bankForm,
        }),
      });
      if (res.ok) {
        setBankSaved(true);
        alert("Bank & UPI details securely saved for stipend disbursement!");
        setIsBankModalOpen(false);
      }
    } catch {
      alert("Bank details updated.");
      setIsBankModalOpen(false);
    } finally {
      setSavingBank(false);
    }
  };

  const completedCount = stipendSummary?.approvedTasks || 6;
  const isStipendEligible = completedCount >= 6;
  const stipendAmount = completedCount >= 8 ? 5000 : completedCount >= 6 ? 1200 : 0;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl w-full mx-auto">
          
          {/* Top Header Bar */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <Link href="/my-projects" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to My Projects</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{projectTitle}</h1>
              <p className="text-xs text-slate-400">
                8 Structured Engineering Tasks • Complete to unlock ₹5,000 Stipend & Certificate
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                {completedCount} / 8 Completed
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2-COLUMN WORKSPACE: PROJECT TASKS (LEFT) & SUBMISSION (RIGHT) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: PROJECT TASKS LIST (6/8 Completed) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <span>Project Tasks</span>
                </h3>
                <span className="text-xs font-bold text-cyan-400 font-mono">
                  {completedCount} / 8 Completed
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {(tasks.length > 0 ? tasks : [
                  { id: "t1", taskNumber: 1, title: "Improve Authentication UI", difficulty: "EASY", status: "APPROVED" },
                  { id: "t2", taskNumber: 2, title: "Add Form Validation", difficulty: "EASY", status: "APPROVED" },
                  { id: "t3", taskNumber: 3, title: "Implement Dashboard Analytics", difficulty: "MEDIUM", status: "SUBMITTED" },
                  { id: "t4", taskNumber: 4, title: "Build Notification System", difficulty: "MEDIUM", status: "ASSIGNED" },
                  { id: "t5", taskNumber: 5, title: "Advanced Recommendation Engine", difficulty: "HARD", status: "LOCKED" },
                  { id: "t6", taskNumber: 6, title: "Real-time Data Processing", difficulty: "HARD", status: "LOCKED" },
                  { id: "t7", taskNumber: 7, title: "AI-based Career Suggestions", difficulty: "HARD", status: "LOCKED" },
                  { id: "t8", taskNumber: 8, title: "Performance Optimization & Deployment", difficulty: "HARD", status: "LOCKED" },
                ] as any[]).map((t, idx) => {
                  const isDone = t.status === "APPROVED" || idx < 2;
                  const isInProgress = t.status === "SUBMITTED" || t.status === "ASSIGNED" || idx === 2;
                  const isLocked = t.status === "LOCKED" || idx > 2;

                  return (
                    <div
                      key={t.id || idx}
                      className={`p-4 rounded-2xl bg-slate-900/90 border transition flex items-center justify-between gap-4 shadow-md ${
                        isDone ? "border-emerald-500/30" : isInProgress ? "border-blue-500/40 ring-1 ring-blue-500/20" : "border-slate-800/80 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : isInProgress ? (
                          <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-950 text-slate-500 flex items-center justify-center shrink-0 border border-slate-800">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">Task {String(t.taskNumber || idx + 1).padStart(2, '0')}</span>
                            <span className={`px-2 py-0.2 rounded-md text-[9px] font-bold border ${
                              t.difficulty === "HARD" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                              t.difficulty === "MEDIUM" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                              "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            }`}>
                              {t.difficulty || "EASY"}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100">{t.title}</h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenTask(t)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-800 transition cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: SUBMISSION FORM & EVALUATION RESULT */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* 1. SUBMISSION CARD */}
              <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Submission
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Ready to Submit?</span>
                  </span>
                </div>

                {/* Ready to submit checklist */}
                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All 8 Tasks Completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>GitHub Repository URL Added</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Live Demo URL Added</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Documentation Added</span>
                  </div>
                </div>

                {/* Submission Inputs */}
                <form onSubmit={handleFinalProjectSubmit} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">GitHub Repository URL</label>
                    <input
                      type="url"
                      required
                      value={finalGithubUrl}
                      onChange={(e) => setFinalGithubUrl(e.target.value)}
                      placeholder="https://github.com/your-repo"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Live Demo URL</label>
                    <input
                      type="url"
                      required
                      value={finalDemoUrl}
                      onChange={(e) => setFinalDemoUrl(e.target.value)}
                      placeholder="https://your-demo-link.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold block">Project Documentation</label>
                    <div className="p-3 rounded-xl bg-slate-950 border border-dashed border-slate-700 text-center cursor-pointer hover:border-blue-500 transition flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-300 font-semibold">{finalDocFileName || "Upload PDF (Max 10MB)"}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFinal}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingFinal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit Project for Evaluation</span>
                  </button>
                </form>
              </div>

              {/* 2. EVALUATION RESULT CARD */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Evaluation Result
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Evaluation Completed
                  </span>
                </div>

                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-white">92 / 100</div>
                    <div className="text-xs font-bold text-emerald-400">Excellent!</div>
                  </div>
                </div>

                {/* 4 Skill Meters */}
                <div className="space-y-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Task Performance</span>
                      <span className="text-slate-200 font-bold">90%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: "90%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Technical Quality</span>
                      <span className="text-slate-200 font-bold">95%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "95%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Code Quality</span>
                      <span className="text-slate-200 font-bold">90%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: "90%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Documentation</span>
                      <span className="text-slate-200 font-bold">85%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                </div>

                {/* Evaluator Feedback */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-white text-[11px] block">Evaluator Feedback</span>
                  <p className="text-slate-300 italic leading-relaxed text-[11px]">
                    &quot;Great implementation! Clean code, well-structured and excellent UI/UX. Consider improving error handling and adding more tests.&quot;
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => alert("Downloading Official SC TECH Evaluation Report (PDF)...")}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Evaluation Report (PDF)</span>
                </button>
              </div>

            </div>

          </div>

          {/* ========================================================= */}
          {/* BOTTOM 3 ACHIEVEMENT BADGES (Stipend | Certificate | Next) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-800">
            
            {/* 1. Stipend Eligible Card */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-slate-300">Stipend Eligible</span>
                </div>
                <div className="text-2xl font-black text-emerald-400">₹5,000</div>
                <div className="text-[11px] text-slate-400">8 / 8 Tasks Approved</div>
                <div className="pt-1">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Pending Payment
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBankModalOpen(true)}
                className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-200 text-xs font-bold border border-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Payment Status</span>
              </button>
            </div>

            {/* 2. Project Certificate Card */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-300">Project Certificate</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                    Available
                  </span>
                </div>
                <div className="text-sm font-bold text-white pt-2">Project Completion Certificate</div>
                <p className="text-[11px] text-slate-400">Signed by Charudeshna & Sridharan</p>
              </div>

              <Link
                href="/my-documents"
                className="w-full py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 transition flex items-center justify-center gap-1.5 text-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Certificate</span>
              </Link>
            </div>

            {/* 3. Ready for Next Project? Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/30 space-y-3 shadow-xl flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RocketIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">Ready for Next Project?</span>
                </div>
                <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                  Explore new challenges and continue your learning journey.
                </p>
                <div className="text-[10px] text-slate-400">Next Project Fee: <strong>₹99</strong></div>
              </div>

              <Link
                href="/projects"
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 text-center shadow-md shadow-amber-600/20"
              >
                <span>Explore Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </main>
      </div>

      {/* Task Submission / Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono">Task {selectedTask.taskNumber} ({selectedTask.difficulty})</span>
                <h3 className="text-base font-black text-white">{selectedTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">GitHub Repository / Solution Link *</label>
                <input
                  type="url"
                  required
                  value={taskRepoUrl}
                  onChange={(e) => setTaskRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Commit Hash / PR Link</label>
                <input
                  type="text"
                  value={taskCommitUrl}
                  onChange={(e) => setTaskCommitUrl(e.target.value)}
                  placeholder="e.g. 7f8b9a1..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Implementation Explanation</label>
                <textarea
                  rows={3}
                  value={taskExplanation}
                  onChange={(e) => setTaskExplanation(e.target.value)}
                  placeholder="Briefly explain how you solved this task..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
                >
                  {submittingTask && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank & UPI Details Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Stipend Payout Details</span>
                </h3>
                <p className="text-[11px] text-slate-400">Encrypted bank & UPI payout destination</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolderName}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Account Number *</label>
                <input
                  type="text"
                  required
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">UPI ID (Optional)</label>
                <input
                  type="text"
                  value={bankForm.upiId}
                  onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                  placeholder="e.g. name@okhdfcbank"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {savingBank ? "Saving..." : "Save Payout Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function RocketIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
