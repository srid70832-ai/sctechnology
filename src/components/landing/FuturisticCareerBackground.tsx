"use client";

import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const FuturisticCareerBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated Dust / Glowing Particles Canvas
  useEffect(() => {
    if (shouldReduceMotion) return;
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
    const count = typeof window !== "undefined" && window.innerWidth < 768 ? 25 : 55;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.35 - 0.06,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.1,
        maxAlpha: Math.random() * 0.5 + 0.3,
        alphaSpeed: Math.random() * 0.012 + 0.004,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaSpeed;

        if (p.alpha > p.maxAlpha || p.alpha < 0.08) {
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
        ctx.shadowBlur = 8;
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
  }, [shouldReduceMotion]);

  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* 1. Deep Atmospheric Radial Background Ambient */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: "radial-gradient(ellipse 85% 65% at 50% 25%, #0B1633 0%, #070B14 85%)",
        }}
      />

      {/* 2. Soft Ambient Lighting Glowing Orbs */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/12 blur-[150px] rounded-full" />
      <div className="absolute top-[30%] left-[10%] w-[500px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full" />
      <div className="absolute top-[25%] right-[10%] w-[550px] h-[380px] bg-purple-600/12 blur-[140px] rounded-full" />

      {/* 3. Futuristic Career Ecosystem Graphic (Seamlessly Blended with Radial Gradient Mask) */}
      <div 
        className="absolute inset-0 w-full h-full opacity-35 bg-center bg-cover mix-blend-screen"
        style={{
          backgroundImage: "url('/images/future-career-ecosystem.jpg')",
          backgroundPosition: "center 40%",
          maskImage: "radial-gradient(ellipse 85% 70% at 50% 35%, black 25%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 70% at 50% 35%, black 25%, transparent 80%)",
        }}
      />

      {/* 4. Canvas Floating Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* 5. SVG Animated Glowing Neon Pathways */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-60" 
        viewBox="0 0 1200 800" 
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="neonPathCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="neonPathPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#C084FC" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#E879F9" stopOpacity="0.2" />
          </linearGradient>

          <filter id="neonFilterGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle Cyber Pathways */}
        <path 
          d="M 600,750 Q 420,580 200,420 T 380,220 Q 500,160 600,100" 
          fill="none" 
          stroke="url(#neonPathCyan)" 
          strokeWidth="2" 
          filter="url(#neonFilterGlow)"
          strokeDasharray="14 10"
        />
        <path 
          d="M 600,750 Q 780,580 1000,420 T 820,220 Q 700,160 600,100" 
          fill="none" 
          stroke="url(#neonPathPurple)" 
          strokeWidth="2" 
          filter="url(#neonFilterGlow)"
          strokeDasharray="14 10"
        />
      </svg>

      {/* 6. Subtle Floating Ambient Nodes (Smooth Framer Motion) */}
      {!shouldReduceMotion && (
        <>
          <motion.div
            animate={{
              y: [0, -12, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
            }}
            className="absolute top-[20%] left-[25%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8]"
          />
          <motion.div
            animate={{
              y: [0, 14, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-[35%] right-[22%] w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_14px_#c084fc]"
          />
          <motion.div
            animate={{
              y: [0, -10, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute top-[50%] left-[15%] w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
          />
          <motion.div
            animate={{
              y: [0, 12, 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              repeat: Infinity,
              duration: 6.5,
              ease: "easeInOut",
              delay: 1.5,
            }}
            className="absolute top-[60%] right-[30%] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"
          />
        </>
      )}

      {/* Bottom gradient fade into following sections */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#070B14] to-transparent pointer-events-none" />
    </div>
  );
};
