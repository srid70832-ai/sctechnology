"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Trophy, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  FileCode2, 
  Link as LinkIcon, 
  ShieldCheck, 
  Sparkles,
  Award,
  Lock,
  ExternalLink,
  Copy,
  UserPlus,
  Trash2,
  AlertCircle,
  Share2,
  Crown,
  Layers,
  Gift,
  MessageCircle,
  IndianRupee,
  CreditCard,
  Headphones,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Clock,
  Check,
  X,
  Target,
  Rocket,
  Flag,
  FileText
} from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import { formatISTDate } from "@/lib/platform-models";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { 
  ProblemStatement, 
  subscribeToHackathonProblemStatements,
  EvaluationCriterion 
} from "@/lib/problem-statements";
import { DualPaymentModal } from "@/components/payments/DualPaymentModal";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function HackathonDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast, success, error } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "problem" | "rules" | "judging" | "team" | "submit">("problem");
  
  // Registration Modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState<string>("SCTECH");
  const [regMode, setRegMode] = useState<"CHOICE" | "CREATE_TEAM" | "JOIN_TEAM">("CHOICE");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [payingMember, setPayingMember] = useState(false);
  const [dualPaymentConfig, setDualPaymentConfig] = useState<{
    isOpen: boolean;
    productType: "HACKATHON_REGISTRATION";
    productId: string;
    productTitle: string;
    amount: number;
  } | null>(null);

  // Problem Statements Real-Time
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState<number>(1);

  // Submission form state
  const [projectName, setProjectName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setProblemsLoading(true);
    const unsubscribe = subscribeToHackathonProblemStatements(
      params.id,
      (items) => {
        setProblemStatements(items);
        setProblemsLoading(false);
      },
      (err) => {
        console.warn("Notice: Real-time problem sync notice:", err);
        setProblemsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [params.id]);

  useEffect(() => {
    // Load Razorpay script dynamically
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const fetchUserRef = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          const res = await fetch("/api/referrals/my-referral", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.stats?.referralCode) {
              setUserReferralCode(data.stats.referralCode);
            }
          }
        }
      } catch {}
    };
    if (user) fetchUserRef();
  }, [user]);

  const fetchDetail = async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/hackathons/${params.id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Hackathon API failed (${res.status})`);
      }
      if (!data.hackathon) {
        throw new Error("The hackathon API returned an invalid response.");
      }
      setHackathon(data.hackathon);
      if (data.hackathon.userSubmission) {
        setProjectName(data.hackathon.userSubmission.projectName || "");
        setRepoUrl(data.hackathon.userSubmission.repoUrl || "");
        setLiveUrl(data.hackathon.userSubmission.liveUrl || "");
        setVideoUrl(data.hackathon.userSubmission.videoUrl || "");
        setDescription(data.hackathon.userSubmission.description || "");
        if (Array.isArray(data.hackathon.userSubmission.techStack)) {
          setTechStack(data.hackathon.userSubmission.techStack.join(", "));
        }
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err?.message || "Failed to load hackathon");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const tabParam = searchParams.get("tab");
    if (tabParam === "team") {
      setActiveTab("team");
    } else if (tabParam === "overview") {
      setActiveTab("overview");
    } else if (tabParam === "problem") {
      setActiveTab("problem");
    }
  }, [params.id, searchParams]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success(`${label} copied to clipboard!`);
  };

  const handleOpenRegistration = () => {
    const currentUser = auth.currentUser;
    if (!currentUser && !user) {
      toast("Please log in as a student to register for the hackathon", "info");
      router.push(`/login?redirect=/hackathons/${params.id}`);
      return;
    }

    const mode = hackathon?.registrationMode || "BOTH";
    if (mode === "INDIVIDUAL_ONLY") {
      handleIndividualRegister();
    } else {
      setRegMode("CHOICE");
      setShowRegModal(true);
    }
  };

  const handleIndividualRegister = async () => {
    const currentUser = auth.currentUser;
    setRegistrationError(null);

    if (hackathon.entryFee > 0) {
      setDualPaymentConfig({
        isOpen: true,
        productType: "HACKATHON_REGISTRATION",
        productId: hackathon.id,
        productTitle: `${hackathon.title} — Individual Entry`,
        amount: hackathon.entryFee,
      });
      return;
    }

    setRegistering(true);
    try {
      const token = await currentUser?.getIdToken();
      // Free registration
      const res = await fetch(`/api/hackathons/${hackathon.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Successfully registered for the hackathon!");
        setShowRegModal(false);
        fetchDetail();
      }
    } catch (err: any) {
      setRegistrationError(err?.message || "Registration failed");
      error("Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      error("Please enter a valid team name");
      return;
    }

    setRegistrationError(null);
    setRegistering(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/hackathons/${hackathon.id}/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ teamName: teamName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Team created successfully!");
        setShowRegModal(false);
        setActiveTab("team");
        fetchDetail();
      } else {
        setRegistrationError(data.error || "Failed to create team");
        error(data.error || "Failed to create team");
      }
    } catch (err: any) {
      setRegistrationError(err?.message || "Failed to create team");
      error("Failed to create team");
    } finally {
      setRegistering(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      error("Please enter the 6-character Join Code");
      return;
    }

    setRegistrationError(null);
    setRegistering(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/hackathons/${hackathon.id}/team/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Successfully joined team!");
        setShowRegModal(false);
        setActiveTab("team");
        fetchDetail();
      } else {
        setRegistrationError(data.error || "Failed to join team");
        error(data.error || "Failed to join team");
      }
    } catch (err: any) {
      setRegistrationError(err?.message || "Failed to join team");
      error("Failed to join team");
    } finally {
      setRegistering(false);
    }
  };

  // Individual Team Member Payment Handler (Per Participant Fee)
  const handlePayIndividualFee = async () => {
    if (hackathon.entryFee > 0) {
      setDualPaymentConfig({
        isOpen: true,
        productType: "HACKATHON_REGISTRATION",
        productId: hackathon.id,
        productTitle: `${hackathon.title} — Team Spot Entry Fee`,
        amount: hackathon.entryFee,
      });
      return;
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/hackathons/${hackathon.id}/team/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          teamId: hackathon.userTeam.id,
          memberUserId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Member removed");
        fetchDetail();
      } else {
        error(data.error || "Failed to remove member");
      }
    } catch {
      error("Failed to remove member");
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/hackathons/${hackathon.id}/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectName,
          repoUrl,
          liveUrl,
          videoUrl,
          description,
          techStack: techStack.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Project submitted successfully for evaluation!");
        fetchDetail();
      } else {
        error(data.error || "Submission failed");
      }
    } catch {
      error("Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-sm font-medium">Loading futuristic hackathon experience...</span>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070B14]">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">{loadError ? "Unable to Load Hackathon" : "Hackathon Not Found"}</h2>
          {loadError && <p className="text-sm text-rose-300">{loadError}</p>}
          <Link href="/hackathons" className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition">
            Back to Hackathons
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isClosed = new Date() > new Date(hackathon.registrationDeadline || hackathon.registrationClosesAt);
  const isSubmissionEnded = new Date() > new Date(hackathon.endDate || hackathon.endsAt);
  const inviteUrl = hackathon.userTeam?.inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/hackathons/${hackathon.id}/team/join/${hackathon.userTeam.inviteToken}`
    : "";

  const currentUserMember = hackathon.userTeam?.members?.find((m: any) => m.userId === (auth.currentUser?.uid || user?.userId));
  const isCurrentUserPendingPayment = hackathon.entryFee > 0 && currentUserMember?.paymentStatus === "PENDING";

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Ambient background glow layers */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,116,144,0.15),rgba(255,255,255,0))]" />
      <div className="fixed top-1/4 -left-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/3 -right-48 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-7 relative z-10">
        
        {/* Top Breadcrumb & Action Pill Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hackathons</span>
          </Link>

          {/* Quick Results & Leaderboard Links */}
          <div className="flex items-center gap-3">
            <Link
              href={`/hackathons/${hackathon.slug || hackathon.id}/results`}
              className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:text-white text-xs font-bold flex items-center gap-2 transition shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Results & Winners</span>
            </Link>

            <Link
              href="/leaderboard"
              className="px-4 py-2 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-indigo-300 hover:border-indigo-400 hover:text-white text-xs font-bold flex items-center gap-2 transition"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* Hero Section Container (Futuristic Dark Glassmorphic with Cyan/Purple Glow) */}
        <div className="rounded-3xl bg-gradient-to-b from-[#0e172a]/95 via-[#0a0f1d]/95 to-[#070b14]/95 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden space-y-6">
          
          {/* Subtle background cosmic flare */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            
            {/* Left Hero Content: Logo + Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 max-w-3xl">
              
              {/* Logo Card with Neon Cyan Glow */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-cyan-400/50 bg-[#050811] shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-center p-3 shrink-0 relative overflow-hidden group">
                {hackathon.logoUrl ? (
                  <img
                    src={hackathon.logoUrl}
                    alt={`${hackathon.title} logo`}
                    className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  />
                ) : (
                  <div className="text-center">
                    <Trophy className="w-10 h-10 text-cyan-400 mx-auto drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-widest mt-1 block">SC TECH</span>
                  </div>
                )}
              </div>

              {/* Title, Badges & Tagline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-extrabold text-[10px] sm:text-xs tracking-wider uppercase shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    {hackathon.level || "NATIONAL LEVEL"}
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-300 font-extrabold text-[10px] sm:text-xs tracking-wider uppercase shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                    {hackathon.category || "AI · INNOVATION · IMPACT"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-100 to-indigo-300 drop-shadow-[0_0_25px_rgba(56,189,248,0.3)]">
                  {hackathon.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  {hackathon.tagLine || hackathon.tagline || hackathon.shortDescription || "National level hackathon for next-generation AI innovators."}
                </p>

                <div className="flex items-center gap-2 text-[11px] font-semibold text-cyan-400/90 pt-0.5">
                  <span>Build</span>
                  <span>•</span>
                  <span>Innovate</span>
                  <span>•</span>
                  <span>Collaborate</span>
                  <span>•</span>
                  <span>Win</span>
                </div>
              </div>
            </div>

            {/* Right Hero Side: Dynamic Action Card + Graphic */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col justify-end space-y-3 relative">
              
              {/* Top Glass Card: Be Part of the Next Big Innovation */}
              <div className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/80 p-5 space-y-3.5 shadow-xl backdrop-blur-md">
                <div>
                  <h3 className="text-sm font-black text-white">Be Part of the Next Big Innovation</h3>
                  <p className="text-xs text-slate-400">Turn your ideas into real-world impact.</p>
                </div>

                {/* Main Dynamic Registration Button */}
                {hackathon.isRegistered ? (
                  <div className="space-y-1">
                    <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{hackathon.userTeam ? `Team: ${hackathon.userTeam.name}` : `Registered ✓`}</span>
                    </div>
                    <p className="text-[10px] text-center text-slate-400">
                      {hackathon.userTeam ? (hackathon.isLeader ? "Team Leader" : "Team Member") : "Solo Participant"}
                    </p>
                  </div>
                ) : isClosed ? (
                  <div className="space-y-1">
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>Registration Closed</span>
                    </button>
                    <p className="text-[10px] text-center text-rose-400">Deadline Passed: {formatISTDate(hackathon.registrationDeadline || hackathon.registrationClosesAt)}</p>
                  </div>
                ) : (
                  <button
                    onClick={handleOpenRegistration}
                    disabled={registering}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-400 via-blue-600 to-purple-600 hover:from-sky-300 hover:to-purple-500 text-white font-black text-xs shadow-[0_0_25px_rgba(56,189,248,0.4)] transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <span>{registering ? "Processing..." : hackathon.entryFee > 0 ? `Register Now (₹${hackathon.entryFee})` : "Register Now (Free)"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Secondary Invite & Earn Button */}
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-400 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span>Invite & Earn</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Stats Row (5 Columns Matching Reference Design) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6 border-t border-slate-800/80 relative z-10">
            
            {/* Prize Pool */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <Trophy className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-black text-white">
                  ₹{hackathon.prizePool ? hackathon.prizePool.toLocaleString() : "1,75,000"}+
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Prize Pool</span>
            </div>

            {/* Team Size */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <Users className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-black text-white">
                  {hackathon.minTeamSize || 2} - {hackathon.maxTeamSize || 4} Members
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Team Size</span>
            </div>

            {/* Starts At */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-blue-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  {formatISTDate(hackathon.startDate || hackathon.startsAt)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Starts At (IST)</span>
            </div>

            {/* Registration Closes */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  {formatISTDate(hackathon.registrationDeadline || hackathon.registrationClosesAt)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registration Closes</span>
            </div>

            {/* Mode */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-purple-400">
                <Layers className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-black text-white">
                  {hackathon.registrationMode === "INDIVIDUAL_ONLY"
                    ? "Individual"
                    : hackathon.registrationMode === "TEAM_ONLY"
                    ? "Team Only"
                    : "Individual & Team"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Mode</span>
            </div>

          </div>

        </div>

        {/* Futuristic Tab Navigation Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#090d19]/90 border border-slate-800/90 overflow-x-auto shadow-lg">
          {[
            { id: "overview", label: "Overview" },
            { 
              id: "problem", 
              label: problemStatements.length > 0 ? `Problem Statement (${problemStatements.length})` : "Problem Statement" 
            },
            { id: "rules", label: "Rules & Guidelines" },
            { id: "judging", label: "Judging Rubric" },
            { id: "team", label: "My Team Hub" },
            { id: "submit", label: "Project Submission" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-purple-400/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 2-Column Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Main Tab Content - ~72% Width) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800 shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>About {hackathon.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Official overview, theme context, and hackathon requirements.
                  </p>
                </div>

                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
                  {hackathon.fullDescription || hackathon.description || "Detailed hackathon guidelines and challenge scope will be announced."}
                </div>

                {/* Prize Breakdown if available */}
                {hackathon.prizes && hackathon.prizes.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Prize Breakdown & Awards</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {hackathon.prizes.map((pz: string, i: number) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Award 0{i + 1}</span>
                          <p className="text-xs text-white font-semibold">{pz}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Problem Statement (Exact Reference Visual Design) */}
            {activeTab === "problem" && (
              <div className="space-y-5">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800/90 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                      <FileCode2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <span>Challenge Statements</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Explore real-world problems and build innovative solutions.
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-xs inline-block">
                      {problemStatements.length} Problem Statements
                    </span>
                    <p className="text-[11px] text-slate-400">Choose a problem, form your team and start building!</p>
                  </div>
                </div>

                {/* Real-time problems loader */}
                {problemsLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-950/80 rounded-3xl border border-slate-800">
                    <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                    <span className="text-xs font-medium">Loading published challenge statements in real-time...</span>
                  </div>
                ) : problemStatements.length === 0 ? (
                  /* Honest Empty / Scheduled State */
                  <div className="p-10 text-center rounded-3xl bg-slate-950/80 border border-slate-800 text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">Problem Statements Scheduled to Release</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        The official problem statements for <strong>{hackathon.title}</strong> will be released dynamically at the hackathon launch time: {formatISTDate(hackathon.startDate || hackathon.startsAt)}.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Problem Statement Cards Grid (3 Columns on Desktop matching image) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {problemStatements.map((p, idx) => {
                      const numStr = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
                      const problemCategory = p.category || p.domain || "Technology";
                      const diff = p.difficulty || "Advanced";

                      return (
                        <div
                          key={p.id || idx}
                          className="rounded-2xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800/90 hover:border-cyan-500/60 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] p-5 transition duration-200 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                        >
                          <div className="space-y-3">
                            {/* Card Top Badges */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-400/40 text-cyan-300">
                                PROBLEM {numStr}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-400/40 text-purple-300 truncate max-w-[130px]">
                                {problemCategory}
                              </span>
                            </div>

                            {/* Problem Title */}
                            <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition line-clamp-2">
                              {p.title}
                            </h4>

                            {/* Problem Description */}
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                              {p.shortDescription || p.description}
                            </p>
                          </div>

                          <div className="space-y-3 pt-2">
                            {/* Tags Row */}
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-cyan-300">
                                <BarChart3 className="w-3 h-3 text-cyan-400" />
                                <span>{diff}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-indigo-300">
                                <Users className="w-3 h-3 text-indigo-400" />
                                <span>High Impact</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-amber-300">
                                <Lightbulb className="w-3 h-3 text-amber-400" />
                                <span>Real-world</span>
                              </span>
                            </div>

                            {/* View Full Problem Button */}
                            <button
                              onClick={() => {
                                setSelectedProblem(p);
                                setSelectedProblemIndex(idx + 1);
                              }}
                              className="w-full py-2.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 hover:text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                            >
                              <span>View Full Problem</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Rules & Guidelines */}
            {activeTab === "rules" && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800 shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Official Rules & Guidelines</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Compliance with these rules is mandatory for evaluation and prizes.
                  </p>
                </div>

                {hackathon.rules && hackathon.rules.length > 0 ? (
                  <ul className="space-y-3">
                    {hackathon.rules.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                    Rules and submission guidelines will be published by the organizers.
                  </div>
                )}
              </div>
            )}

            {/* Tab: Judging Rubric */}
            {activeTab === "judging" && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800 shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>Judging Criteria & Evaluation Rubric</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Submissions are judged by our expert jury panel across the following weighted dimensions.
                  </p>
                </div>

                {hackathon.judgingCriteria && hackathon.judgingCriteria.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hackathon.judgingCriteria.map((crit: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="text-white font-bold block">{crit.criterion || crit.title || "Evaluation Dimension"}</span>
                          {crit.description && <span className="text-[11px] text-slate-400 block">{crit.description}</span>}
                        </div>
                        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold font-mono">
                          {crit.maxScore || crit.score || 25} pts
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-slate-800">
                    Judging criteria and scoring breakdown will be announced.
                  </div>
                )}
              </div>
            )}

            {/* Tab: My Team Hub */}
            {activeTab === "team" && (
              <div className="space-y-6">
                {hackathon.userTeam ? (
                  <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-cyan-500/30 shadow-2xl space-y-6">
                    {/* Team Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                            {hackathon.userTeam.teamId}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                            {hackathon.userTeam.roundStatus?.replace(/_/g, " ") || "REGISTERED"}
                          </span>
                          {hackathon.entryFee > 0 && (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              hackathon.userTeam.paymentStatus === "FULLY_PAID"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : hackathon.userTeam.paymentStatus === "PARTIALLY_PAID"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                            }`}>
                              {hackathon.userTeam.paymentStatus === "FULLY_PAID"
                                ? "✓ Fully Paid"
                                : hackathon.userTeam.paymentStatus === "PARTIALLY_PAID"
                                ? "⚠ Partially Paid"
                                : "Payment Pending"}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                          <span>{hackathon.userTeam.name}</span>
                          {hackathon.isLeader && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              LEADER
                            </span>
                          )}
                        </h2>
                      </div>

                      {/* Team Capacity & Payment Stats */}
                      <div className="flex items-center gap-3">
                        {hackathon.entryFee > 0 && (
                          <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                            <span className="text-[10px] text-slate-500 block">Verified Fees</span>
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              ₹{hackathon.userTeam.totalPaidAmount || 0} / ₹{(hackathon.userTeam.members?.length || 1) * hackathon.entryFee}
                            </span>
                          </div>
                        )}
                        <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                          <span className="text-[10px] text-slate-500 block">Team Members</span>
                          <span className="text-sm font-bold text-white">
                            {hackathon.userTeam.members?.length || 1} / {hackathon.userTeam.maxTeamSize || 4}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pending Payment Alert for Logged In User */}
                    {isCurrentUserPendingPayment && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white">Individual Registration Fee Pending</div>
                            <p className="text-[11px] text-amber-200/80">
                              Hackathon entry fee is charged per participant (₹{hackathon.entryFee}). Please pay your share to verify your confirmed registration.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handlePayIndividualFee}
                          disabled={payingMember}
                          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 whitespace-nowrap disabled:opacity-50"
                        >
                          {payingMember ? "Initializing..." : `Pay ₹${hackathon.entryFee} Now`}
                        </button>
                      </div>
                    )}

                    {/* Invite & Join Codes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Team Join Code</span>
                          <button
                            onClick={() => copyToClipboard(hackathon.userTeam.joinCode, "Join Code")}
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <div className="text-xl font-mono font-black text-amber-400 tracking-wider">
                          {hackathon.userTeam.joinCode}
                        </div>
                        <p className="text-[10px] text-slate-500">Teammates can enter this code to join instantly.</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Direct Invite Link</span>
                          <button
                            onClick={() => copyToClipboard(inviteUrl, "Invite Link")}
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </button>
                        </div>
                        <div className="text-xs font-mono text-slate-300 truncate bg-slate-900 p-2 rounded-lg border border-slate-800">
                          {inviteUrl || "Invite Link Available"}
                        </div>
                        <p className="text-[10px] text-slate-500">Share this link for one-click team joining.</p>
                      </div>
                    </div>

                    {/* Team Roster with Individual Member Payment Badges */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span>Team Members Roster ({hackathon.userTeam.members?.length || 0} Members)</span>
                      </h3>

                      <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-500 font-bold border-b border-slate-800">
                            <tr>
                              <th className="py-3 px-4">Member</th>
                              <th className="py-3 px-4">Role</th>
                              <th className="py-3 px-4">Registration No</th>
                              {hackathon.entryFee > 0 && <th className="py-3 px-4">Payment Status</th>}
                              <th className="py-3 px-4">College / Dept</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                            {hackathon.userTeam.members?.map((m: any, idx: number) => {
                              const isCurrentUser = m.userId === (auth.currentUser?.uid || user?.userId);
                              const isPaid = m.paymentStatus === "PAID" || hackathon.entryFee === 0;

                              return (
                                <tr key={m.userId || idx} className="hover:bg-slate-800/30">
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-white flex items-center gap-1.5">
                                      {m.role === "LEADER" && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                      <span>{m.name}</span>
                                      {isCurrentUser && <span className="text-[10px] text-cyan-400 font-normal">(You)</span>}
                                    </div>
                                    <span className="text-[10px] text-slate-500">{m.email}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      m.role === "LEADER" 
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                                        : "bg-slate-800 text-slate-300"
                                    }`}>
                                      {m.role}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-[11px] text-cyan-300">
                                    {m.registrationNo || "CONFIRMED"}
                                  </td>
                                  {hackathon.entryFee > 0 && (
                                    <td className="py-3 px-4">
                                      {isPaid ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Paid ₹{m.paymentAmount || hackathon.entryFee}</span>
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                                          <CreditCard className="w-3 h-3" />
                                          <span>Pending</span>
                                        </span>
                                      )}
                                    </td>
                                  )}
                                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                                    {m.college ? `${m.college} (${m.department || "Engineering"})` : "Student"}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {isCurrentUser && !isPaid ? (
                                      <button
                                        onClick={handlePayIndividualFee}
                                        disabled={payingMember}
                                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold transition shadow-sm ml-auto"
                                      >
                                        Pay ₹{hackathon.entryFee}
                                      </button>
                                    ) : hackathon.isLeader && m.role !== "LEADER" ? (
                                      <button
                                        onClick={() => handleRemoveMember(m.userId, m.name)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition flex items-center gap-1 ml-auto"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Remove</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-500">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h3 className="text-base font-bold text-white">Individual Registration Confirmed</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      You are registered as an individual participant with Registration Number{" "}
                      <span className="text-cyan-400 font-bold">{hackathon.userRegistration?.registrationNo}</span>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Project Submission */}
            {activeTab === "submit" && (
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800 shadow-xl space-y-6">
                {!hackathon.isRegistered ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <p className="text-sm font-bold text-white">Registration Required</p>
                    <p className="text-xs text-slate-400">Please register for the hackathon before submitting your project repository.</p>
                    {isClosed ? (
                      <button disabled className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed">
                        Registration Closed
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenRegistration}
                        className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs"
                      >
                        Register Now (₹{hackathon.entryFee})
                      </button>
                    )}
                  </div>
                ) : hackathon.userTeam && !hackathon.isLeader ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">Leader Submission Lock 🔒</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      You are part of team <strong className="text-white">&quot;{hackathon.userTeam.name}&quot;</strong>. Only your team leader (<strong className="text-cyan-400">{hackathon.userTeam.leaderName}</strong>) can submit or edit the final project on behalf of the team.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProject} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">Project Submission Portal</h3>
                        {hackathon.userTeam && (
                          <p className="text-[11px] text-cyan-300">
                            Submitting as Leader on behalf of team: <strong>{hackathon.userTeam.name}</strong>
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold">Registration Confirmed</span>
                    </div>

                    {isSubmissionEnded && (
                      <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-rose-400" />
                          <span>Submission Closed 🔒 The deadline for this hackathon has passed.</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Ended: {formatISTDate(hackathon.endDate || hackathon.endsAt)}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Project Title *</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. HealthBridge AI"
                        disabled={isSubmissionEnded}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub Repository URL *</label>
                        <input
                          type="url"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder="https://github.com/username/project"
                          disabled={isSubmissionEnded}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Live Demo URL</label>
                        <input
                          type="url"
                          value={liveUrl}
                          onChange={(e) => setLiveUrl(e.target.value)}
                          placeholder="https://my-demo-app.vercel.app"
                          disabled={isSubmissionEnded}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Video Walkthrough URL</label>
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          disabled={isSubmissionEnded}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tech Stack (Comma Separated)</label>
                        <input
                          type="text"
                          value={techStack}
                          onChange={(e) => setTechStack(e.target.value)}
                          placeholder="Next.js, Tailwind, PostgreSQL, Docker"
                          disabled={isSubmissionEnded}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Project Overview & Architecture</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe how your solution solves the problem statement..."
                        disabled={isSubmissionEnded}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || isSubmissionEnded}
                      className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmissionEnded
                        ? "Submission Closed 🔒"
                        : submitting
                        ? "Submitting..."
                        : hackathon.userTeam
                        ? "Submit Project on Behalf of Team"
                        : "Submit Project for Evaluation"}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* Right Column (Sidebar - ~28% Width) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Card 1: Important Dates (Matching Reference Image) */}
            <div className="rounded-2xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800/90 p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">Important Dates</h3>
              </div>

              <div className="space-y-4 relative pl-2">
                {/* Vertical connecting line */}
                <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-slate-800 pointer-events-none" />

                {/* Registration Opens */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                    <Rocket className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">Registration Opens</span>
                    <span className="text-xs font-bold text-slate-200 block font-mono">
                      {formatISTDate(hackathon.registrationOpensAt || hackathon.startDate || hackathon.startsAt)}
                    </span>
                  </div>
                </div>

                {/* Registration Closes */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">Registration Closes</span>
                    <span className="text-xs font-bold text-slate-200 block font-mono">
                      {formatISTDate(hackathon.registrationDeadline || hackathon.registrationClosesAt)}
                    </span>
                  </div>
                </div>

                {/* Hackathon Starts */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                    <Flag className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">Hackathon Starts</span>
                    <span className="text-xs font-bold text-slate-200 block font-mono">
                      {formatISTDate(hackathon.startDate || hackathon.startsAt)}
                    </span>
                  </div>
                </div>

                {/* Results Announcement */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">Results Announcement</span>
                    <span className="text-xs font-bold text-slate-200 block font-mono">
                      {formatISTDate(hackathon.resultsAnnouncedAt || hackathon.endDate || hackathon.endsAt)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Card 2: Need Help? (Matching Reference Image) */}
            <div className="rounded-2xl bg-gradient-to-b from-[#0d1424]/90 to-[#080d1a]/95 border border-slate-800/90 p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">Need Help?</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Have questions? Check our FAQs or contact our support team.
              </p>

              <Link
                href="/contact"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>Contact Support</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </main>

      {/* FULL PROBLEM STATEMENT DETAIL MODAL ("View Full Problem") */}
      {selectedProblem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full rounded-3xl bg-[#0B0F19] border border-cyan-500/40 shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                    PROBLEM {selectedProblemIndex < 10 ? `0${selectedProblemIndex}` : selectedProblemIndex}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                    {selectedProblem.problemCode || `PS-0${selectedProblemIndex}`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40">
                    {selectedProblem.category || selectedProblem.domain || "Technology"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    {selectedProblem.difficulty || "MEDIUM"}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {selectedProblem.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedProblem(null)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              
              {/* Executive Overview */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Problem Overview
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedProblem.fullProblemDescription || selectedProblem.description || selectedProblem.shortDescription}
                </p>
              </div>

              {/* Background Context */}
              {selectedProblem.background && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Background & Context
                  </span>
                  <p className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 leading-relaxed">
                    {selectedProblem.background}
                  </p>
                </div>
              )}

              {/* Objectives & Scope */}
              {selectedProblem.objectives && selectedProblem.objectives.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider block">
                    Key Objectives
                  </span>
                  <ul className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    {selectedProblem.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {selectedProblem.requirements && selectedProblem.requirements.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Functional & Technical Requirements
                  </span>
                  <ul className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    {selectedProblem.requirements.map((reqItem, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                        <span>{reqItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target Users & Constraints */}
              {(selectedProblem.targetUsers || selectedProblem.constraints) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedProblem.targetUsers && (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Target Users</span>
                      <p className="text-slate-300">{selectedProblem.targetUsers}</p>
                    </div>
                  )}
                  {selectedProblem.constraints && (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Constraints & Limits</span>
                      <p className="text-slate-300">{selectedProblem.constraints}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Expected Solution & Deliverables */}
              {selectedProblem.expectedSolution && (
                <div className="space-y-1">
                  <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider block">
                    Expected Solution & Deliverables
                  </span>
                  <p className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-200 leading-relaxed">
                    {selectedProblem.expectedSolution}
                  </p>
                </div>
              )}

              {/* Evaluation Criteria Rubric Table */}
              {selectedProblem.evaluationCriteria && selectedProblem.evaluationCriteria.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Scoring Rubric
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                        <tr>
                          <th className="p-2.5">Criterion</th>
                          <th className="p-2.5">Max Marks</th>
                          <th className="p-2.5">Assessment Focus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {selectedProblem.evaluationCriteria.map((c, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-semibold text-white">{c.category}</td>
                            <td className="p-2.5 font-mono text-cyan-400 font-bold">{c.maxMarks} pts</td>
                            <td className="p-2.5 text-[11px] text-slate-400">{c.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedProblem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition"
              >
                Close
              </button>

              {!hackathon.isRegistered && (
                <button
                  onClick={() => {
                    setSelectedProblem(null);
                    handleOpenRegistration();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 transition"
                >
                  Register for this Challenge
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Registration Modal (Choice between Individual & Team) */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#0B0F19] border border-cyan-500/30 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Hackathon Registration</span>
              </h3>
              <button
                onClick={() => setShowRegModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {registrationError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{registrationError}</span>
              </div>
            )}

            {regMode === "CHOICE" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Select how you would like to participate in <strong className="text-white">{hackathon.title}</strong>:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {hackathon.registrationMode !== "TEAM_ONLY" && (
                    <button
                      onClick={handleIndividualRegister}
                      disabled={registering}
                      className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white group-hover:text-cyan-300">
                          Register as Individual
                        </span>
                        <span className="text-[10px] font-bold text-cyan-400">Solo (₹{hackathon.entryFee})</span>
                      </div>
                      <p className="text-xs text-slate-400">Compete independently and submit your own repository.</p>
                    </button>
                  )}

                  {hackathon.registrationMode !== "INDIVIDUAL_ONLY" && (
                    <>
                      <button
                        onClick={() => setRegMode("CREATE_TEAM")}
                        className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white group-hover:text-indigo-300">
                            Create a New Team
                          </span>
                          <span className="text-[10px] font-bold text-indigo-400">Become Leader</span>
                        </div>
                        <p className="text-xs text-slate-400">Lead a team, invite members with Join Code & Invite Link.</p>
                      </button>

                      <button
                        onClick={() => setRegMode("JOIN_TEAM")}
                        className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-left transition space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white group-hover:text-purple-300">
                            Join Existing Team
                          </span>
                          <span className="text-[10px] font-bold text-purple-400">Enter Code</span>
                        </div>
                        <p className="text-xs text-slate-400">Join a team created by your friend using their 6-digit Join Code.</p>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {regMode === "CREATE_TEAM" && (
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setRegMode("CHOICE")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Team Name *</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. CyberKnights"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    You will be assigned as Team Leader and receive a Join Code to invite up to {hackathon.maxTeamSize || 4} members. Entry fee is ₹{hackathon.entryFee} per participant.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {registering ? "Creating Team..." : "Create Team & Continue"}
                </button>
              </form>
            )}

            {regMode === "JOIN_TEAM" && (
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setRegMode("CHOICE")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Character Team Join Code *</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CW8F29"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono uppercase text-amber-400 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ask your team leader for the 6-character Join Code displayed on their Team Hub.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {registering ? "Joining Team..." : "Join Team & Confirm"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Referral / Invite & Earn Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#0B0F19] border border-purple-500/30 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <span>Invite & Earn Referral</span>
              </h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <span className="text-xs font-bold text-purple-300">Your Exclusive Referral Code</span>
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                    {userReferralCode}
                  </span>
                  <button
                    onClick={() => copyToClipboard(userReferralCode, "Referral Code")}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Invite your friends to compete in {hackathon.title}. Earn referral credits when they register!
                </p>
              </div>

              <button
                onClick={() => {
                  const shareText = `Compete in ${hackathon.title} on SC TECH! Use my referral code: ${userReferralCode}`;
                  if (navigator.share) {
                    navigator.share({ title: hackathon.title, text: shareText, url: window.location.href });
                  } else {
                    copyToClipboard(`${shareText} - ${window.location.href}`, "Share Link");
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Hackathon with Friends</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {dualPaymentConfig && (
        <DualPaymentModal
          isOpen={dualPaymentConfig.isOpen}
          onClose={() => setDualPaymentConfig(null)}
          productType={dualPaymentConfig.productType}
          productId={dualPaymentConfig.productId}
          productTitle={dualPaymentConfig.productTitle}
          amount={dualPaymentConfig.amount}
          onSuccess={() => {
            setDualPaymentConfig(null);
            setShowRegModal(false);
            fetchDetail();
          }}
        />
      )}

      <Footer />
    </div>
  );
}
