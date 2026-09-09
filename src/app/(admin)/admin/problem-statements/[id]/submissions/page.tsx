"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, doc, query, where, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  ProblemStatement, 
  ProblemProject, 
  ProblemEvaluation, 
  getProblemStatementById,
  DEFAULT_EVALUATION_CRITERIA 
} from "@/lib/problem-statements";
import { 
  FileCode2, 
  ArrowLeft, 
  Users, 
  ExternalLink, 
  Github, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Loader2, 
  Video, 
  FileText, 
  Search,
  Star,
  MessageSquare
} from "lucide-react";

export default function AdminProblemSubmissionsPage() {
  const params = useParams();
  const problemId = params.id as string;

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [problem, setProblem] = useState<ProblemStatement | null>(null);
  const [projects, setProjects] = useState<ProblemProject[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, ProblemEvaluation>>({});
  const [loading, setLoading] = useState(true);

  // Active submission for evaluation / AI analysis
  const [activeProject, setActiveProject] = useState<ProblemProject | null>(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  const loadData = async () => {
    try {
      const p = await getProblemStatementById(problemId);
      setProblem(p);

      // Load projects for this problem
      const projQ = query(collection(db, "projects"), where("problemStatementId", "==", problemId));
      const projSnap = await getDocs(projQ);
      const projList: ProblemProject[] = [];
      projSnap.forEach((d) => {
        projList.push({ id: d.id, ...(d.data() as ProblemProject) });
      });
      setProjects(projList);

      // Load evaluations
      const evalQ = query(collection(db, "evaluations"), where("problemStatementId", "==", problemId));
      const evalSnap = await getDocs(evalQ);
      const evalMap: Record<string, ProblemEvaluation> = {};
      evalSnap.forEach((d) => {
        const item = { id: d.id, ...(d.data() as ProblemEvaluation) };
        evalMap[item.projectId] = item;
      });
      setEvaluations(evalMap);
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [problemId]);

  const openEvaluationModal = (project: ProblemProject) => {
    setActiveProject(project);
    const existing = evaluations[project.id!];
    if (existing) {
      setScores(existing.scores || {});
      setFeedback(existing.feedback || "");
    } else {
      const defaultScores: Record<string, number> = {};
      (problem?.evaluationCriteria || DEFAULT_EVALUATION_CRITERIA).forEach((c) => {
        defaultScores[c.category] = Math.round(c.maxMarks * 0.8);
      });
      setScores(defaultScores);
      setFeedback("");
    }
    setAiAnalysis(null);
    setEvalModalOpen(true);
  };

  const handleRunAiAnalysis = async () => {
    if (!activeProject || !problem) return;
    setAnalyzingAi(true);
    try {
      const res = await fetch("/api/ai/analyze-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle: problem.title,
          problemDescription: problem.fullProblemDescription,
          projectTitle: activeProject.title,
          projectDescription: activeProject.description,
          githubUrl: activeProject.githubUrl,
          demoUrl: activeProject.demoUrl,
          technologies: activeProject.technologies,
        }),
      });

      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiAnalysis(data.analysis);
        success("Gemini AI Advisory Analysis generated!");
      } else {
        error(data.error || "AI Analysis failed");
      }
    } catch {
      error("AI analysis network error");
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSaveEvaluation = async (newStatus?: ProblemProject["submissionStatus"]) => {
    if (!activeProject?.id || !firebaseUser?.uid || !problem) return;

    setEvaluating(true);
    try {
      const totalScore = Object.values(scores).reduce((a, b) => Number(a) + Number(b), 0);

      // Save or update evaluation
      await addDoc(collection(db, "evaluations"), {
        projectId: activeProject.id,
        problemStatementId: problemId,
        judgeId: firebaseUser.uid,
        judgeName: user?.name || "Judge / Admin",
        scores,
        totalScore,
        feedback,
        createdAt: serverTimestamp(),
      });

      // Update project status
      if (newStatus) {
        await updateDoc(doc(db, "projects", activeProject.id), {
          submissionStatus: newStatus,
          updatedAt: serverTimestamp(),
        });
      }

      success(`Evaluation saved! Total Score: ${totalScore}`);
      setEvalModalOpen(false);
      await loadData();
    } catch {
      error("Failed to save evaluation");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading problem submissions...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin/problem-statements" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Problem Statements</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Project Submissions Evaluation</span>
          </h1>
          <p className="text-xs text-slate-400">
            Evaluating submissions for: <strong className="text-white">{problem?.title}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            {projects.length} Total Submissions
          </span>
        </div>
      </div>

      {/* Submissions Table */}
      {projects.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <FileCode2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No submissions yet</h3>
          <p className="text-xs text-slate-400">Student submissions will appear here once submitted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const ev = evaluations[proj.id!];
            return (
              <div
                key={proj.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      proj.submissionStatus === "WINNER" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                      proj.submissionStatus === "SHORTLISTED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                      proj.submissionStatus === "SUBMITTED" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {proj.submissionStatus}
                    </span>

                    {ev && (
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                        <span>Score: {ev.totalScore} pts</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{proj.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      By: <strong className="text-slate-200">{proj.ownerName}</strong> {proj.teamName && `• Team: ${proj.teamName}`}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>

                  {/* Links */}
                  <div className="flex flex-wrap gap-2 pt-2 text-xs">
                    {proj.githubUrl && (
                      <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white">
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                    {proj.videoUrl && (
                      <a href={proj.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:text-white">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: {proj.id?.slice(0, 8)}...
                  </span>

                  <button
                    type="button"
                    onClick={() => openEvaluationModal(proj)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{ev ? "Update Evaluation" : "Evaluate & Score"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evaluation & AI Advisory Modal */}
      <AnimatePresence>
        {evalModalOpen && activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white">Evaluate: {activeProject.title}</h3>
                  <p className="text-xs text-slate-400">By {activeProject.ownerName}</p>
                </div>
                <button onClick={() => setEvalModalOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>

              {/* AI Analysis Trigger */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Gemini AI Judge Advisory Assistant</span>
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Analyze project alignment, technical strengths, and get presentation interview questions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunAiAnalysis}
                  disabled={analyzingAi}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {analyzingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Run AI Analysis</span>
                </button>
              </div>

              {/* AI Results Output */}
              {aiAnalysis && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-emerald-400 font-bold">
                      Alignment Score: {aiAnalysis.problemAlignmentScore}%
                    </span>
                    <span className="text-[10px] text-amber-400 uppercase font-mono">Advisory Only</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{aiAnalysis.alignmentSummary}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Strengths:</span>
                      <ul className="list-disc list-inside text-emerald-300 space-y-0.5">
                        {aiAnalysis.technicalStrengths?.map((st: string, idx: number) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Suggested Questions:</span>
                      <ul className="list-disc list-inside text-indigo-300 space-y-0.5">
                        {aiAnalysis.suggestedInterviewQuestions?.map((q: string, idx: number) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Scoring Form */}
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-white uppercase tracking-wider">Evaluation Rubric Marks</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(problem?.evaluationCriteria || DEFAULT_EVALUATION_CRITERIA).map((crit) => (
                    <div key={crit.category} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>{crit.category}</span>
                        <span className="text-blue-400 font-mono">Max {crit.maxMarks}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={crit.maxMarks}
                        value={scores[crit.category] ?? 0}
                        onChange={(e) => setScores({ ...scores, [crit.category]: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Judge Constructive Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    placeholder="Provide recommendations, highlights, and improvements..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-white font-bold">
                  Total Score: <span className="text-emerald-400 text-sm">{Object.values(scores).reduce((a, b) => Number(a) + Number(b), 0)} pts</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation("SHORTLISTED")}
                    disabled={evaluating}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation("WINNER")}
                    disabled={evaluating}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    Mark as Winner 🏆
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation()}
                    disabled={evaluating}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    Save Score
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
