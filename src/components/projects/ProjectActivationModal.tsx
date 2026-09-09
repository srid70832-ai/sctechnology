"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Zap, 
  AlertTriangle, 
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProjectData } from "@/lib/projects-data";
import { ProjectDurationOption } from "@/lib/project-lifecycle-service";

interface ProjectActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  onActivated?: () => void;
}

export function ProjectActivationModal({
  isOpen,
  onClose,
  project,
  onActivated,
}: ProjectActivationModalProps) {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();

  const [selectedDuration, setSelectedDuration] = useState<ProjectDurationOption>("2_MONTHS");
  const [loading, setLoading] = useState(false);
  const [activeProjectError, setActiveProjectError] = useState<string | null>(null);
  const [isNextProject, setIsNextProject] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!isOpen || !user && !firebaseUser) {
        setCheckingActive(false);
        return;
      }

      setCheckingActive(true);
      setActiveProjectError(null);

      try {
        const uid = user?.userId || firebaseUser?.uid;
        const res = await fetch(`/api/projects/enrollment/active?userId=${uid}`);
        if (res.ok) {
          const json = await res.json();
          if (json.activeEnrollment) {
            setActiveProjectError(
              `You already have an active project: "${json.activeEnrollment.projectTitle}". SC TECH limits students to 1 active project at a time. Please complete or close your active project before activating another.`
            );
          } else if (json.hasPreviousProjects) {
            setIsNextProject(true);
          }
        }
      } catch (err) {
        console.error("Error checking active project status:", err);
      } finally {
        setCheckingActive(false);
      }
    }
    checkStatus();
  }, [isOpen, user, firebaseUser]);

  if (!isOpen || !project) return null;

  const getProjectedDeadline = (dur: ProjectDurationOption) => {
    const d = new Date();
    if (dur === "1_MONTH") d.setMonth(d.getMonth() + 1);
    else if (dur === "2_MONTHS") d.setMonth(d.getMonth() + 2);
    else if (dur === "3_MONTHS") d.setMonth(d.getMonth() + 3);
    else if (dur === "4_MONTHS") d.setMonth(d.getMonth() + 4);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleActivate = async () => {
    if (!user && !firebaseUser) {
      router.push("/login?redirect=/projects/" + (project.slug || project.id));
      return;
    }

    setLoading(true);
    try {
      const uid = user?.userId || firebaseUser?.uid;
      const res = await fetch("/api/projects/enrollment/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: uid,
          studentName: user?.name || "Verified Student",
          studentEmail: user?.email || "",
          projectId: project.id,
          projectSlug: project.slug || project.id,
          projectTitle: project.title,
          projectCategory: project.category,
          projectDifficulty: project.difficulty,
          duration: selectedDuration,
          isNextProjectActivation: isNextProject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to activate project");
      }

      alert(`🎉 Project "${project.title}" activated successfully!\nAssigned Duration: ${selectedDuration.replace(/_/g, " ")}\nDeadline: ${getProjectedDeadline(selectedDuration)}`);
      onClose();
      if (onActivated) onActivated();
      router.push(`/my-projects/${project.slug || project.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to activate project");
    } finally {
      setLoading(false);
    }
  };

  const DURATION_OPTIONS: { id: ProjectDurationOption; label: string; months: number; desc: string }[] = [
    { id: "1_MONTH", label: "1 Month (Fast Track)", months: 1, desc: "Intensive 30-day sprint for experienced engineers" },
    { id: "2_MONTHS", label: "2 Months (Standard)", months: 2, desc: "Balanced 60-day pace with weekly milestones (Recommended)" },
    { id: "3_MONTHS", label: "3 Months (In-Depth)", months: 3, desc: "Comprehensive 90-day learning and full capstone build" },
    { id: "4_MONTHS", label: "4 Months (Max Duration)", months: 4, desc: "Deep multi-stage engineering cycle (Maximum limit)" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>PROJECT ACTIVATION WORKFLOW</span>
            </div>
            <h3 className="text-xl font-black text-white">{project.title}</h3>
            <p className="text-xs text-slate-400">
              {project.category} • Difficulty: <strong className="text-amber-400">{project.difficulty}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {checkingActive ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs font-semibold">Verifying active project quota & plan authorization...</span>
          </div>
        ) : activeProjectError ? (
          /* BLOCKED: ACTIVE PROJECT ALREADY EXISTS */
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-base font-bold text-white">Active Project Limit Reached</h4>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {activeProjectError}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/my-projects");
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Go to Active Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVATION SELECTION FORM */
          <div className="space-y-6">
            
            {/* Duration Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Select Project Duration (Max 4 Months):</span>
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  Deadline: <strong className="text-cyan-400">{getProjectedDeadline(selectedDuration)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = selectedDuration === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedDuration(opt.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? "bg-gradient-to-b from-blue-950/60 to-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/50"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business Rules & Pricing Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Activation Policy:</span>
                </span>
                <span className="font-black text-emerald-400 text-sm">
                  {isNextProject ? "₹99 Next-Project Fee" : "Included in Active Plan"}
                </span>
              </div>

              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>You can work on <strong>ONE active project at a time</strong>.</li>
                <li>When your {selectedDuration.replace(/_/g, " ")} duration expires, the project will <strong>automatically lock</strong>.</li>
                <li>Complete 6/8 tasks to earn ₹1,200 stipend or 8/8 tasks for ₹5,000 stipend.</li>
                {isNextProject && (
                  <li className="text-blue-300 font-medium">
                    This is your next project cycle. Nominal ₹99 activation fee applies.
                  </li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleActivate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Project...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>{isNextProject ? "Pay ₹99 & Start Project" : "Start Project Workspace"}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
