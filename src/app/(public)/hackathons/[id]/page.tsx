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
  CreditCard
} from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import { formatISTDate } from "@/lib/platform-models";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { HackathonAiAssistant } from "@/components/hackathon/HackathonAiAssistant";

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
  const [activeTab, setActiveTab] = useState<"overview" | "problem" | "rules" | "judging" | "team" | "submit">("overview");
  
  // Registration Modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [userReferralCode, setUserReferralCode] = useState<string>("SCTECH");
  const [regMode, setRegMode] = useState<"CHOICE" | "CREATE_TEAM" | "JOIN_TEAM">("CHOICE");
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [registering, setRegistering] = useState(false);
  const [payingMember, setPayingMember] = useState(false);

  // Submission form state
  const [projectName, setProjectName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    setRegistering(true);
    try {
      const token = await currentUser?.getIdToken();

      // If paid hackathon, process Razorpay test payment
      if (hackathon.entryFee > 0 && typeof window !== "undefined" && window.Razorpay) {
        const orderRes = await fetch(`/api/hackathons/${hackathon.id}/team/member-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ action: "create-order" }),
        });

        const orderData = await orderRes.json();
        if (orderData.requiresPayment && orderData.orderId) {
          const rzp = new window.Razorpay({
            key: orderData.keyId,
            amount: orderData.amount,
            currency: "INR",
            name: "SC TECH Hackathons",
            description: `Entry Fee for ${hackathon.title}`,
            order_id: orderData.orderId,
            prefill: {
              name: currentUser?.displayName || user?.name || "Student",
              email: currentUser?.email || user?.email || "",
            },
            theme: { color: "#2563eb" },
            handler: async (response: any) => {
              // Verify on server
              const verifyRes = await fetch(`/api/hackathons/${hackathon.id}/register`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                success(`Registration & Payment Verified! Reg No: ${verifyData.registrationNo}`);
                setShowRegModal(false);
                fetchDetail();
              } else {
                error(verifyData.error || "Payment verification failed");
              }
            },
          });
          rzp.open();
          setRegistering(false);
          return;
        }
      }

      // Free or Direct registration
      const res = await fetch(`/api/hackathons/${hackathon.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        success(`Successfully registered! Registration No: ${data.registrationNo}`);
        setShowRegModal(false);
        fetchDetail();
      } else {
        error(data.error || "Registration failed");
      }
    } catch {
      error("Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      error("Please enter a team name");
      return;
    }

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
        error(data.error || "Failed to create team");
      }
    } catch {
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
        error(data.error || "Failed to join team");
      }
    } catch {
      error("Failed to join team");
    } finally {
      setRegistering(false);
    }
  };

  // Individual Team Member Payment Handler (Per Participant Fee)
  const handlePayIndividualFee = async () => {
    setPayingMember(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const orderRes = await fetch(`/api/hackathons/${hackathon.id}/team/member-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "create-order",
          teamId: hackathon.userTeam?.id,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        error(orderData.error || "Failed to initialize payment order");
        setPayingMember(false);
        return;
      }

      if (typeof window !== "undefined" && window.Razorpay) {
        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: "INR",
          name: "SC TECH Hackathons",
          description: `Individual Fee for ${hackathon.title}`,
          order_id: orderData.orderId,
          prefill: {
            name: auth.currentUser?.displayName || user?.name || "Student",
            email: auth.currentUser?.email || user?.email || "",
          },
          theme: { color: "#2563eb" },
          handler: async (response: any) => {
            const verifyRes = await fetch(`/api/hackathons/${hackathon.id}/team/member-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                action: "verify",
                teamId: hackathon.userTeam?.id,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              success("Payment verified! Your spot in the team is now fully confirmed.");
              fetchDetail();
            } else {
              error(verifyData.error || "Payment verification failed");
            }
            setPayingMember(false);
          },
        });
        rzp.open();
      } else {
        error("Payment gateway is loading. Please retry in a moment.");
        setPayingMember(false);
      }
    } catch (err) {
      console.error(err);
      error("Payment processing error");
      setPayingMember(false);
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
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading hackathon...</span>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0F19]">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">{loadError ? "Unable to Load Hackathon" : "Hackathon Not Found"}</h2>
          {loadError && <p className="text-sm text-rose-300">{loadError}</p>}
          <Link href="/hackathons" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
            Back to Hackathons
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isClosed = new Date() > new Date(hackathon.registrationDeadline);
  const isSubmissionEnded = new Date() > new Date(hackathon.endDate);
  const inviteUrl = hackathon.userTeam?.inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/hackathons/${hackathon.id}/team/join/${hackathon.userTeam.inviteToken}`
    : "";

  const currentUserMember = hackathon.userTeam?.members?.find((m: any) => m.userId === (auth.currentUser?.uid || user?.userId));
  const isCurrentUserPendingPayment = hackathon.entryFee > 0 && currentUserMember?.paymentStatus === "PENDING";

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hackathons</span>
          </Link>

          {/* Quick Results & Leaderboard Links */}
          <div className="flex items-center gap-3">
            <Link
              href={`/hackathons/${hackathon.slug || hackathon.id}/results`}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Results & Winners</span>
            </Link>

            <Link
              href="/leaderboard"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#0B0F19] border border-blue-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="w-24 h-24 rounded-2xl border border-blue-500/30 bg-slate-950/70 overflow-hidden flex items-center justify-center shadow-lg shadow-blue-500/10">
                {hackathon.logoUrl ? (
                  <img src={hackathon.logoUrl} alt={`${hackathon.title} logo`} className="w-full h-full object-contain" />
                ) : (
                  <Trophy className="w-10 h-10 text-amber-400/70" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>Prize Pool: ₹{hackathon.prizePool?.toLocaleString()}+</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                  Fee: {hackathon.entryFee > 0 ? `₹${hackathon.entryFee} / participant` : "Free Entry"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                  Mode: {hackathon.registrationMode === "INDIVIDUAL_ONLY" ? "Individual" : hackathon.registrationMode === "TEAM_ONLY" ? "Team Only" : "Individual & Team"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">{hackathon.title}</h1>
              <p className="text-xs sm:text-sm text-blue-300">{hackathon.tagLine}</p>
            </div>

            {/* Action Area */}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => setShowReferralModal(true)}
                className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 text-purple-300 font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <Gift className="w-4 h-4 text-purple-400" />
                <span>Invite & Earn</span>
              </button>
              {hackathon.isRegistered ? (
                <div className="space-y-1 text-right">
                  <div className="px-5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {hackathon.userTeam ? `Team: ${hackathon.userTeam.name}` : `Registered (${hackathon.userRegistration?.registrationNo})`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {hackathon.userTeam ? `Role: ${hackathon.isLeader ? "Team Leader" : "Team Member"}` : "Individual Participant"}
                  </p>
                </div>
              ) : isClosed ? (
                <div className="space-y-1 text-right">
                  <button
                    disabled
                    className="px-8 py-3.5 rounded-2xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700 flex items-center gap-2 shadow-lg"
                  >
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Registration Closed</span>
                  </button>
                  <p className="text-[10px] text-rose-400">Deadline: {formatISTDate(hackathon.registrationDeadline)}</p>
                </div>
              ) : (
                <button
                  onClick={handleOpenRegistration}
                  disabled={registering}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {registering ? "Processing..." : `Register Now (₹${hackathon.entryFee})`}
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Starts</span>
              <p className="text-xs font-bold text-slate-200">{formatISTDate(hackathon.startDate)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Registration Closes</span>
              <p className="text-xs font-bold text-slate-200">{formatISTDate(hackathon.registrationDeadline)}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Team Size</span>
              <p className="text-xs font-bold text-slate-200">{hackathon.minTeamSize} - {hackathon.maxTeamSize} Members</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Evaluation Mode</span>
              <p className="text-xs font-bold text-slate-200">{hackathon.submissionMethod === "GOOGLE_FORM" ? "Google Form" : "Direct Platform"}</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "problem", label: "Problem Statement" },
            { id: "rules", label: "Rules & Guidelines" },
            { id: "judging", label: "Judging Rubric" },
            { id: "team", label: "My Team Hub" },
            { id: "submit", label: "Project Submission" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents: Overview */}
        {activeTab === "overview" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">About This Hackathon</h3>
            <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {hackathon.description}
            </div>
          </div>
        )}

        {/* Tab Contents: Problem */}
        {activeTab === "problem" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Challenge Statement</h3>
            {hackathon.problemStatement ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed">
                {hackathon.problemStatement}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 space-y-2">
                <p className="text-sm font-bold text-white">Problem Statement is Scheduled to Release</p>
                <p className="text-xs text-slate-500">The challenge statement will be unlocked on {formatISTDate(hackathon.startDate)}.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Rules */}
        {activeTab === "rules" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hackathon Rules</h3>
            <ul className="space-y-3">
              {hackathon.rules?.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab Contents: Judging */}
        {activeTab === "judging" && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Judging Rubric</h3>
            <div className="space-y-3">
              {hackathon.judgingCriteria?.map((crit: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">{crit.criterion || crit.title}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">{crit.maxScore || crit.score || 25} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Contents: My Team Hub */}
        {activeTab === "team" && (
          <div className="space-y-6">
            {hackathon.userTeam ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-blue-500/30 shadow-2xl space-y-6">
                {/* Team Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
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
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
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
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
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
                    <Users className="w-4 h-4 text-blue-400" />
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
                                  {isCurrentUser && <span className="text-[10px] text-blue-400 font-normal">(You)</span>}
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
                              <td className="py-3 px-4 font-mono text-[11px] text-blue-300">
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

                {/* Team Submission Summary */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-blue-400" />
                      <span>Project Submission Status</span>
                    </h4>
                    {hackathon.userTeam.submission ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Submitted for Evaluation
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Pending Submission
                      </span>
                    )}
                  </div>

                  {hackathon.userTeam.submission ? (
                    <div className="space-y-2 text-xs text-slate-300 pt-1">
                      <div className="font-bold text-white text-sm">
                        {hackathon.userTeam.submission.projectName}
                      </div>
                      <p className="text-slate-400 line-clamp-2">
                        {hackathon.userTeam.submission.description}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <a
                          href={hackathon.userTeam.submission.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-medium"
                        >
                          <FileCode2 className="w-3.5 h-3.5" />
                          <span>GitHub Repository</span>
                        </a>
                        {hackathon.userTeam.submission.liveUrl && (
                          <a
                            href={hackathon.userTeam.submission.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {hackathon.isLeader
                        ? "As the team leader, you can submit the project repository under the 'Project Submission' tab."
                        : `Your team leader (${hackathon.userTeam.leaderName}) will submit the project repository on behalf of the team.`}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Individual Registration Confirmed</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You are registered as an individual participant with Registration Number{" "}
                  <span className="text-blue-400 font-bold">{hackathon.userRegistration?.registrationNo}</span>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents: Project Submission */}
        {activeTab === "submit" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
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
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
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
                  You are part of team <strong className="text-white">"{hackathon.userTeam.name}"</strong>. Only your team leader (<strong className="text-blue-400">{hackathon.userTeam.leaderName}</strong>) can submit or edit the final project on behalf of the team.
                </p>
              </div>
            ) : hackathon.submissionMethod === "GOOGLE_FORM" ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Google Form Submission Configured</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The organizers have configured this hackathon to collect submissions directly through Google Forms.
                </p>
                {isSubmissionEnded ? (
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-700">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Submission Closed 🔒</span>
                  </div>
                ) : (
                  <a
                    href={hackathon.googleFormUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition transform hover:-translate-y-0.5"
                  >
                    <span>Submit Project via Google Form</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Project Submission Portal</h3>
                    {hackathon.userTeam && (
                      <p className="text-[11px] text-blue-300">
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
                    <span className="text-[10px] text-slate-400">Ended: {formatISTDate(hackathon.endDate)}</span>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tech Stack (Comma Separated)</label>
                    <input
                      type="text"
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                      placeholder="Next.js, Tailwind, PostgreSQL, Prisma"
                      disabled={isSubmissionEnded}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || isSubmissionEnded}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </main>

      {/* Registration Modal (Choice between Individual & Team) */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#0B0F19] border border-blue-500/30 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Hackathon Registration</span>
              </h3>
              <button
                onClick={() => setShowRegModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

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
                      className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-left transition space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white group-hover:text-blue-300">
                          Register as Individual
                        </span>
                        <span className="text-[10px] font-bold text-blue-400">Solo (₹{hackathon.entryFee})</span>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    You will be assigned as Team Leader and receive a Join Code to invite up to {hackathon.maxTeamSize || 4} members. Entry fee is ₹{hackathon.entryFee} per participant.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono uppercase text-amber-400 placeholder-slate-500 focus:outline-none focus:border-blue-500"
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

      {/* Floating 24/7 Context-Aware AI Assistant */}
      <HackathonAiAssistant
        hackathonId={hackathon.id}
        hackathonTitle={hackathon.title}
        isRegistered={hackathon.isRegistered}
        userTeam={hackathon.userTeam}
      />

      <Footer />
    </div>
  );
}
