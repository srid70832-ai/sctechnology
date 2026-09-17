"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProblemStatement, ProblemProject, getProblemStatementById } from "@/lib/problem-statements";
import { 
  Rocket, 
  ArrowLeft, 
  Save, 
  Github, 
  ExternalLink, 
  Video, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Users, 
  Plus, 
  Lock 
} from "lucide-react";

export default function BuildProjectPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [problem, setProblem] = useState<ProblemStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Existing project or new project form
  const [existingProjectId, setExistingProjectId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, setForm] = useState<Partial<ProblemProject>>({
    title: "",
    description: "",
    teamName: "",
    technologies: [],
    githubUrl: "",
    demoUrl: "",
    documentationUrl: "",
    videoUrl: "",
    presentationUrl: "",
    submissionStatus: "DRAFT",
  });

  const [newTech, setNewTech] = useState("");

  useEffect(() => {
    async function loadProblemAndProject() {
      if (!rawId) return;
      try {
        const p = await getProblemStatementById(rawId);
        setProblem(p);

        if (firebaseUser?.uid) {
          // Check if user already started a project for this problem
          const projQ = query(
            collection(db, "projects"),
            where("problemStatementId", "==", p?.id || rawId),
            where("ownerId", "==", firebaseUser.uid)
          );
          const snap = await getDocs(projQ);
          if (!snap.empty) {
            const docData = snap.docs[0].data() as ProblemProject;
            setExistingProjectId(snap.docs[0].id);
            setForm(docData);
            if (docData.submissionStatus === "SUBMITTED" || docData.submissionStatus === "UNDER_REVIEW") {
              setIsSubmitted(true);
            }
          }
        }
      } catch (err) {
        console.error("Error loading project workspace:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProblemAndProject();
  }, [rawId, firebaseUser]);

  const addTech = () => {
    if (!newTech.trim()) return;
    setForm({ ...form, technologies: [...(form.technologies || []), newTech.trim()] });
    setNewTech("");
  };

  const removeTech = (index: number) => {
    setForm({
      ...form,
      technologies: form.technologies?.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (status: ProblemProject["submissionStatus"]) => {
    if (!firebaseUser?.uid || !user) {
      router.push(`/login?redirect=/problem-statements/${rawId}/build`);
      return;
    }

    if (status === "SUBMITTED" && (!form.title || !form.description || !form.githubUrl)) {
      error("Please fill in project title, description, and GitHub repository URL.");
      return;
    }

    setSaving(true);
    try {
      if (existingProjectId) {
        // Update existing project
        const docRef = doc(db, "projects", existingProjectId);
        await updateDoc(docRef, {
          ...form,
          submissionStatus: status,
          submittedAt: status === "SUBMITTED" ? serverTimestamp() : form.submittedAt || null,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new project
        const docRef = await addDoc(collection(db, "projects"), {
          ...form,
          problemStatementId: problem?.id || rawId,
          problemTitle: problem?.title || "Challenge",
          ownerId: firebaseUser.uid,
          ownerName: user.name || "Student",
          ownerEmail: user.email || "",
          submissionStatus: status,
          submittedAt: status === "SUBMITTED" ? serverTimestamp() : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setExistingProjectId(docRef.id);
      }

      // Add Notification if final submission
      if (status === "SUBMITTED") {
        await addDoc(collection(db, "notifications"), {
          userId: firebaseUser.uid,
          title: "Project Submitted Successfully!",
          message: `Your project "${form.title}" was submitted for review. Judges will evaluate your submission.`,
          type: "PROJECT",
          read: false,
          link: `/dashboard`,
          createdAt: serverTimestamp(),
        });
        setIsSubmitted(true);
        success("Project submitted successfully for evaluation! 🚀");
      } else {
        success("Project draft saved!");
      }
    } catch (err: any) {
      console.error("Failed to save project workspace:", err);
      error(err?.message || "Failed to save project");
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
          <span>Opening project builder workspace...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        <Link href={`/problem-statements/${problem?.id || rawId}`} className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Challenge Details</span>
        </Link>

        {/* Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                PROJECT SUBMISSION WORKSPACE
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {problem?.title || "Problem Statement Builder"}
              </h1>
            </div>

            {isSubmitted && (
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Submitted for Review</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Submit your working prototype, repository links, video demonstration, and architecture summary.
          </p>
        </div>

        {/* Project Form */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 text-xs">
          
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Project Title *</label>
            <input
              type="text"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              disabled={isSubmitted}
              placeholder="e.g. ApexMesh — Distributed Real-Time Telemetry Engine"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Team Name (Optional if solo)</label>
            <input
              type="text"
              value={form.teamName || ""}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              disabled={isSubmitted}
              placeholder="e.g. Team ByteForge"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Solution Architecture & Description *</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={isSubmitted}
              rows={5}
              placeholder="Describe your technical architecture, how it addresses the core challenge, benchmarks achieved, and key algorithms..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 disabled:opacity-60"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Technologies Used</label>
            {!isSubmitted && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="e.g. Next.js, Docker, WebSockets"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Add
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {form.technologies?.map((tech, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold flex items-center gap-1.5">
                  <span>{tech}</span>
                  {!isSubmitted && (
                    <button type="button" onClick={() => removeTech(idx)} className="text-slate-400 hover:text-white">✕</button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Submission Links */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Repository & Demo Artifacts</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository URL *</span>
                </label>
                <input
                  type="url"
                  value={form.githubUrl || ""}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  disabled={isSubmitted}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Demo Deployment URL</span>
                </label>
                <input
                  type="url"
                  value={form.demoUrl || ""}
                  onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
                  disabled={isSubmitted}
                  placeholder="https://my-app.vercel.app"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>Video Demo Walkthrough URL (YouTube/Loom)</span>
                </label>
                <input
                  type="url"
                  value={form.videoUrl || ""}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  disabled={isSubmitted}
                  placeholder="https://youtu.be/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Documentation / Presentation Slide URL</span>
                </label>
                <input
                  type="url"
                  value={form.presentationUrl || ""}
                  onChange={(e) => setForm({ ...form, presentationUrl: e.target.value })}
                  disabled={isSubmitted}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          {!isSubmitted ? (
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleSave("DRAFT")}
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Save Progress as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSave("SUBMITTED")}
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                <span>Submit Project for Review</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <span className="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your project has been submitted and is locked for judge evaluation.</span>
              </span>
              <p className="text-[11px] text-slate-400">
                You can track your evaluation results and score from your student dashboard.
              </p>
            </div>
          )}

        </div>

      </main>

      <Footer />
    </div>
  );
}
