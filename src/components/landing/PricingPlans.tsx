"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, ShieldCheck, ArrowRight, Loader2, Zap } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { PlanItem } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { LimitedOfferConfig, getOfferFromFirestore, calculatePlanPrice, isOfferActive } from "@/lib/plans";
import { OfferBanner } from "@/components/ui/OfferBanner";

interface PricingPlansProps {
  plans: PlanItem[];
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ plans }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [offer, setOffer] = useState<LimitedOfferConfig | null>(null);

  useEffect(() => {
    getOfferFromFirestore().then((res) => {
      if (res) setOffer(res);
    }).catch(console.warn);
  }, []);

  const handleSubscribe = async (plan: PlanItem) => {
    if (!user) {
      window.location.href = `/login?redirect=/plans`;
      return;
    }

    if (plan.price === 0) {
      success("You are active on the Free Starter plan.");
      return;
    }

    setLoadingPlanId(plan.id);

    try {
      // 1. Create order on server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        error(orderData.error || "Failed to create order");
        setLoadingPlanId(null);
        return;
      }

      // Check if client-side Razorpay SDK is available
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount, // in paise
          currency: orderData.currency || "INR",
          name: "SC TECH",
          description: `${plan.name} Subscription Plan`,
          image: "/logo.png",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            // Verify payment on backend
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id || orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: plan.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              success(`Payment successful! Welcome to ${plan.name} Plan.`);
              window.location.href = "/dashboard";
            } else {
              error(verifyData.error || "Payment verification failed");
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: "#2563EB",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          error(response.error.description || "Payment failed");
        });
        rzp.open();
      } else {
        // Direct test verification fallback
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: `pay_${Date.now()}`,
            signature: "verified_signature_token",
            planId: plan.id,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          success(`Subscribed to ${plan.name} Plan!`);
          window.location.href = "/dashboard";
        } else {
          error(verifyData.error || "Verification failed");
        }
      }
    } catch {
      error("Payment checkout error");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <section className="py-20 bg-[#070B14] border-t border-slate-800/80 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-blue-600/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARENT & AFFORDABLE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Plans for Every Ambition
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Gain unlimited access to production source codes, exclusive hackathons, and 1-on-1 industry HR sessions.
          </p>
        </motion.div>

        {/* Limited-Time Offer Banner */}
        {offer && isOfferActive(offer) && (
          <OfferBanner offer={offer} />
        )}

        {/* Pricing Cards Grid with Staggered Entrance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan, idx) => {
            const isHighlighted = plan.isPopular || plan.code === "PRO";
            const priceResult = calculatePlanPrice(plan.price, plan.code, offer);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative flex flex-col justify-between p-6 rounded-3xl transition-all duration-300 ${
                  isHighlighted
                    ? "bg-[#0C1832] border-2 border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.03] z-10"
                    : "bg-[#0C162E]/70 border border-slate-800 hover:border-slate-700 shadow-xl"
                }`}
              >
                {/* Popular Pill with shimmer */}
                {isHighlighted ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center gap-1.5 overflow-hidden">
                    <div className="absolute inset-0 w-full h-full animate-shimmer pointer-events-none" />
                    <Sparkles className="w-3 h-3" />
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
                      <h3 className="text-lg font-black text-white">{plan.name}</h3>
                      {priceResult.hasDiscount && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase">
                          {offer?.badgeText || `🔥 ${priceResult.discountPercentage}% OFF`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{plan.tagline || "For career growth"}</p>
                  </div>

                  {/* Price */}
                  <div className="my-6 pb-6 border-b border-slate-800">
                    {priceResult.hasDiscount ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 line-through">{formatINR(priceResult.originalPrice)}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Save {priceResult.discountPercentage}%
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                            {formatINR(priceResult.finalPrice)}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/{plan.interval.toLowerCase()}</span>
                        </div>
                        <div className="text-[11px] text-amber-400 font-medium">
                          🔥 Limited-time offer · Save {formatINR(priceResult.savings)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-white">
                          {plan.price === 0 ? "Free" : formatINR(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-xs text-slate-400 font-medium">/{plan.interval.toLowerCase()}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 text-xs text-slate-300 mb-8">
                    {(Array.isArray(plan.features) ? plan.features : typeof plan.features === "string" ? (() => { try { return JSON.parse(plan.features); } catch { return []; } })() : []).map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loadingPlanId === plan.id}
                  className={`w-full py-3 rounded-full font-bold text-xs shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                    isHighlighted
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                      : "bg-[#102447] hover:bg-blue-600 text-slate-200 hover:text-white"
                  }`}
                >
                  {loadingPlanId === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {plan.price === 0
                          ? "Get Started"
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

        {/* Guarantee footer with pulse badge */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>7-Day Risk-Free Refund Guarantee • Instant Account Activation</span>
        </div>

      </div>
    </section>
  );
};
