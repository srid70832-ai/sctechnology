"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ProjectData } from "@/lib/projects-data";
import { ProjectActivationModal } from "@/components/projects/ProjectActivationModal";
import { ProjectDurationOption } from "@/lib/project-lifecycle-service";
import { 
  FolderGit2, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Award, 
  Layers, 
  Code2, 
  Zap, 
  Calendar, 
  ShieldCheck, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Terminal,
  Bookmark
  ,Lock
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const rawId = params?.id as string;
  const router = useRouter();

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState<"Overview" | "Features" | "Tech Stack" | "Learning Outcomes" | "Tasks" | "FAQ">("Overview");
  
  // Right Sidebar Duration Selector
  const [selectedDuration, setSelectedDuration] = useState<ProjectDurationOption>("2_MONTHS");
  const [activationModalOpen, setActivationModalOpen] = useState(false);

  useEffect(() => {
    if (!rawId) return;
    fetch(`/api/projects/${encodeURIComponent(rawId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Project unavailable");
        const data = await response.json();
        setProject(data.project || null);
      })
      .catch(() => setAccessDenied(true));
  }, [rawId]);

  if (accessDenied && !project) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-24 text-center">
          <Lock className="w-12 h-12 text-blue-400 mx-auto mb-5" />
          <h1 className="text-3xl font-black text-white">Project Not Found</h1>
          <p className="mt-4 text-slate-300">The requested real-world project could not be found or is archived.</p>
          <Link href="/projects" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500">
            Back to Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-slate-400">
        <span>Loading project details...</span>
      </div>
    );
  }

  const getStartDateStr = () => {
    return new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getCompletionDateStr = (dur: ProjectDurationOption) => {
    const d = new Date();
    if (dur === "1_MONTH") d.setMonth(d.getMonth() + 1);
    else if (dur === "2_MONTHS") d.setMonth(d.getMonth() + 2);
    else if (dur === "3_MONTHS") d.setMonth(d.getMonth() + 3);
    else if (dur === "4_MONTHS") d.setMonth(d.getMonth() + 4);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const DURATION_RADIO_OPTIONS: { id: ProjectDurationOption; label: string }[] = [
    { id: "1_MONTH", label: "1 Month" },
    { id: "2_MONTHS", label: "2 Months" },
    { id: "3_MONTHS", label: "3 Months" },
    { id: "4_MONTHS", label: "4 Months" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 space-y-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/projects" className="hover:text-white transition">Projects</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white font-semibold line-clamp-1">{project.title}</span>
        </div>

        {/* 2-Column Layout (Left Main Details + Right Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: HERO, STATS, TABS & CONTENT                  */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Visual Header Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
              <div className="relative w-full h-48 sm:h-56 rounded-2xl bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 blur-xl" />
                <FolderGit2 className="w-20 h-20 text-blue-400/80" />
                <div className="absolute bottom-3 left-4 text-xs font-mono text-cyan-300">
                  {project.category} • Blueprint v1.0
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                    {project.category}
                  </span>

                  {String(project.accessType || (project as any).accessLevel || "").toUpperCase() === "FREE" || (project as any).isFree ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> FREE ACCESS
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-400" /> PRO PROJECT
                    </span>
                  )}

                  <span className="text-xs text-slate-400 font-mono">ID: {project.id}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white">{project.title}</h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {project.shortDescription}
                </p>
              </div>

              {/* Tech Stack Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {project.technologyStack?.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-slate-950 text-xs font-mono text-slate-300 border border-slate-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* 4-Column Metrics Bar (Difficulty | 8 Tasks | Duration | Max Stipend) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
                <div className="p-3 rounded-2xl bg-slate-950 text-center space-y-0.5 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">DIFFICULTY</span>
                  <span className="text-xs font-bold text-amber-400">{project.difficulty}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 text-center space-y-0.5 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">TASKS</span>
                  <span className="text-xs font-bold text-cyan-400">8 Tasks</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 text-center space-y-0.5 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">DURATION</span>
                  <span className="text-xs font-bold text-slate-200">{project.estimatedDuration || "2-4 Months"}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 text-center space-y-0.5 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">MAX STIPEND</span>
                  <span className="text-xs font-black text-emerald-400">₹5,000</span>
                </div>
              </div>

            </div>

            {/* Navigation Tabs (Overview | Features | Tech Stack | Learning Outcomes | Tasks | FAQ) */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto text-xs font-bold scrollbar-none shadow-lg">
              {["Overview", "Features", "Tech Stack", "Learning Outcomes", "Tasks", "FAQ"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Body Contents */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
              
              {activeTab === "Overview" && (
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Project Overview & Architecture</h3>
                  <p>{project.fullDescription || project.shortDescription}</p>
                  
                  {project.problemStatement && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-400 uppercase block">Real-World Problem Statement</span>
                      <p className="text-slate-300">{project.problemStatement}</p>
                    </div>
                  )}

                  {project.solution && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase block">Engineered Solution</span>
                      <p className="text-slate-300">{project.solution}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Features" && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Key Production Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {project.keyFeatures?.map((feat, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Tech Stack" && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Complete Technology Stack</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {project.technologyStack?.map((t, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center text-slate-200">
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Learning Outcomes" && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Engineering Competencies You Build</h3>
                  <div className="space-y-2">
                    {project.learningOutcomes?.map((out, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-200">{out}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Tasks" && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">8 Structured Engineering Tasks</h3>
                  <div className="space-y-2.5">
                    {[
                      { num: 1, title: "Architecture & Foundation Setup", diff: "Easy" },
                      { num: 2, title: "Client UI & Responsive Interface", diff: "Easy" },
                      { num: 3, title: "RESTful Endpoints & Controller Validation", diff: "Medium" },
                      { num: 4, title: "Data Persistence & Transaction Management", diff: "Medium" },
                      { num: 5, title: "⭐ Core Algorithmic Logic & Processing", diff: "Hard" },
                      { num: 6, title: "⭐ Real-time Telemetry & Event Streaming", diff: "Hard" },
                      { num: 7, title: "⭐ Security Hardening, RBAC & Middleware", diff: "Hard" },
                      { num: 8, title: "⭐ Production Optimization & CI/CD Packaging", diff: "Hard" },
                    ].map((t) => (
                      <div key={t.num} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                            {t.num}
                          </span>
                          <span className="font-semibold text-slate-200">{t.title}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.diff === "Hard" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                          t.diff === "Medium" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                          "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}>
                          {t.diff}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "FAQ" && (
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <h4 className="font-bold text-white">How does the stipend evaluation work?</h4>
                    <p>Complete 8/8 approved tasks to earn ₹5,000 or 6-7/8 approved tasks for ₹1,200.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <h4 className="font-bold text-white">Can I work on multiple projects at the same time?</h4>
                    <p>No. SC TECH strictly enforces 1 active project per student at a time for deep learning.</p>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDEBAR: "START THIS PROJECT" (Exact to Blueprint)  */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            
            <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-6">
              
              <div className="space-y-1 border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white">Start This Project</h3>
                <p className="text-xs text-slate-400">Select duration to initialize your workspace.</p>
              </div>

              {/* Select Project Duration (Radio Buttons) */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Select Project Duration:
                </label>

                <div className="space-y-2">
                  {DURATION_RADIO_OPTIONS.map((opt) => {
                    const isChecked = selectedDuration === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setSelectedDuration(opt.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                          isChecked
                            ? "bg-blue-950/40 border-blue-500/80 shadow-md ring-1 ring-blue-500/40"
                            : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChecked ? "border-blue-400 bg-blue-500" : "border-slate-600 bg-slate-900"
                          }`}>
                            {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-bold text-slate-200">{opt.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Live Date Box (Start Date + Expected Completion) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Start Date:</span>
                  </span>
                  <span className="font-bold text-white font-mono">{getStartDateStr()}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Expected Completion:</span>
                  </span>
                  <span className="font-bold text-cyan-400 font-mono">{getCompletionDateStr(selectedDuration)}</span>
                </div>
              </div>

              {/* Dynamic Action CTA: "Activate Project" */}
              {String(project.accessType || (project as any).accessLevel || "").toUpperCase() === "FREE" || (project as any).isFree ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActivationModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Activate Project (Free – ₹0)</span>
                  </button>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 text-center">
                    <div className="text-[11px] font-bold text-emerald-300">
                      ✨ Free Tier Project
                    </div>
                    <div className="text-[10px] text-emerald-200/80">
                      Included free for all registered SC TECH students.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActivationModalOpen(true)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-cyan-200" />
                    <span>Activate Project</span>
                  </button>

                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-1 text-center">
                    <div className="text-[11px] font-bold text-indigo-300">
                      🔒 SC TECH Pro Project
                    </div>
                    <div className="text-[10px] text-indigo-200/80">
                      Requires Plus, Pro, Career plan or direct unlock.
                    </div>
                  </div>
                </>
              )}

              <div className="text-center">
                <a href="#faq" onClick={() => setActiveTab("FAQ")} className="text-xs text-slate-400 hover:text-white underline">
                  Need Help?
                </a>
              </div>

            </div>

          </div>

        </div>

      </main>

      <Footer />

      {/* Project Activation Modal */}
      {project && (
        <ProjectActivationModal
          isOpen={activationModalOpen}
          onClose={() => setActivationModalOpen(false)}
          project={project}
        />
      )}
    </div>
  );
}
