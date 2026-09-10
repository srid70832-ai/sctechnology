"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Trophy, 
  CreditCard, 
  MousePointerClick, 
  Sparkles, 
  ArrowRight, 
  DollarSign, 
  Send, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  ExternalLink,
  Loader2,
  Share,
  MessageCircle,
  Linkedin
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function UserReferralsPage() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/referrals/my-referral", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setHistory(data.history || []);
      } else {
        // Trigger auto-creation if not exists
        const createRes = await fetch("/api/referrals/my-referral", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (createRes.ok) {
          const createData = await createRes.json();
          setStats(createData.stats);
        }
      }
    } catch (err) {
      console.error("fetchReferralData error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (user || firebaseUser)) {
      fetchReferralData();
    }
  }, [authLoading, user, firebaseUser]);

  const referralCode = stats?.referralCode || "SCTECH-MEMBER";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://sctechnology.in";
  const referralUrl = `${baseUrl}/ref/${referralCode}`;

  const whatsappMessage = `🚀 Join SC TECH and explore verified internships, exciting hackathons, real-world full stack projects, and industry HR sessions!

Join using my exclusive referral link:
${referralUrl}`;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(referralCode);
      success("Referral code copied!");
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
    window.open(url, "_blank");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join SC TECH - Build Skills. Build Careers.",
          text: whatsappMessage,
          url: referralUrl,
        });
      } catch (err) {
        // User dismissed
      }
    } else {
      setShareModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-900/30 p-6 sm:p-10 mb-10 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5 text-blue-400" />
              <span>SC TECH Real Rewards Program</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Invite Friends & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">Earn Real Rewards</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Share your personal referral link with students and peers. When they register for hackathons or purchase subscription plans, you earn real monetary rewards credited directly to your profile.
            </p>
          </div>
        </div>

        {/* Action Center: Referral Code Card & WhatsApp Share */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Unique Code & Link */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Unique Referral Code</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-blue-400 tracking-wider">
                    {referralCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Copy Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  onClick={handleNativeShare}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Link</span>
                </button>
              </div>
            </div>

            {/* Link Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Your Referral URL</label>
              <div className="flex items-center gap-2 bg-black/50 border border-slate-700/60 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="bg-transparent text-xs sm:text-sm text-slate-200 font-mono flex-1 outline-none px-2"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Icons */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-slate-400">Quick Share:</span>
              <button
                onClick={handleWhatsAppShare}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={handleTelegramShare}
                className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" /> Telegram
              </button>
              <button
                onClick={handleLinkedInShare}
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </button>
            </div>
          </div>

          {/* Card 2: Rewards Earned Summary */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-blue-800/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Rewards Earned</span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                  {formatINR(stats?.totalRewardsEarned || 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  From {stats?.paidConversions || 0} verified subscription & hackathon conversions
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Pending Rewards:</span>
              <span className="font-semibold text-amber-400">{formatINR(stats?.pendingRewards || 0)}</span>
            </div>
          </div>
        </div>

        {/* 6 Real-time Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Link Clicks</span>
              <MousePointerClick className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats?.totalClicks || 0}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Signups</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats?.totalSignups || 0}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Hackathons</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats?.hackathonRegistrations || 0}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Paid Conversions</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">
              {stats?.paidConversions || 0}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400">
              {formatINR(stats?.pendingRewards || 0)}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Rewards</span>
              <Gift className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-teal-400">
              {formatINR(stats?.totalRewardsEarned || 0)}
            </div>
          </div>
        </div>

        {/* How It Works (3 Steps) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 mb-10 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">How the SC TECH Referral Program Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm border border-blue-500/20">
                1
              </div>
              <h3 className="text-sm font-semibold text-white">Share Your Link</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send your unique referral URL via WhatsApp, Telegram, or LinkedIn to your college classmates and peers.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                2
              </div>
              <h3 className="text-sm font-semibold text-white">They Sign Up & Participate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When they sign in, their profile is permanently attributed to you. They receive exclusive referral discounts.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/20">
                3
              </div>
              <h3 className="text-sm font-semibold text-white">Earn Real Rewards</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When they enroll in a hackathon or purchase a subscription plan, server-side verified rewards are instantly credited.
              </p>
            </div>
          </div>
        </div>

        {/* Referral History Ledger Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Referral History Ledger</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of all users referred through your link
              </p>
            </div>
            <button
              onClick={fetchReferralData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">Loading referral ledger...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">No Referrals Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Share your referral link on WhatsApp to start earning rewards when your friends join SC TECH!
              </p>
              <button
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share on WhatsApp</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Referred Member</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Event Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((item) => {
                    const isRewarded = item.rewardStatus === "REWARDED" || item.status === "REWARDED";
                    const isPending = item.rewardStatus === "PENDING";

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6 font-medium text-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                              {item.referredName?.charAt(0)?.toUpperCase() || "S"}
                            </div>
                            <div>
                              <div>{item.referredName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{item.referredEmail}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono">
                            {item.source}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {item.status === "SUBSCRIPTION_PURCHASED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Subscription Purchased
                            </span>
                          )}
                          {item.status === "HACKATHON_REGISTERED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                              <Trophy className="w-3 h-3" /> Hackathon Registered
                            </span>
                          )}
                          {item.status === "SIGNED_UP" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-semibold">
                              <Users className="w-3 h-3" /> Signed Up
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-slate-400">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="py-4 px-4 text-right font-semibold">
                          {item.rewardAmount > 0 ? (
                            <span className="text-emerald-400">+{formatINR(item.rewardAmount)}</span>
                          ) : isPending ? (
                            <span className="text-amber-400 text-[11px]">Pending Conversion</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
