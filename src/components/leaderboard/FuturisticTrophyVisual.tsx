"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, BarChart3, Zap, Users } from "lucide-react";

export const FuturisticTrophyVisual: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Floating animations (respects prefers-reduced-motion)
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

  const floatCenter = shouldReduceMotion
    ? {}
    : {
        y: [-3, 3, -3],
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <div className="w-full relative flex items-center justify-center select-none py-2">
      
      {/* ========================================================================= */}
      {/* 1. DESKTOP & TABLET COMPOSITION (Orbiting Layout with Center Anchor)     */}
      {/* ========================================================================= */}
      <div className="hidden sm:block relative w-full max-w-[660px] lg:max-w-[700px] h-[440px] md:h-[460px] mx-auto">
        
        {/* Cosmic Ambient Glows & Orbit Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer Orbit Circle */}
          <div className="w-[450px] h-[450px] md:w-[480px] md:h-[480px] rounded-full border border-slate-800/80 opacity-60 pointer-events-none" />
          {/* Inner Dashed Orbital Ring */}
          <div className="absolute w-[360px] h-[360px] md:w-[390px] md:h-[390px] rounded-full border border-indigo-500/20 border-dashed pointer-events-none animate-[spin_80s_linear_infinite]" />
          {/* Core Spotlight Glows */}
          <div className="absolute w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
          <div className="absolute w-64 h-64 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TOP LEFT: Top Innovators + Connecting Laser Beam              */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim1}
          className="absolute top-[12%] left-1 md:left-3 z-20 flex items-center"
        >
          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md transition-transform hover:scale-105">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">Top Innovators</span>
          </div>

          {/* Dotted Laser Beam extending to central card */}
          <div className="hidden md:flex items-center ml-2">
            <div className="w-10 lg:w-14 h-[1.5px] border-b-2 border-dashed border-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0 -ml-1" />
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* TOP RIGHT: Tagline + Real-World Impact + Laser Beam           */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim2}
          className="absolute top-[4%] right-1 md:right-3 z-20 flex flex-col items-end gap-2"
        >
          {/* Cursive Tagline */}
          <div className="text-right pr-1">
            <span className="font-serif italic text-xs md:text-sm text-indigo-200 drop-shadow-[0_0_12px_rgba(165,180,252,0.6)] block leading-tight">
              Students Today. <br /> Leaders Tomorrow.
            </span>
          </div>

          {/* Real-World Impact Badge with Laser Beam */}
          <div className="flex items-center">
            {/* Dotted Laser Beam extending to central card */}
            <div className="hidden md:flex items-center mr-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0 -mr-1" />
              <div className="w-10 lg:w-14 h-[1.5px] border-b-2 border-dashed border-blue-500/50" />
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-blue-500/50 text-blue-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md transition-transform hover:scale-105">
              <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="whitespace-nowrap">Real-World Impact</span>
            </div>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* CENTRAL IMAGE / TROPHY CARD (The True Center Anchor)          */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatCenter}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
        >
          <div className="relative w-[230px] sm:w-[250px] md:w-[270px] aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_0_45px_rgba(99,102,241,0.35)] border-2 border-indigo-500/50 bg-[#070B1A] group">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-purple-600/15 pointer-events-none" />
            
            {/* Main Trophy Graphic */}
            <img
              src="/images/hackathon-trophy.png"
              alt="SC TECH Grand Trophy 2026"
              className="w-full h-full object-contain select-none transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM LEFT: Hackathon Champions + Connecting Laser Beam      */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim1}
          className="absolute bottom-[10%] left-1 md:left-3 z-20 flex items-center"
        >
          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md transition-transform hover:scale-105">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">Hackathon Champions</span>
          </div>

          {/* Dotted Laser Beam extending to central card */}
          <div className="hidden md:flex items-center ml-2">
            <div className="w-10 lg:w-14 h-[1.5px] border-b-2 border-dashed border-cyan-500/50" />
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] shrink-0 -ml-1" />
          </div>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM RIGHT: Career Ready + Connecting Laser Beam            */}
        {/* ------------------------------------------------------------- */}
        <motion.div
          animate={floatAnim2}
          className="absolute bottom-[10%] right-1 md:right-3 z-20 flex items-center"
        >
          {/* Dotted Laser Beam extending to central card */}
          <div className="hidden md:flex items-center mr-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0 -mr-1" />
            <div className="w-10 lg:w-14 h-[1.5px] border-b-2 border-dashed border-purple-500/50" />
          </div>

          <div className="px-4 py-2 rounded-2xl bg-slate-950/90 border border-purple-500/50 text-purple-300 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md transition-transform hover:scale-105">
            <Users className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="whitespace-nowrap">Career Ready</span>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE CLEAN VERTICAL STACK (<sm screens: 320px to 639px)             */}
      {/* ========================================================================= */}
      <div className="block sm:hidden w-full max-w-xs mx-auto space-y-4 py-2 text-center">
        
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
        <div className="relative w-[220px] aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.35)] border-2 border-indigo-500/50 bg-[#070B1A] mx-auto">
          <img
            src="/images/hackathon-trophy.png"
            alt="SC TECH Grand Trophy 2026"
            className="w-full h-full object-contain select-none"
          />
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
