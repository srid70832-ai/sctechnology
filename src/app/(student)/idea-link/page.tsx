"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Lightbulb, 
  Plus, 
  Building2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  X, 
  Layers, 
  Code2, 
  Award, 
  Globe, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Check,
  Briefcase,
  Users
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { IdeaSubmission, ConnectionRequest, CompanyMatchItem } from "@/lib/idea-link-models";

export default function StudentIdeaLinkPage() {
  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [ideas, setIdeas] = useState<IdeaSubmission[]>([]);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<IdeaSubmission | null>(null);

  // Submit Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ideaForm, setIdeaForm] = useState({
    title: "",
    industry: "AI / Machine Learning",
    description: "",
    problem: "",
    solution: "",
    targetUsers: "",
    technologyUsed: "Next.js, TypeScript, Python, TensorFlow, Firebase",
    businessModel: "B2B Subscription / API Usage",
    expectedImpact: "Automate manual triage workflows, reducing response latency by 60%.",
    pitchDeckUrl: "",
    demoUrl: "",
    githubUrl: "",
  });

  // Express Interest State
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedCompanyMatch, setSelectedCompanyMatch] = useState<CompanyMatchItem | null>(null);
  const [interestMessage, setInterestMessage] = useState("");
  const [sendingInterest, setSendingInterest] = useState(false);

  const userPlan = (user as any)?.plan?.toUpperCase() || "FREE";
  const hasPremiumAccess = userPlan === "PLUS" || userPlan === "PRO" || userPlan === "CAREER";

  const loadData = async () => {
    setLoading(true);
    try {
      const uid = user?.userId || firebaseUser?.uid;
      if (uid) {
        const res = await fetch(`/api/idea-link/my-ideas?studentId=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setIdeas(data.ideas || []);
          setConnections(data.connections || []);
          if (data.ideas && data.ideas.length > 0) {
            setSelectedIdea(data.ideas[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      error("Network error while loading SC IDEA LINK data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, firebaseUser]);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = user?.userId || firebaseUser?.uid;
    if (!uid) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/idea-link/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: uid,
          studentName: user?.name || firebaseUser?.displayName || "Student Innovator",
          studentEmail: user?.email || firebaseUser?.email || "",
          ...ideaForm,
          technologyUsed: ideaForm.technologyUsed.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success("🎉 Startup idea submitted successfully! SC TECH Venture Board will review it.");
        setSubmitModalOpen(false);
        setIdeaForm({
          title: "",
          industry: "AI / Machine Learning",
          description: "",
          problem: "",
          solution: "",
          targetUsers: "",
          technologyUsed: "Next.js, TypeScript, Python, TensorFlow, Firebase",
          businessModel: "B2B Subscription / API Usage",
          expectedImpact: "Automate manual triage workflows, reducing response latency by 60%.",
          pitchDeckUrl: "",
          demoUrl: "",
          githubUrl: "",
        });
        loadData();
      } else {
        error(data.error || "Failed to submit startup idea");
      }
    } catch {
      error("Error submitting startup idea");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExpressInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea || !selectedCompanyMatch) return;

    const uid = user?.userId || firebaseUser?.uid;
    if (!uid) return;

    setSendingInterest(true);
    try {
      const res = await fetch("/api/idea-link/express-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          studentId: uid,
          studentName: user?.name || firebaseUser?.displayName || "Student Innovator",
          studentEmail: user?.email || firebaseUser?.email || "",
          companyMatch: selectedCompanyMatch,
          studentMessage: interestMessage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success(`🎉 Connection interest registered for ${selectedCompanyMatch.companyName}!`);
        setInterestModalOpen(false);
        setInterestMessage("");
        loadData();
      } else {
        error(data.error || "Failed to express interest");
      }
    } catch {
      error("Error expressing interest");
    } finally {
      setSendingInterest(false);
    }
  };

  const INDUSTRIES = [
    "AI / Machine Learning",
    "Generative AI",
    "HealthTech & Telemedicine",
    "FinTech & Payments",
    "EdTech & Smart Learning",
    "Cybersecurity & Zero Trust",
    "Cloud & DevOps",
    "IoT & Smart Infrastructure",
    "E-Commerce & Supply Chain",
    "CleanTech & Sustainability",
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl w-full mx-auto">
          
          {/* Main Hero Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1.5 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>SC IDEA LINK • STARTUP & VENTURE MATCHING</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Startup Discovery & Corporate Venture Link</h1>
              <p className="text-xs text-slate-400 max-w-2xl">
                Submit your startup concepts, receive AI-driven market intelligence, and get directly connected with real-world enterprise partners and corporate ventures.
              </p>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <button
                onClick={() => setSubmitModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Startup Idea</span>
              </button>
            </div>
          </div>

          {/* Package Availability Notice */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">
                {hasPremiumAccess ? (
                  <>
                    <strong className="text-emerald-400">✓ SC IDEA LINK Unlocked:</strong> Your active plan includes corporate introductions and AI matching.
                  </>
                ) : (
                  <>
                    <strong className="text-amber-400">Standard Tier Active:</strong> Upgrade to Plus, Pro, or Career for priority enterprise liaison.
                  </>
                )}
              </span>
            </div>

            {!hasPremiumAccess && (
              <Link href="/plans" className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition">
                Upgrade Plan →
              </Link>
            )}
          </div>

          {/* Body Content: Ideas List or Empty State */}
          {loading ? (
            <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span>Loading your startup submissions & company matches...</span>
            </div>
          ) : ideas.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Lightbulb className="w-8 h-8 text-amber-400" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-black text-white">No Startup Ideas Submitted Yet</h3>
                <p className="text-xs text-slate-400">
                  Have an innovative idea? Submit your thesis to receive AI-driven market analysis and real-world company introductions.
                </p>
              </div>
              <button
                onClick={() => setSubmitModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Your First Idea</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: My Ideas Selector */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>My Submissions ({ideas.length})</span>
                  <button onClick={() => setSubmitModalOpen(true)} className="text-blue-400 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {ideas.map((idea) => {
                    const isSelected = selectedIdea?.id === idea.id;
                    return (
                      <div
                        key={idea.id}
                        onClick={() => setSelectedIdea(idea)}
                        className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/40"
                            : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-indigo-400 font-mono font-bold">{idea.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            idea.status === "MATCHES_SHARED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                            idea.status === "APPROVED" || idea.status === "AI_ANALYZED" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                            idea.status === "REJECTED" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                            "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}>
                            {idea.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white line-clamp-1">{idea.title}</h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{idea.industry}</span>
                          <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Connection Tracker Widget */}
                {connections.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 pt-4">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Connection Pipeline ({connections.length})</span>
                    </span>

                    <div className="space-y-2">
                      {connections.map((conn) => (
                        <div key={conn.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{conn.companyName}</span>
                            <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                              conn.status === "CONNECTED" ? "bg-emerald-500/20 text-emerald-300" :
                              conn.status === "COMPANY_REVIEW" ? "bg-blue-500/20 text-blue-300" :
                              "bg-amber-500/20 text-amber-300"
                            }`}>
                              {conn.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{conn.ideaTitle}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Selected Idea Showcase, Matched Opportunities & Timeline */}
              {selectedIdea && (
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Active Idea Cockpit Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-6">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                            {selectedIdea.industry}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{selectedIdea.id}</span>
                        </div>
                        <h2 className="text-xl font-black text-white">{selectedIdea.title}</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                          selectedIdea.status === "MATCHES_SHARED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                          selectedIdea.status === "APPROVED" || selectedIdea.status === "AI_ANALYZED" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                          selectedIdea.status === "REJECTED" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                          "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Status: {selectedIdea.status.replace(/_/g, " ")}</span>
                        </span>
                      </div>
                    </div>

                    {/* Problem & Solution Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Problem Statement</span>
                        <p className="text-slate-300 leading-relaxed">{selectedIdea.problem}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Proposed Solution</span>
                        <p className="text-slate-300 leading-relaxed">{selectedIdea.solution}</p>
                      </div>
                    </div>

                    {/* Progress Step Timeline */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Lifecycle Pipeline
                      </span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-bold">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          1. Idea Submitted ✓
                        </div>
                        <div className={`p-2 rounded-xl border ${
                          selectedIdea.status !== "SUBMITTED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          2. Admin Review {selectedIdea.status !== "SUBMITTED" ? "✓" : "⏳"}
                        </div>
                        <div className={`p-2 rounded-xl border ${
                          selectedIdea.status === "AI_ANALYZED" || selectedIdea.status === "MATCHES_SHARED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          3. AI Analysis {selectedIdea.status === "AI_ANALYZED" || selectedIdea.status === "MATCHES_SHARED" ? "✓" : "⏳"}
                        </div>
                        <div className={`p-2 rounded-xl border ${
                          selectedIdea.status === "MATCHES_SHARED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-900 text-slate-500 border-slate-800"
                        }`}>
                          4. Corporate Match {selectedIdea.status === "MATCHES_SHARED" ? "✓" : "⏳"}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ========================================================= */}
                  {/* MATCHED OPPORTUNITIES (Shared by Admin)                   */}
                  {/* ========================================================= */}
                  {selectedIdea.approvedMatches && selectedIdea.approvedMatches.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          <span>Matched Corporate & Startup Opportunities ({selectedIdea.approvedMatches.length})</span>
                        </h3>
                        <span className="text-xs text-slate-500">Verified by SC TECH Board</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedIdea.approvedMatches.map((match) => (
                          <div
                            key={match.id}
                            className="p-6 rounded-3xl bg-slate-900/95 border border-indigo-500/30 hover:border-indigo-500/60 transition shadow-xl space-y-4 flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                                  {match.industry}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black border border-emerald-500/30">
                                  {match.matchScore}% AI Match
                                </span>
                              </div>

                              <div>
                                <h4 className="text-base font-black text-white">{match.companyName}</h4>
                                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{match.companySummary}</p>
                              </div>

                              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                                <span className="text-[10px] font-bold text-indigo-300 uppercase block">Why this company matches:</span>
                                <p className="text-slate-300 leading-relaxed text-[11px]">{match.whyItMatches}</p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                              {match.officialWebsite && (
                                <a
                                  href={match.officialWebsite}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1 transition"
                                >
                                  <span>Official Website</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCompanyMatch(match);
                                  setInterestModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                                <span>Express Interest</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Company Matching In Progress</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Your idea has been submitted to the SC TECH Venture Board. Once approved and analyzed by Gemini AI, curated company introductions will appear right here.
                      </p>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ========================================================= */}
      {/* 1. SUBMIT STARTUP IDEA MODAL                              */}
      {/* ========================================================= */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">SC IDEA LINK SUBMISSION</span>
                <h3 className="text-lg font-black text-white">Submit Your Startup Concept</h3>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Idea / Startup Title *</label>
                <input
                  type="text"
                  required
                  value={ideaForm.title}
                  onChange={(e) => setIdeaForm({ ...ideaForm, title: e.target.value })}
                  placeholder="e.g. AI-Powered Autonomous Fleet Telemetry & Predictive Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Industry / Domain *</label>
                  <select
                    value={ideaForm.industry}
                    onChange={(e) => setIdeaForm({ ...ideaForm, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Target Users / Market *</label>
                  <input
                    type="text"
                    required
                    value={ideaForm.targetUsers}
                    onChange={(e) => setIdeaForm({ ...ideaForm, targetUsers: e.target.value })}
                    placeholder="e.g. Logistics fleet operators, heavy equipment managers"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Core Problem Statement *</label>
                <textarea
                  rows={2}
                  required
                  value={ideaForm.problem}
                  onChange={(e) => setIdeaForm({ ...ideaForm, problem: e.target.value })}
                  placeholder="Describe the critical industry pain point, bottleneck, or inefficiency..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Proposed Solution & Technical Approach *</label>
                <textarea
                  rows={2}
                  required
                  value={ideaForm.solution}
                  onChange={(e) => setIdeaForm({ ...ideaForm, solution: e.target.value })}
                  placeholder="Explain your innovative approach, architecture, and technology solution..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Technology Stack</label>
                  <input
                    type="text"
                    value={ideaForm.technologyUsed}
                    onChange={(e) => setIdeaForm({ ...ideaForm, technologyUsed: e.target.value })}
                    placeholder="e.g. Next.js, Node.js, PyTorch, Docker"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Business Model</label>
                  <input
                    type="text"
                    value={ideaForm.businessModel}
                    onChange={(e) => setIdeaForm({ ...ideaForm, businessModel: e.target.value })}
                    placeholder="e.g. B2B SaaS, Usage Pricing, Marketplace"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Expected Impact & Milestones</label>
                <input
                  type="text"
                  value={ideaForm.expectedImpact}
                  onChange={(e) => setIdeaForm({ ...ideaForm, expectedImpact: e.target.value })}
                  placeholder="e.g. 50% cost savings on unplanned engine downtime"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              {/* Optional Links */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Optional Supporting Links</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="url"
                    value={ideaForm.pitchDeckUrl}
                    onChange={(e) => setIdeaForm({ ...ideaForm, pitchDeckUrl: e.target.value })}
                    placeholder="Pitch Deck (PDF URL)"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                  />
                  <input
                    type="url"
                    value={ideaForm.demoUrl}
                    onChange={(e) => setIdeaForm({ ...ideaForm, demoUrl: e.target.value })}
                    placeholder="Live Prototype URL"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                  />
                  <input
                    type="url"
                    value={ideaForm.githubUrl}
                    onChange={(e) => setIdeaForm({ ...ideaForm, githubUrl: e.target.value })}
                    placeholder="GitHub Repo URL"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Startup Idea</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. EXPRESS INTEREST MODAL                                 */}
      {/* ========================================================= */}
      {interestModalOpen && selectedCompanyMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase">CORPORATE VENTURE INTRODUCTION</span>
                <h3 className="text-base font-black text-white">Connect with {selectedCompanyMatch.companyName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInterestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExpressInterest} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{selectedCompanyMatch.companyName}</span>
                  <span className="text-emerald-400 font-bold">{selectedCompanyMatch.matchScore}% Match</span>
                </div>
                <div className="text-[11px] text-slate-400">{selectedCompanyMatch.industry}</div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Message for Corporate Liaison (Optional)</label>
                <textarea
                  rows={3}
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder="Introduce yourself, your prototype status, and what kind of collaboration or pilot you seek..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setInterestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInterest}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5"
                >
                  {sendingInterest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Connection Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
