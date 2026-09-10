"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Gift, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

function ReferralLandingContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusText, setStatusText] = useState("Verifying referral code...");
  const [discountInfo, setDiscountInfo] = useState<string | null>(null);

  const rawCode = (params?.code as string) || "";
  const cleanCode = rawCode.trim().toUpperCase();
  const redirectTarget = searchParams.get("redirect") || "/register";

  useEffect(() => {
    if (!cleanCode) {
      router.replace("/");
      return;
    }

    const processReferral = async () => {
      try {
        // 1. Save in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("sctech_referral_code", cleanCode);
          sessionStorage.setItem("sctech_referral_code", cleanCode);
          // Set 7-day cookie
          document.cookie = `sctech_ref_code=${cleanCode}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }

        // 2. Log click event in Firestore
        await fetch("/api/referrals/track-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referralCode: cleanCode,
            source: searchParams.get("source") || "LINK",
            targetUrl: redirectTarget,
          }),
        });

        setStatusText("Exclusive Referral Discount Activated! 🎉");
        setDiscountInfo("Special member perks & 30% discount unlocked");

        // 3. Smooth transition to destination
        setTimeout(() => {
          if (redirectTarget.includes("?")) {
            router.replace(`${redirectTarget}&ref=${cleanCode}`);
          } else {
            router.replace(`${redirectTarget}?ref=${cleanCode}`);
          }
        }, 1200);
      } catch (err) {
        console.warn("Referral tracking notice:", err);
        router.replace(redirectTarget);
      }
    };

    processReferral();
  }, [cleanCode, redirectTarget, router, searchParams]);

  return (
    <div className="min-h-screen bg-[#060A12] flex flex-col items-center justify-center px-4 relative overflow-hidden text-slate-200">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl text-center relative z-10 space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
          <Gift className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SC TECH Referral Invite</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Welcome to SC TECH
          </h1>
          <p className="text-xs text-slate-400">
            Referred by a verified member with code:
          </p>
          <div className="font-mono text-base font-bold text-blue-400 tracking-wider bg-black/40 py-1.5 px-4 rounded-xl border border-blue-500/30 inline-block">
            {cleanCode}
          </div>
        </div>

        <div className="py-2 space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusText}</span>
          </div>
          {discountInfo && (
            <p className="text-xs text-slate-400">
              {discountInfo}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>Redirecting to your application portal...</span>
        </div>
      </motion.div>
    </div>
  );
}


export default function ReferralLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060A12] flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <ReferralLandingContent />
    </Suspense>
  );
}
