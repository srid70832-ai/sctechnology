"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, BarChart3, Zap, Users } from "lucide-react";

export const FuturisticTrophyVisual: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Floating animation configs (only active if reduced motion is false)
  const floatAnim1 = shouldReduceMotion
    ? {}
    : {
        y: [-4, 4, -4],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      };

  const floatAnim2 = shouldReduceMotion
    ? {}
    : {
        y: [4, -4, 4],
        transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
      };

  const floatAnimCenter = shouldReduceMotion
    ? {}
    : {
        y: [-2, 2, -2],
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div className="w-full relative flex items-center justify-center select-none overflow-hidden">
      
      {/* ========================================================================= */}
      {/* 1. DESKTOP & TABLET COMPOSITION (Orbiting Layout with Center Anchor)     */}
      {/* ========================================================================= */}
      <div className="hidden sm:block relative w-full max-w-[620px] lg:max-w-[660px] h-[400px] md:h-[430px] mx-auto">
        
        {/* Cosmic Ambient Glows & Orbit Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer Orbit Circle */}
          <div className="w-[420px] h-[420px] md:w-[460px] md:h-[460px] rounded-full border border-slate-800/70 opacity-60 pointer-events-none" />
          {/* Inner Dashed Orbital Ring */}
          <div className="absolute w-[340px] h-[340px] md:w-[370px] md:h-[370px] rounded-full border border-indigo-500/20 border-dashed pointer-events-none animate-[spin_60s_linear_infinite]" />
          {/* Core Spotlight Glows */}
          <div className="absolute w-72 h-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
          <div className="absolute w-60 h-60 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        </div>

        {/* Laser Connecting Lines (SVG overlay from badges to central card) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 660 430" fill="none">
          {/* Top Left: Amber Laser to Card */}
          <line x1="210" y1="90" x2="260" y2="90" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          <circle cx="260" cy="90" r="2.5" fill="#F59E0B" />

          {/* Top Right: Blue Laser to Card */}
          <line x1="450" y1="120" x2="400" y2="120" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          <circle cx="400" cy="120" r="2.5" fill="#3B82F6" />

          {/* Bottom Left: Cyan Laser to Card */}
          <line x1="220" y1="340" x2="260" y2="340" stroke="#06B6D4" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          <circle cx="260" cy="340" r="2.5" fill="#06B6D4" />

          {/* Bottom Right: Purple Laser to Card */}
          <line x1="440" y1="340" x2="400" y2="340" stroke="#A855F7" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 3" />
          <circle cx="400" cy="340" r="2.5" fill="#A855F7" />
        </svg>

        {/* ------------------------------------------------------------- */}
        {/* TOP LEFT: Top Innovators                                      */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim1}
          className="absolute top-[16%] left-[3%] md:left-[5%] z-20"
        >
          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-md transition-transform hover:scale-105">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">Top Innovators</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* TOP RIGHT: Tagline + Real-World Impact                        */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim2}
          className="absolute top-[8%] right-[3%] md:right-[5%] z-20 flex flex-col items-end gap-2"
        >
          {/* Cursive Tagline */}
          <div className="text-right">
            <span className="font-serif italic text-xs md:text-sm text-indigo-200 drop-shadow-[0_0_12px_rgba(165,180,252,0.5)] block leading-snug">
              Students Today. <br /> Leaders Tomorrow.
            </span>
          </div>

          {/* Real-World Impact Badge */}
          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-blue-500/50 text-blue-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.25)] backdrop-blur-md transition-transform hover:scale-105">
            <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="whitespace-nowrap">Real-World Impact</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* CENTRAL IMAGE / TROPHY CARD (The Visual Anchor)              */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnimCenter}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[210px] sm:w-[230px] md:w-[245px]"
        >
          <div className="relative rounded-3xl bg-gradient-to-b from-[#0F1738] via-[#0A0F26] to-[#060919] border-2 border-indigo-500/60 p-4 shadow-[0_0_35px_rgba(99,102,241,0.3)] backdrop-blur-xl overflow-hidden group">
            
            {/* Ambient neon backlights */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Row: Year "2026" */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-sm font-black text-cyan-400 font-mono tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                2026
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>

            {/* Central Trophy Visual with Neon Glow */}
            <div className="relative flex flex-col items-center justify-center my-2">
              <div className="relative">
                {/* Subtle blue triangle portal outline in background */}
                <svg className="absolute -top-3 left-1/2 -translate-x-1/2 w-44 h-44 pointer-events-none opacity-40" viewBox="0 0 100 100">
                  <polygon points="50,5 95,90 5,90" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                </svg>

                <img
                  src="/images/hackathon-trophy.png"
                  alt="SC TECH Grand Trophy"
                  className="w-36 sm:w-40 md:w-44 max-h-48 object-contain filter drop-shadow-[0_12px_25px_rgba(245,158,11,0.4)] relative z-10 transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Ideas Beyond Limits Neon Script */}
              <div className="w-full text-right -mt-2 pr-1 relative z-10">
                <span className="font-serif italic text-[11px] sm:text-xs text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]">
                  Ideas Beyond Limits
                </span>
              </div>
            </div>

            {/* Pedestal Brand Pillars Footer */}
            <div className="mt-1 w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-center">
              <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-widest text-cyan-200 block font-mono">
                LEARN • BUILD • GROW • SUCCEED
              </span>
            </div>

          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM LEFT: Hackathon Champions                              */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim1}
          className="absolute bottom-[16%] left-[3%] md:left-[5%] z-20"
        >
          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md transition-transform hover:scale-105">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">Hackathon Champions</span>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM RIGHT: Career Ready                                    */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim2}
          className="absolute bottom-[16%] right-[3%] md:right-[5%] z-20"
        >
          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-purple-500/50 text-purple-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.25)] backdrop-blur-md transition-transform hover:scale-105">
            <Users className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="whitespace-nowrap">Career Ready</span>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE CLEAN VERTICAL STACK (<sm screens: 320px to 639px)             */}
      {/* ========================================================================= */}
      <div className="block sm:hidden w-full max-w-sm mx-auto space-y-4 py-3 text-center">
        
        {/* Top Innovators Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Top Innovators</span>
        </div>

        {/* Tagline & Real-World Impact Stack */}
        <div className="space-y-2">
          <div className="font-serif italic text-xs text-indigo-200 drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]">
            Students Today. Leaders Tomorrow.
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950/90 border border-blue-500/50 text-blue-300 text-xs font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Real-World Impact</span>
          </div>
        </div>

        {/* Central Trophy Card (Mobile Size) */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#0F1738] via-[#0A0F26] to-[#060919] border-2 border-indigo-500/60 p-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-xl w-full max-w-[240px] mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-cyan-400 font-mono">2026</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          <div className="flex flex-col items-center justify-center my-2">
            <img
              src="/images/hackathon-trophy.png"
              alt="SC TECH Grand Trophy"
              className="w-32 max-h-40 object-contain drop-shadow-[0_10px_20px_rgba(245,158,11,0.35)]"
            />
            <div className="w-full text-right -mt-1 pr-1">
              <span className="font-serif italic text-[10px] text-cyan-300">
                Ideas Beyond Limits
              </span>
            </div>
          </div>

          <div className="mt-1 w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 border border-cyan-400/40 text-center">
            <span className="text-[7.5px] font-black uppercase tracking-widest text-cyan-200 font-mono">
              LEARN • BUILD • GROW • SUCCEED
            </span>
          </div>
        </div>

        {/* Bottom Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Hackathon Champions</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-purple-500/50 text-purple-300 text-[11px] font-bold shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Career Ready</span>
          </div>
        </div>

      </div>

    </div>
  );
};
