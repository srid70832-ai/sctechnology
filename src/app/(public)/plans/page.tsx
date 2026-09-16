"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { PlanData, getPlansFromFirestore, DEFAULT_PLANS, LimitedOfferConfig, getOfferFromFirestore, calculatePlanPrice, isOfferActive } from "@/lib/plans";
import { OfferBanner } from "@/components/ui/OfferBanner";
import { formatINR } from "@/lib/utils";
import { 
  Sparkles, 
  Check, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle, 
  ChevronDown, 
  Layers, 
  Code2, 
  Award, 
  Users, 
  Briefcase, 
  Loader2, 
  Zap,
  CheckCircle2,
  Lock,
  X,
  QrCode,
  CreditCard,
  RefreshCw,
  Printer,
  Smartphone,
  ExternalLink,
  Flame
} from "lucide-react";
import { auth } from "@/lib/firebase";

export default function PlansPage() {
  const router = useRouter();
  const { user, firebaseUser, refresh, loading: authLoading } = useAuth();
  const { success, error } = useToast();

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [plans, setPlans] = useState<PlanData[]>(DEFAULT_PLANS);
  const [offer, setOffer] = useState<LimitedOfferConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlanCode, setLoadingPlanCode] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Payment Selection Dialog State
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanData | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);

  // Dynamic QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState<{
    paymentId: string;
    orderId: string;
    paymentReference: string;
    qrDataUrl: string;
    upiString: string;
    amount: number;
    planName: string;
    receiptNumber: string;
  } | null>(null);
  const [qrStatus, setQrStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "FAILED">("IDLE");
  const [verifiedPaymentRecord, setVerifiedPaymentRecord] = useState<any | null>(null);

  // Success Modal State (Checkout)
  const [purchasedPlan, setPurchasedPlan] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansData, offerData] = await Promise.all([
          getPlansFromFirestore(),
          getOfferFromFirestore(),
        ]);
        if (plansData && plansData.length > 0) {
          setPlans(plansData);
        }
        if (offerData) {
          setOffer(offerData);
        }
      } catch (err) {
        console.error("Error loading plans & offer:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 1. Initial Plan Click
  const handlePlanClick = (plan: PlanData) => {
    if (plan.code === "FREE" || plan.priceMonthly === 0) {
      const currentUser = auth.currentUser || firebaseUser;
      if (!currentUser && !user) {
        window.location.href = "/register";
      } else {
        success("You have active access to the Free tier!");
        router.push("/dashboard");
      }
      return;
    }

    if (authLoading) {
      return;
    }

    const currentUser = auth.currentUser || firebaseUser;
    if (!currentUser) {
      window.location.href = `/login?redirect=/plans`;
      return;
    }

    const currentPlan = (user as any)?.plan || "FREE";
    if (currentPlan.toUpperCase() === plan.code.toUpperCase()) {
      success(`You are already subscribed to the ${plan.name} plan.`);
      return;
    }

    // Open Payment Method Selection (Razorpay Checkout OR Dynamic QR)
    setSelectedPlanForPayment(plan);
    setShowMethodModal(true);
  };

  // 2. Pay with Razorpay Checkout
  const handleRazorpayCheckout = async () => {
    if (!selectedPlanForPayment) return;
    const plan = selectedPlanForPayment;

    const currentUser = auth.currentUser || firebaseUser;
    if (!currentUser) {
      error("Unauthorized. Please log in to continue.");
      window.location.href = `/login?redirect=/plans`;
      return;
    }

    setShowMethodModal(false);
    setLoadingPlanCode(plan.code);

    try {
      const token = await currentUser.getIdToken(true);

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.code,
          billingCycle,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        error(orderData.error || "Failed to initialize payment order");
        setLoadingPlanCode(null);
        return;
      }

      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "SC TECH",
          description: `${plan.name} (${billingCycle.toLowerCase()}) Subscription`,
          image: "/logo.png",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            setLoadingPlanCode(plan.code);
            try {
              const freshToken = await currentUser.getIdToken(true);
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${freshToken}`,
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id || orderData.orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  planId: plan.code,
                  billingCycle,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                await refresh();
                setPurchasedPlan(plan.name);
                setShowSuccessModal(true);
                success(`Payment verified! Welcome to SC TECH ${plan.name} Plan.`);
              } else {
                error(verifyData.error || "Payment signature verification failed");
              }
            } catch {
              error("Payment verification network error");
            } finally {
              setLoadingPlanCode(null);
            }
          },
          modal: {
            ondismiss: function () {
              setLoadingPlanCode(null);
              error("Payment cancelled.");
            },
          },
          prefill: {
            name: user?.name || currentUser.displayName || "",
            email: user?.email || currentUser.email || "",
          },
          theme: {
            color: "#2563EB",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          setLoadingPlanCode(null);
          error(resp.error?.description || "Payment was not completed.");
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      error("Failed to open Razorpay Checkout. Please try again.");
      setLoadingPlanCode(null);
    }
  };

  // 3. Pay by Scanning Dynamic QR
  const handleOpenQrPayment = async () => {
    if (!selectedPlanForPayment) return;
    const plan = selectedPlanForPayment;

    if (authLoading) {
      return;
    }

    const currentUser = auth.currentUser || firebaseUser;
    if (!currentUser) {
      error("Unauthorized. Please log in to continue.");
      window.location.href = `/login?redirect=/plans`;
      return;
    }

    setShowMethodModal(false);
    setShowQrModal(true);
    setQrLoading(true);
    setQrStatus("IDLE");
    setVerifiedPaymentRecord(null);

    try {
      // Get fresh Firebase ID token
      const token = await currentUser.getIdToken(true);

      const res = await fetch("/api/payments/create-qr-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.code,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQrData(data);
      } else {
        error(data.error || "Failed to generate dynamic QR code");
        setShowQrModal(false);
      }
    } catch {
      error("Network error while generating QR");
      setShowQrModal(false);
    } finally {
      setQrLoading(false);
    }
  };

  // 4. Verify QR Payment Status
  const handleVerifyQrStatus = async () => {
    if (!qrData) return;

    const currentUser = auth.currentUser || firebaseUser;
    if (!currentUser) {
      error("Unauthorized. Please log in to continue.");
      return;
    }

    setQrStatus("PROCESSING");
    try {
      const token = await currentUser.getIdToken(true);

      const res = await fetch("/api/payments/verify-qr", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: qrData.paymentId,
          orderId: qrData.orderId,
          planId: selectedPlanForPayment?.code,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refresh();
        setQrStatus("SUCCESS");
        setVerifiedPaymentRecord(data.payment);
        success("Payment verified and captured! Plan is now active. 🚀");
      } else {
        setQrStatus("FAILED");
        error(data.error || "Payment verification pending. Try again in a few seconds.");
      }
    } catch {
      setQrStatus("FAILED");
      error("Network error checking payment status");
    }
  };

  const COMPARISON_ROWS = [
    { feature: "Student Profile & Public Portfolio", free: "✓ Included", starter: "✓ Included", pro: "✓ Included", career: "✓ Included" },
    { feature: "Public Internship & Hackathon Browsing", free: "✓ Included", starter: "✓ Included", pro: "✓ Included", career: "✓ Included" },
    { feature: "Full-Stack Project Blueprints", free: "Selected Free", starter: "Standard Access", pro: "Full Access", career: "Full Access" },
    { feature: "Production Source Code Downloads", free: "— Not included", starter: "Selected Repos", pro: "Unlimited Eligible", career: "Unlimited Full Access" },
    { feature: "Internship Application Tracking Tools", free: "Basic", starter: "✓ Included", pro: "Priority Support", career: "Priority Matching Pipeline" },
    { feature: "Verifiable Digital Certificates", free: "— Not included", starter: "— Not included", pro: "✓ Included for eligible tracks", career: "✓ Lifetime Verification" },
    { feature: "Allocated HR & Recruiter Sessions", free: "— Not included", starter: "— Not included", pro: "Eligible Sessions", career: "Priority 1-on-1 & Group" },
    { feature: "Resume Review Checklist & Templates", free: "— Not included", starter: "Basic Guides", pro: "Full Checklist", career: "Detailed Review Guidance" },
    { feature: "Technical Interview Preparation", free: "— Not included", starter: "— Not included", pro: "Standard Modules", career: "Comprehensive Prep" },
    { feature: "Sponsored Hackathon Benefits", free: "Standard Entry", starter: "Discounted Entry", pro: "Free / Discounted", career: "VIP Direct Access" },
    { feature: "Customer Support SLA", free: "Community Support", starter: "Standard Email", pro: "Priority Support", career: "24/7 VIP Priority Support" },
  ];

  const FAQS = [
    {
      q: "What is included in the Free plan?",
      a: "The Free plan gives you access to student profile creation, public portfolio hosting, browsing verified internships and hackathons, community learning guides, and selected open-access project repositories. No payment or credit card is required.",
    },
    {
      q: "Can I pay using any UPI app via QR?",
      a: "Yes! The dynamic QR code supports Google Pay, PhonePe, Paytm, BHIM, and any standard UPI application.",
    },
    {
      q: "How does the annual plan pricing work?",
      a: "Annual plans are billed once for 12 months at a discounted rate, giving you substantial savings compared to 12 consecutive monthly payments.",
    },
    {
      q: "How are digital certificates issued?",
      a: "Digital certificates are awarded upon successful completion of eligible project tracks, hackathon achievements, and verified program milestones. Each certificate comes with a unique cryptographic ID and public verification URL.",
    },
    {
      q: "Are internships guaranteed?",
      a: "SC TECH provides verified internship openings, direct application tracking, and career readiness tools. Selection is determined by candidate eligibility, application quality, and the respective company's hiring process. We do not make misleading 100% placement claims.",
    },
    {
      q: "What payment methods are supported in Razorpay?",
      a: "We support real-time UPI (Google Pay, PhonePe, Paytm), Credit Cards, Debit Cards, Net Banking, and Scan & Pay QR securely powered by Razorpay.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 space-y-24 py-16">
        
        {/* 1. HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[160px] pointer-events-none rounded-full" />

          <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>START FREE. UPGRADE WHEN YOU NEED MORE.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Build Skills. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
                Build Proof. Build Your Career.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              One unified career launch platform for real-world projects, source code blueprints, hackathons, industry recruiter sessions, and verified credentials.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="relative z-10 pt-6 flex items-center justify-center gap-3">
            <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center shadow-xl">
              <button
                type="button"
                onClick={() => setBillingCycle("MONTHLY")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === "MONTHLY"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Monthly Billing
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle("YEARLY")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === "YEARLY"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  Save up to 17%
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. PRICING CARDS */}
        <section id="pricing-cards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Limited-Time Offer Banner */}
          {offer && isOfferActive(offer) && (
            <OfferBanner offer={offer} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan, idx) => {
              const isPro = plan.code === "PRO";
              const rawBasePrice = billingCycle === "MONTHLY" ? plan.priceMonthly : plan.priceYearly;
              const priceResult = calculatePlanPrice(rawBasePrice, plan.code, offer);
              const isCurrentUserPlan = (user as any)?.plan?.toUpperCase() === plan.code.toUpperCase();
              const savingsAnnual = (plan.priceMonthly * 12) - plan.priceYearly;

              return (
                <motion.div
                  key={plan.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -6 }}
                  className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl transition-all duration-300 ${
                    isPro
                      ? "bg-slate-900 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 lg:scale-[1.04] z-20"
                      : "bg-slate-900/70 border border-slate-800 hover:border-slate-700 shadow-xl"
                  }`}
                >
                  {/* Highlight pill */}
                  {isPro ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/40 flex items-center gap-1.5 overflow-hidden">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>MOST POPULAR</span>
                    </div>
                  ) : priceResult.hasDiscount ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/90 to-red-500/90 text-white text-[9px] font-black uppercase tracking-widest shadow-md shadow-orange-500/30 flex items-center gap-1">
                      <span>🔥 LIMITED OFFER</span>
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xl font-black text-white">{plan.name}</h3>
                        {isCurrentUserPlan ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            CURRENT PLAN
                          </span>
                        ) : priceResult.hasDiscount ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
                            {offer?.badgeText || `🔥 ${priceResult.discountPercentage}% OFF`}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-blue-400 font-medium mt-0.5">{plan.positioning}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{plan.tagline}</p>
                    </div>

                    <div className="my-6 pb-6 border-b border-slate-800/80">
                      {priceResult.hasDiscount ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-400 line-through">
                              {formatINR(priceResult.originalPrice)}
                            </span>
                            <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              Save {priceResult.discountPercentage}%
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                              {formatINR(priceResult.finalPrice)}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">
                              /{billingCycle === "MONTHLY" ? "mo" : "year"}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-amber-400/90 flex items-center gap-1">
                            <span>🔥 Limited-time offer</span>
                            {priceResult.savings > 0 && (
                              <span className="text-slate-400">· You save {formatINR(priceResult.savings)}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-black text-white">
                              {rawBasePrice === 0 ? "₹0" : formatINR(rawBasePrice)}
                            </span>
                            {rawBasePrice > 0 && (
                              <span className="text-xs text-slate-400 font-semibold">
                                /{billingCycle === "MONTHLY" ? "mo" : "year"}
                              </span>
                            )}
                          </div>

                          {billingCycle === "YEARLY" && savingsAnnual > 0 && (
                            <div className="text-[11px] font-semibold text-emerald-400">
                              Save {formatINR(savingsAnnual)} per year
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 text-xs text-slate-300 mb-8">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={isCurrentUserPlan || (authLoading && plan.code !== "FREE")}
                    className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                      isCurrentUserPlan
                        ? "bg-slate-800 text-slate-400 cursor-default"
                        : isPro
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30"
                        : plan.code === "FREE"
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                        : "bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white"
                    }`}
                  >
                    {isCurrentUserPlan ? (
                      <span>Current Active Plan ✓</span>
                    ) : authLoading && plan.code !== "FREE" ? (
                      <span className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>Initializing session...</span>
                      </span>
                    ) : (
                      <>
                        <span>
                          {plan.code === "FREE"
                            ? plan.ctaText
                            : priceResult.hasDiscount
                            ? `Claim Offer & Upgrade to ${plan.name}`
                            : `Pay & Upgrade to ${plan.name}`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Razorpay Checkout & Dynamic QR • 100% Server Verified • Instant Dashboard Sync</span>
          </div>
        </section>

        {/* 3. COMPARISON MATRIX */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Compare Plans</h2>
            <p className="text-xs text-slate-400">Detailed breakdown of features across all 4 SC TECH tiers.</p>
          </div>

          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-300">
                    <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-slate-400 w-2/5">Platform Feature</th>
                    <th className="p-4 sm:p-5 font-bold text-center">Free (₹0)</th>
                    <th className="p-4 sm:p-5 font-bold text-center">Starter</th>
                    <th className="p-4 sm:p-5 font-bold text-center text-blue-400 bg-blue-600/10">Pro (Popular)</th>
                    <th className="p-4 sm:p-5 font-bold text-center">Career</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {COMPARISON_ROWS.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 sm:p-5 font-semibold text-slate-200">{row.feature}</td>
                      <td className="p-4 sm:p-5 text-center text-slate-400">{row.free}</td>
                      <td className="p-4 sm:p-5 text-center text-slate-300">{row.starter}</td>
                      <td className="p-4 sm:p-5 text-center font-bold text-blue-300 bg-blue-600/5">{row.pro}</td>
                      <td className="p-4 sm:p-5 text-center font-bold text-white">{row.career}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. WHY STUDENTS CHOOSE SC TECH */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
              <Layers className="w-3.5 h-3.5" />
              <span>THE SC TECH ADVANTAGE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Why Students Choose SC TECH</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Stop learning in isolation. Build real production systems, compete in live challenges, and get noticed by recruiters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Production Projects</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Work with scalable full-stack architectures, clean folder structures, and industry-standard libraries.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Verifiable Certificates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Earn cryptographically verifiable digital certificates with unique validation IDs for your portfolio.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Industry Recruiter Talks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Participate in live sessions with engineering leaders and talent recruiters to master interviews.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Internship Pipeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Apply directly to verified internship opportunities and track candidate stages from one dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* 5. CAREER ROI SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>CAREER ROI</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Your Career is an Investment</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Instead of paying tens of thousands for disconnected courses, SC TECH integrates project repositories, hackathons, HR sessions, and verifiable credentials into one affordable platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Entry Level</span>
                <div className="text-lg font-black text-white">₹0 Free</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-center space-y-1">
                <span className="text-[10px] text-blue-300 uppercase font-semibold">Most Popular Pro</span>
                <div className="text-lg font-black text-white">₹499 / mo</div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. FAQ ACCORDION */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about SC TECH plans, subscriptions, and certifications.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-md transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 text-xs font-bold text-white hover:text-blue-400 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* A. CHOOSE PAYMENT METHOD MODAL */}
      <AnimatePresence>
        {showMethodModal && selectedPlanForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Choose Payment Method</span>
                <button onClick={() => setShowMethodModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>

              {(() => {
                const rawPrice = billingCycle === "YEARLY" ? selectedPlanForPayment.priceYearly : selectedPlanForPayment.priceMonthly;
                const modalPriceResult = calculatePlanPrice(rawPrice, selectedPlanForPayment.code, offer);
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-xl font-black text-white">{selectedPlanForPayment.name} Plan</h3>
                      {modalPriceResult.hasDiscount && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                          {offer?.badgeText || `${modalPriceResult.discountPercentage}% OFF`}
                        </span>
                      )}
                    </div>
                    {modalPriceResult.hasDiscount ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className="text-slate-400 line-through">{formatINR(modalPriceResult.originalPrice)}</span>
                          <span className="text-emerald-400 font-bold">Save {formatINR(modalPriceResult.savings)}</span>
                        </div>
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                          {formatINR(modalPriceResult.finalPrice)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-emerald-400">
                        {formatINR(rawPrice)}
                      </div>
                    )}
                    <span className="text-[11px] text-slate-400">Billing: {billingCycle}</span>
                  </div>
                );
              })()}

              {/* Two Payment Options */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with Razorpay Checkout</span>
                </button>

                <div className="flex items-center gap-3 text-slate-500 text-xs">
                  <div className="flex-1 border-t border-slate-800" />
                  <span>OR</span>
                  <div className="flex-1 border-t border-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={handleOpenQrPayment}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan & Pay Dynamic QR</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Scan using Google Pay, PhonePe, Paytm, or any UPI app.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. DYNAMIC QR PAYMENT MODAL / BOTTOM SHEET */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0A0E1A] border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">SC TECH UPI Scan & Pay</h3>
                    <span className="text-[10px] text-slate-400 font-mono">Ref: {qrData?.paymentReference || "SC-INIT"}</span>
                  </div>
                </div>

                {qrStatus !== "SUCCESS" && (
                  <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white text-xs">
                    ✕
                  </button>
                )}
              </div>

              {/* QR State Rendering */}
              {qrLoading ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                  <p className="text-xs">Generating secure dynamic UPI QR code...</p>
                </div>
              ) : qrStatus === "SUCCESS" ? (
                <div className="py-6 space-y-5 text-slate-100">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      PAYMENT CAPTURED ✓
                    </span>
                    <h4 className="text-lg font-black text-white pt-2">Payment Successful!</h4>
                    <p className="text-xs text-slate-300">
                      Receipt No: <span className="font-mono text-white font-bold">{verifiedPaymentRecord?.receiptNumber}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Receipt has been sent to: <strong className="text-slate-200">{user?.email}</strong>
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <Link
                      href={`/receipts/${verifiedPaymentRecord?.id || qrData?.paymentId}`}
                      target="_blank"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-emerald-400">{formatINR(qrData?.amount || 0)}</div>
                    <p className="text-xs text-slate-300 font-semibold">{qrData?.planName}</p>
                  </div>

                  {/* SC TECH Branded QR Frame Container */}
                  <div className="relative p-3 rounded-3xl bg-white border-4 border-cyan-400 shadow-2xl max-w-[280px] mx-auto">
                    {qrData?.qrDataUrl ? (
                      <img
                        src={qrData.qrDataUrl}
                        alt="SC TECH UPI Payment QR"
                        className="w-full h-auto rounded-2xl block"
                      />
                    ) : (
                      <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        QR Unavailable
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">Scan with any UPI app to pay</p>
                    <p className="text-[10px] text-slate-500 font-mono">Google Pay • PhonePe • Paytm • BHIM</p>
                  </div>

                  {/* Status Checking / Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleVerifyQrStatus}
                      disabled={qrStatus === "PROCESSING"}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {qrStatus === "PROCESSING" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying with Server...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>I&apos;ve completed payment / Check Status</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <button
                        type="button"
                        onClick={handleOpenQrPayment}
                        className="hover:text-slate-200 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQrModal(false)}
                        className="hover:text-rose-400"
                      >
                        Cancel Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. CHECKOUT SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6 text-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  TEST PAYMENT VERIFIED ✓
                </span>
                <h3 className="text-xl font-bold text-white pt-2">Payment Successful!</h3>
                <p className="text-sm font-semibold text-blue-400">Welcome to SC TECH {purchasedPlan} 🚀</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your {purchasedPlan} subscription is now active. All eligible production projects, source code downloads, and digital certificates are unlocked.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/dashboard");
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
