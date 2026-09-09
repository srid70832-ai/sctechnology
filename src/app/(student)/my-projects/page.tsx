"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FolderGit2, 
  Download, 
  ExternalLink, 
  Loader2, 
  Bookmark, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Code2, 
  Zap, 
  Award, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  History, 
  FileText, 
  CheckCircle, 
  Plus,
  Activity,
  Check,
  RefreshCw,
  TrendingUp,
  Compass
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProjectActivationModal } from "@/components/projects/ProjectActivationModal";
import { ProjectEnrollment, getRemainingDays } from "@/lib/project-lifecycle-service";
import { REAL_WORLD_PROJECTS, ProjectData } from "@/lib/projects-data";

export default function MyProjectsPage() {
  const { user, firebaseUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"cockpit" | "history" | "catalog">("cockpit");

  const [activeEnrollment, setActiveEnrollment] = useState<ProjectEnrollment | null>(null);
  const [historyEnrollments, setHistoryEnrollments] = useState<ProjectEnrollment[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectData[]>(REAL_WORLD_PROJECTS);
  const [loading, setLoading] = useState(true);

  // Activation Modal State
  const [selectedProjectForActivation, setSelectedProjectForActivation] = useState<ProjectData | null>(null);
  const [activationModalOpen, setActivationModalOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const userName = user?.name || firebaseUser?.displayName || "Arun Kumar";

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const uid = user?.userId || firebaseUser?.uid;
      if (uid) {
        // 1. Fetch active enrollment
        const actRes = await fetch(`/api/projects/enrollment/active?userId=${uid}`);
        if (actRes.ok) {
          const actData = await actRes.json();
          setActiveEnrollment(actData.activeEnrollment || null);
        }

        // 2. Fetch project history
        const histRes = await fetch(`/api/projects/enrollment/history?userId=${uid}`);
        if (histRes.ok) {
          const histData = await histRes.json();
          setHistoryEnrollments(histData.history || []);
        }
      }
    } catch (err) {
      console.error("Error loading project workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user, firebaseUser]);

  const handleOpenActivation = (proj: ProjectData) => {
    setSelectedProjectForActivation(proj);
    setActivationModalOpen(true);
  };

  const remainingDays = activeEnrollment 
    ? (activeEnrollment.remainingDays !== undefined ? activeEnrollment.remainingDays : getRemainingDays(activeEnrollment.deadline))
    : 42;

  const completedTasksCount = 6;
  const totalTasksCount = 8;
  const progressPercent = Math.round((completedTasksCount / totalTasksCount) * 100);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl w-full mx-auto">
          
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <span>Welcome back,</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
                  {userName}
                </span>
                <span>👋</span>
              </h1>
              <p className="text-xs text-slate-400">
                Let&apos;s build something amazing today!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/my-documents"
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-800"
              >
                <Award className="w-4 h-4 text-cyan-400" />
                <span>My Documents</span>
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MY ACTIVE PROJECT CARD (Exact Match to Image Blueprint)   */}
          {/* ========================================================= */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  My Active Project
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE</span>
                </span>

                <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-bold text-amber-400 font-mono">
                  {remainingDays} Days Left
                </span>
              </div>
            </div>

            {/* Project Content Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Thumbnail */}
              <div className="md:col-span-4 h-36 rounded-2xl bg-gradient-to-tr from-blue-950 via-slate-950 to-indigo-950 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/10" />
                <FolderGit2 className="w-14 h-14 text-blue-400" />
                <span className="absolute bottom-2.5 left-3 text-[10px] font-mono text-cyan-300">
                  AI / Machine Learning
                </span>
              </div>

              {/* Middle Info & Progress */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <h2 className="text-xl font-black text-white">
                    {activeEnrollment?.projectTitle || "AI Career Intelligence Platform"}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span>Start Date: <strong>{activeEnrollment ? new Date(activeEnrollment.startDate).toLocaleDateString() : "10 Sep 2026"}</strong></span>
                    <span>•</span>
                    <span>Deadline: <strong>{activeEnrollment ? new Date(activeEnrollment.deadline).toLocaleDateString() : "10 Nov 2026"}</strong></span>
                  </div>
                </div>

                {/* Progress Bar (6/8 Tasks Completed • 75%) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">6 / 8 Tasks Completed</span>
                    <span className="text-cyan-400 font-bold">75%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: "75%" }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    href={`/my-projects/${activeEnrollment?.projectSlug || "ai-powered-recruitment-and-skill-matcher"}`}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue Project</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Eligible for ₹1,200 Tier 1 Stipend</span>
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================= */}
          {/* 4 STAT CARDS (Completed | In Progress | Pending | Days)  */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">2</div>
                <div className="text-[11px] text-slate-400 font-medium">Tasks Completed</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="text-2xl font-black text-blue-300">2</div>
                <div className="text-[11px] text-slate-400 font-medium">In Progress</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-amber-300">4</div>
                <div className="text-[11px] text-slate-400 font-medium">Pending</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-cyan-300">{remainingDays}</div>
                <div className="text-[11px] text-slate-400 font-medium">Days Remaining</div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RECENT ACTIVITY & SMALL STEPS BIG FUTURE CARDS            */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Recent Activity */}
            <div className="md:col-span-8 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Recent Activity</span>
                </h3>
                <span className="text-[11px] text-blue-400 hover:underline cursor-pointer">View All</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Task 3 submitted</div>
                      <div className="text-[10px] text-slate-500">2 hours ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">Under Review</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Task 2 approved</div>
                      <div className="text-[10px] text-slate-500">1 day ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Approved</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Project activated</div>
                      <div className="text-[10px] text-slate-500">3 days ago</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">2 Months Cycle</span>
                </div>
              </div>
            </div>

            {/* Small Steps Big Future */}
            <div className="md:col-span-4 p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
              <div className="space-y-1 relative z-10">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                  SC TECH ACCELERATOR
                </span>
                <h3 className="text-xl font-black text-white">Small Steps, Big Future</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are closer to your dreams. Keep going! Complete remaining tasks to unlock your ₹5,000 stipend and verified certificate.
                </p>
              </div>

              <div className="pt-2 relative z-10">
                <Link
                  href="/projects"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center block shadow-md shadow-indigo-600/30 transition"
                >
                  Explore Next Challenges →
                </Link>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* Project Activation Modal */}
      {selectedProjectForActivation && (
        <ProjectActivationModal
          isOpen={activationModalOpen}
          onClose={() => {
            setActivationModalOpen(false);
            setSelectedProjectForActivation(null);
          }}
          project={selectedProjectForActivation}
          onActivated={() => {
            loadStudentData();
          }}
        />
      )}
    </div>
  );
}
