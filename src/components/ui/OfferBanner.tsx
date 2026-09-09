"use client";

import React, { useState, useEffect } from "react";
import { LimitedOfferConfig } from "@/lib/plans";
import { Sparkles, Clock, Zap, ArrowRight } from "lucide-react";

interface OfferBannerProps {
  offer: LimitedOfferConfig | null;
  onScrollToPlans?: () => void;
}

export function OfferBanner({ offer, onScrollToPlans }: OfferBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!offer?.endDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const target = new Date(offer.endDate!).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [offer?.endDate]);

  if (!offer || !offer.enabled) return null;

  return (
    <div className="relative w-full max-w-5xl mx-auto mb-10 overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-blue-500/40 via-purple-500/50 to-pink-500/40 shadow-2xl shadow-blue-500/10 transition-all duration-300 hover:shadow-blue-500/20">
      {/* Background with glassmorphic styling */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d1527]/95 via-[#111836]/95 to-[#161233]/95 backdrop-blur-xl p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
        
        {/* Animated ambient glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        {/* Light shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_4s_infinite] pointer-events-none" />

        {/* Left column: Offer Title & Message */}
        <div className="relative z-10 flex items-start sm:items-center gap-4 text-left">
          <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-orange-500/20 animate-bounce">
            <span className="text-2xl select-none">🔥</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
                {offer.title || "LIMITED-TIME OFFER"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Zap className="w-3 h-3" /> Auto-Applied at Checkout
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {offer.bannerMessage || `Get ${offer.discountPercentage}% OFF on all plans`}
            </h2>
            <p className="text-sm text-slate-300 mt-0.5">
              Upgrade now to unlock verifiable credentials, full production repositories & career mentorship.
            </p>
          </div>
        </div>

        {/* Right column: Countdown timer or CTA */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
          {timeLeft ? (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mr-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
                <span>Ends in:</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-center">
                {timeLeft.days > 0 && (
                  <>
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                        {String(timeLeft.days).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">d</span>
                    </div>
                    <span className="text-slate-500 font-bold">:</span>
                  </>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">h</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">m</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-amber-300 bg-slate-800/90 px-2 py-0.5 rounded border border-amber-500/30">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              Special Promotional Period
            </div>
          )}

          {onScrollToPlans && (
            <button
              onClick={onScrollToPlans}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Claim Offer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
