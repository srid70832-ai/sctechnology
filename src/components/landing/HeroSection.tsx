"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CountUp } from "@/components/landing/CountUp";
import { VideoModal } from "@/components/ui/VideoModal";
import { 
  Rocket, 
  ArrowRight, 
  Play, 
  GraduationCap, 
  Briefcase, 
  Trophy, 
  Code2, 
  Users2, 
  Building2, 
  Lightbulb, 
  FileBadge, 
  ChevronRight,
  TrendingUp,
  Zap,
  BookOpen
} from "lucide-react";

interface HeroSectionProps {
  stats?: {
    students: number;
    internships: number;
    hackathons: number;
    projects: number;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({ stats }) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <section className="relative overflow-hidden pt-8 pb-14 bg-[#070B14]">
      {/* Clean Dark Navy Ambient Background Treatment */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 20%, #0B1633 0%, #070B14 100%)",
        }}
      />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[140px] pointer-events-none rounded-full z-0" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Main Hero 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* LEFT HERO COLUMN */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1729] border border-blue-500/30 text-xs font-semibold text-blue-400 shadow-md backdrop-blur-md"
            >
              <Rocket className="w-3.5 h-3.5 text-blue-400" />
              <span className="tracking-wide uppercase text-[11px] font-bold text-blue-300">
                EMPOWERING THE NEXT GENERATION
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-black text-white tracking-tight leading-[1.08]"
            >
              Learn. Build.<br />
              Compete. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">Grow.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-normal"
            >
              Your all-in-one platform for internships, hackathons, real-world projects, online courses and career opportunities.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <Link
                href="/internships"
                prefetch={true}
                className="group px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 hover:shadow-blue-500/40 active:scale-95 duration-75 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Opportunities</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setVideoModalOpen(true)}
                className="px-6 py-3 rounded-full bg-[#0E1628] hover:bg-[#152038] border border-slate-700/80 hover:border-slate-600 text-white font-medium text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 duration-75 flex items-center gap-2.5 shadow-md group cursor-pointer"
              >
                <Play className="w-4 h-4 text-blue-400 fill-blue-400/20 group-hover:scale-110 transition-transform" />
                <span>Watch Video</span>
              </button>
            </motion.div>

            {/* Real Stats Row with Animated CountUp */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800/80"
            >
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  <CountUp end={8} suffix="K+" />
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Students</div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  <CountUp end={25} suffix="+" />
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Companies</div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  <CountUp end={40} suffix="+" />
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Hackathons</div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  <CountUp end={60} suffix="+" />
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Internships</div>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-white">
                  <CountUp end={25} suffix="+" />
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Projects</div>
              </div>
            </motion.div>

          </div>

          {/* RIGHT HERO CARDS GRID */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* TOP CARD: FEATURED COURSES (Wide Card) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="rounded-3xl bg-gradient-to-r from-[#081226] via-[#0B1836] to-[#0D1D42] border border-blue-500/30 p-6 sm:p-7 relative overflow-hidden backdrop-blur-xl shadow-2xl hover:border-blue-400/60 transition-all duration-300 group"
            >
              {/* Card Ambient Glow */}
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 blur-[90px] pointer-events-none rounded-full" />

              {/* Top Header Badges Row */}
              <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0E1B38]/90 border border-blue-500/35 text-xs font-semibold text-blue-300 shadow-md">
                  <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="tracking-tight">Featured Courses</span>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-[#11244E]/90 border border-blue-400/40 text-xs font-bold text-blue-200 flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Level Up</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
              </div>

              {/* Card Main Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
                
                {/* Left inside card: Text & Features */}
                <div className="md:col-span-7 space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                    Learn <span className="text-[#38BDF8]">In-Demand</span> <span className="text-[#C084FC]">Skills</span> from Top Platforms
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                    Access curated online courses from Coursera, Udemy, Google, AWS and more.
                  </p>

                  {/* 3 Feature Boxes */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#091329]/90 border border-blue-500/20 shadow-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-200 leading-tight">
                        Industry Relevant
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#091329]/90 border border-blue-500/20 shadow-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-200 leading-tight">
                        Learn At Your Pace
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#091329]/90 border border-blue-500/20 shadow-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <FileBadge className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-200 leading-tight">
                        Get Certified & Stand Out
                      </div>
                    </div>
                  </div>

                  {/* CTA Button and Subtext */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-1">
                    <Link
                      href="/courses"
                      prefetch={true}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 duration-75 cursor-pointer"
                    >
                      <span>Explore Courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Upskill • Grow • Build Your Future
                    </span>
                  </div>
                </div>

                {/* Right inside card: 3D Laptop on Glowing Podium */}
                <div className="md:col-span-5 relative flex items-center justify-center">
                  <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-700 ease-out flex items-center justify-center">
                    <img
                      src="/images/courses-laptop.png"
                      alt="Curated Courses on Laptop"
                      className="w-full h-full object-contain object-center drop-shadow-[0_15px_30px_rgba(59,130,246,0.35)]"
                    />
                  </div>
                </div>

              </div>
            </motion.div>

            {/* MIDDLE ROW: INTERNSHIP OPPORTUNITIES + 3 STACKED CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              
              {/* Internship Opportunities Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -4 }}
                className="md:col-span-7 rounded-3xl bg-gradient-to-br from-[#0B1220] via-[#0D1832] to-[#0A1122] border border-blue-500/25 p-5 relative overflow-hidden backdrop-blur-md shadow-xl hover:border-blue-400/50 transition-all duration-300 group flex flex-col justify-between"
              >
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/25 text-white shrink-0">
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-semibold text-xs tracking-tight">Internship Opportunities</span>
                  </div>

                  <div className="px-3 py-1 rounded-full bg-[#111726]/90 border border-amber-500/30 text-[11px] font-semibold text-amber-400 flex items-center gap-1.5 shadow-sm">
                    <span>🔥</span>
                    <span>Real World Experience</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center relative z-10 my-auto">
                  {/* Text Details */}
                  <div className="col-span-7 space-y-2">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                      Start Your <span className="text-[#38BDF8]">Career</span> <span className="text-[#C084FC]">Journey</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                      Discover real world internships from top companies across the globe.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300 pt-0.5">
                      <div className="flex items-center gap-1 text-blue-400">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="text-slate-300">Gain Experience</span>
                      </div>
                      <span className="text-slate-600">|</span>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="text-slate-300">Top Companies</span>
                      </div>
                      <span className="text-slate-600">|</span>
                      <div className="flex items-center gap-1 text-purple-400">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-slate-300">Build Your Future</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Link
                        href="/internships"
                        prefetch={true}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95 duration-75 cursor-pointer"
                      >
                        <span>View Internships</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Student Image */}
                  <div className="col-span-5 relative h-36 rounded-2xl overflow-hidden shadow-xl border border-slate-700/60 bg-slate-950">
                    <img
                      src="/images/student-internship.png"
                      alt="Internship Opportunities"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              </motion.div>

              {/* STACKED MINI CARDS */}
              <div className="md:col-span-5 flex flex-col gap-2.5 justify-between">
                
                {/* 1. SC Idea Link Card (Prominent AI Highlight) */}
                <Link href="/idea-link" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 rounded-2xl bg-gradient-to-r from-[#0C162E]/95 to-[#16213D]/95 hover:from-[#122347] hover:to-[#1C2C54] border border-amber-500/40 hover:border-amber-400/80 transition-all duration-200 flex items-center justify-between group shadow-md shadow-amber-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            SC Idea Link
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            AI MATCH
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">Startup Idea → Company Connect</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </Link>

                {/* 2. Hackathons Card */}
                <Link href="/hackathons" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 rounded-2xl bg-[#0C162E]/90 hover:bg-[#122347] border border-slate-800 hover:border-amber-500/50 transition-all duration-200 flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:rotate-6 transition-transform">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          Hackathons
                        </div>
                        <div className="text-[11px] text-slate-400">Compete, Innovate, Win</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </Link>

                {/* 3. Real World Projects Card */}
                <Link href="/projects" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 rounded-2xl bg-[#0C162E]/90 hover:bg-[#122347] border border-slate-800 hover:border-blue-500/50 transition-all duration-200 flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:rotate-6 transition-transform">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                          Real World Projects
                        </div>
                        <div className="text-[11px] text-slate-400">Build and enhance your portfolio</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </Link>

                {/* 4. Mentorship & HR Sessions Card */}
                <Link href="/hr-sessions" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 rounded-2xl bg-[#0C162E]/90 hover:bg-[#122347] border border-slate-800 hover:border-pink-500/50 transition-all duration-200 flex items-center justify-between group shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:rotate-6 transition-transform">
                        <Users2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                          Mentorship & HR Sessions
                        </div>
                        <div className="text-[11px] text-slate-400">Get guidance from industry experts</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                </Link>

              </div>

            </div>

          </div>

        </div>

        {/* BOTTOM ROW: 5 FEATURE CARDS MATCHING REFERENCE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
          
          {/* Card 1: SC Idea Link */}
          <Link href="/idea-link" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-[#0C162E] to-[#142347] hover:from-[#101E3D] hover:to-[#1A2E5C] border border-amber-500/40 hover:border-amber-400/80 transition-all duration-200 flex items-center justify-between group shadow-lg shadow-amber-500/5"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      SC Idea Link
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      AI
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Startup to company match</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>

          {/* Card 2: Top Companies */}
          <Link href="/companies" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-4 rounded-2xl bg-[#0C162E]/90 hover:bg-[#122347] border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Top Companies
                  </div>
                  <div className="text-[11px] text-slate-400">500+ hiring partners</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>

          {/* Card 3: Problem Statements */}
          <Link href="/problem-statements" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-4 rounded-2xl bg-[#0C162E]/90 hover:bg-[#122347] border border-slate-800 hover:border-purple-500/50 transition-all duration-200 flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    Problem Statements
                  </div>
                  <div className="text-[11px] text-slate-400">Solve real industry challenges</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>

          {/* Card 3: Career Plans */}
          <Link href="/plans" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-4 rounded-2xl bg-[#0C162E]/90 hover:bg-[#122347] border border-slate-800 hover:border-blue-500/50 transition-all duration-200 flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                    Career Plans
                  </div>
                  <div className="text-[11px] text-slate-400">Personalized roadmap</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>

          {/* Card 4: Certificates */}
          <Link href="/verify/SCT-HACK-2026-000123" prefetch={true} className="active:scale-[0.98] duration-75 cursor-pointer block">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.25 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="p-4 rounded-2xl bg-[#0C162E]/90 hover:bg-[#122347] border border-slate-800 hover:border-amber-500/50 transition-all duration-200 flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                  <FileBadge className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    Certificates
                  </div>
                  <div className="text-[11px] text-slate-400">Showcase your achievements</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </Link>

        </div>

        {/* UPCOMING EVENTS HEADER BAR MATCHING REFERENCE */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pt-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Upcoming Events
              </h2>
              <p className="text-xs text-slate-400">
                Don&apos;t miss these opportunities
              </p>
            </div>
          </div>

          <Link
            href="/hackathons"
            className="group text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

      </div>

      {/* Video Modal */}
      <VideoModal isOpen={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
    </section>
  );
};
