"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { 
  GraduationCap, 
  Code2, 
  Briefcase, 
  Trophy, 
  Building2, 
  Globe, 
  Star, 
  BarChart3, 
  Box, 
  Users, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

interface CareerNetworkStats {
  students?: number;
  projects?: number;
  internships?: number;
  hackathons?: number;
  companies?: number;
}

interface FutureCareerNetworkProps {
  stats?: CareerNetworkStats;
}

export const FutureCareerNetwork: React.FC<FutureCareerNetworkProps> = ({ stats }) => {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const bgX = useTransform(smoothX, [-300, 300], [12, -12]);
  const bgY = useTransform(smoothY, [-300, 300], [8, -8]);
  const fgX = useTransform(smoothX, [-300, 300], [-10, 10]);
  const fgY = useTransform(smoothY, [-300, 300], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Canvas Starfield / Glowing Dust Particles Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      maxAlpha: number;
      alphaSpeed: number;
    }> = [];

    const colors = ["#38BDF8", "#818CF8", "#C084FC", "#60A5FA", "#34D399"];
    const particleCount = typeof window !== "undefined" && window.innerWidth < 768 ? 30 : 65;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.1,
        maxAlpha: Math.random() * 0.6 + 0.4,
        alphaSpeed: Math.random() * 0.015 + 0.005,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaSpeed;

        if (p.alpha > p.maxAlpha || p.alpha < 0.1) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden bg-[#050811] py-14 sm:py-20 select-none border-t border-b border-cyan-500/20"
      style={{
        background: "radial-gradient(ellipse 100% 70% at 50% 30%, #0B132B 0%, #050811 80%)",
      }}
    >
      {/* Particle Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Atmospheric Ambient Lighting Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-blue-600/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[350px] bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[350px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Background Graphic Horizon Silhouette */}
      <motion.div 
        style={shouldReduceMotion ? {
          backgroundImage: "url('/images/future-career-ecosystem.jpg')",
          backgroundPosition: "center 45%",
          backgroundSize: "cover",
        } : { 
          x: bgX, 
          y: bgY,
          backgroundImage: "url('/images/future-career-ecosystem.jpg')",
          backgroundPosition: "center 45%",
          backgroundSize: "cover",
        }}
        className="absolute inset-0 w-full h-full opacity-35 pointer-events-none bg-center bg-cover mix-blend-screen"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Top Floating Badge & Cursive Motto Row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#091226]/90 border border-cyan-500/35 text-xs font-black tracking-wider text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md uppercase">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>YOUR JOURNEY. OUR ECOSYSTEM.</span>
          </div>

          {/* Top Right Neon Cursive Text */}
          <div className="hidden sm:block">
            <span 
              className="text-lg lg:text-xl font-bold italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-fuchsia-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.45)]"
              style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive, sans-serif" }}
            >
              Same Students. Bigger Futures.
            </span>
          </div>
        </div>

        {/* Hero Section Title & Description */}
        <div className="max-w-3xl space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            From Learning to a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#D946EF] drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]">
              Limitless Future
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Skills. Projects. Internships. Hackathons. Everything you need to build your career — in one place.
          </p>

          <div className="pt-2">
            <Link
              href="/internships"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(99,102,241,0.5)] transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* MAIN FUTURISTIC ECOSYSTEM STAGE */}
        <div className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] w-full rounded-3xl bg-[#060A17]/85 border border-cyan-500/30 p-4 sm:p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col justify-between">
          
          {/* SVG Animated Neon Circuit Highway Paths */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-0" 
            viewBox="0 0 1000 700" 
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="neonPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="1" />
                <stop offset="100%" stopColor="#E879F9" stopOpacity="0.8" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base Background Pathways */}
            <path 
              d="M 500,620 Q 360,520 220,380 T 360,200 Q 450,150 500,100" 
              fill="none" 
              stroke="#0E2347" 
              strokeWidth="14" 
              strokeLinecap="round"
            />
            <path 
              d="M 500,620 Q 640,520 780,380 T 640,200 Q 550,150 500,100" 
              fill="none" 
              stroke="#0E2347" 
              strokeWidth="14" 
              strokeLinecap="round"
            />

            {/* Inner Neon Glow Tracks */}
            <path 
              d="M 500,620 Q 360,520 220,380 T 360,200 Q 450,150 500,100" 
              fill="none" 
              stroke="url(#neonCyan)" 
              strokeWidth="3.5" 
              filter="url(#glow)"
              strokeDasharray="16 8"
              className="animate-[pulse_3s_ease-in-out_infinite]"
            />
            <path 
              d="M 500,620 Q 640,520 780,380 T 640,200 Q 550,150 500,100" 
              fill="none" 
              stroke="url(#neonPurple)" 
              strokeWidth="3.5" 
              filter="url(#glow)"
              strokeDasharray="16 8"
              className="animate-[pulse_3.5s_ease-in-out_infinite]"
            />

            {/* Central Fast-Flow Light Rays */}
            <path 
              d="M 500,620 L 500,130" 
              fill="none" 
              stroke="url(#neonCyan)" 
              strokeWidth="2.5" 
              strokeDasharray="8 12"
              opacity="0.6"
            />
          </svg>

          {/* LAYER 1: APEX CAREER CITY (Top Center Platform) */}
          <motion.div 
            style={shouldReduceMotion ? {} : { x: fgX, y: fgY }}
            className="relative z-10 mx-auto text-center pt-2 sm:pt-4 max-w-sm"
          >
            <Link href="/leaderboard" className="block group">
              <div className="relative inline-block">
                {/* Glowing Holographic Base Pod */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-t from-cyan-500/30 to-indigo-600/10 border-2 border-cyan-400 p-2 mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)] group-hover:scale-105 transition-transform duration-500 relative">
                  
                  {/* Digital City Skyline Icon Simulation */}
                  <Building2 className="w-12 h-12 text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]" />
                  
                  {/* Apex Beacon Light */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 animate-ping" />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#fff]" />
                </div>

                {/* Rotating Cyber Ring */}
                <div className="absolute -inset-2 rounded-full border border-cyan-400/40 border-dashed animate-spin pointer-events-none" style={{ animationDuration: "18s" }} />
              </div>

              {/* Title & Badge */}
              <div className="mt-3 space-y-0.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  CAREER
                </h3>
                <p className="text-[11px] font-semibold text-cyan-300/90 tracking-wide">
                  Opportunities Beyond Limits
                </p>
              </div>
            </Link>
          </motion.div>

          {/* LAYER 2: 4 FLOATING ECOSYSTEM NODES (Skills, Projects, Internships, Hackathons) */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-auto py-6">
            
            {/* Node 1: Skills */}
            <motion.div
              initial={shouldReduceMotion ? {} : { y: 15, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
              className="group"
            >
              <Link href="/courses" className="block">
                <div className="p-4 rounded-3xl bg-gradient-to-b from-[#09152E]/90 to-[#060D1F]/90 border border-blue-500/40 hover:border-cyan-400 shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] backdrop-blur-xl transition-all duration-300 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                      Skills
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Learn from top platforms
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Node 2: Projects */}
            <motion.div
              initial={shouldReduceMotion ? {} : { y: 15, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 0.5 }}
              className="group"
            >
              <Link href="/projects" className="block">
                <div className="p-4 rounded-3xl bg-gradient-to-b from-[#09152E]/90 to-[#060D1F]/90 border border-cyan-500/40 hover:border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] backdrop-blur-xl transition-all duration-300 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                    <Code2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                      Projects
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Build real-world solutions
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Node 3: Internships */}
            <motion.div
              initial={shouldReduceMotion ? {} : { y: 15, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4.4, ease: "easeInOut", delay: 1 }}
              className="group"
            >
              <Link href="/internships" className="block">
                <div className="p-4 rounded-3xl bg-gradient-to-b from-[#09152E]/90 to-[#060D1F]/90 border border-indigo-500/40 hover:border-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] backdrop-blur-xl transition-all duration-300 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">
                      Internships
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Gain industry experience
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Node 4: Hackathons */}
            <motion.div
              initial={shouldReduceMotion ? {} : { y: 15, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 1.5 }}
              className="group"
            >
              <Link href="/hackathons" className="block">
                <div className="p-4 rounded-3xl bg-gradient-to-b from-[#120B2E]/90 to-[#0B061F]/90 border border-purple-500/40 hover:border-fuchsia-300 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(217,70,239,0.4)] backdrop-blur-xl transition-all duration-300 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-purple-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-amber-200" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                      Hackathons
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Compete & Innovate
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>

          </div>

          {/* LAYER 3: FOREGROUND WALKING PATHWAY & 4 GLASS PANELS */}
          <div className="relative z-10 pt-4 pb-2">
            
            {/* 4 Standing Glass Neon Road Panels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mb-6">
              
              <div className="p-3 rounded-2xl bg-[#09152C]/80 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-2.5 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white leading-tight">
                  Learn <br />New Skills
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#09152C]/80 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.25)] flex items-center gap-2.5 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Box className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white leading-tight">
                  Build <br />Real Projects
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#09152C]/80 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center gap-2.5 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white leading-tight">
                  Gain <br />Experience
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#120B2C]/80 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center gap-2.5 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white leading-tight">
                  Create <br />Impact
                </div>
              </div>

            </div>

            {/* Bottom Flanking Global Community & Real Opportunities Cards */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              
              {/* Left Flank: A Global Community */}
              <Link 
                href="/community" 
                className="inline-flex items-center gap-3 p-3 rounded-2xl bg-[#081226]/90 border border-slate-700/80 hover:border-cyan-400 text-left transition backdrop-blur-md group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    A Global Community
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    Learn. Collaborate. Grow.
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* Right Flank: Real Opportunities */}
              <Link 
                href="/internships" 
                className="inline-flex items-center gap-3 p-3 rounded-2xl bg-[#081226]/90 border border-slate-700/80 hover:border-purple-400 text-left transition backdrop-blur-md group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Star className="w-4 h-4 fill-purple-400" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    Real Opportunities
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    Turn Ideas into Impact.
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
