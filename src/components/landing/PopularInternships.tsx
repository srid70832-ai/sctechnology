"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Trophy, 
  ArrowRight, 
  MapPin, 
  Clock, 
  BarChart2, 
  FileBadge, 
  GraduationCap, 
  Users, 
  TrendingUp, 
  FolderGit2, 
  Code2, 
  Globe, 
  Lightbulb,
  Sparkles,
  Zap
} from "lucide-react";
import { formatINR } from "@/lib/utils";

interface InternshipCardData {
  id: string;
  title: string;
  role: string;
  slug: string;
  companyName: string;
  companyLogo?: string | null;
  mode: string;
  duration: string;
  stipend: number;
  isNew?: boolean;
}

interface HackathonHighlightData {
  id: string;
  title: string;
  slug: string;
  tagLine?: string | null;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  participantsCount?: number;
}

interface PopularInternshipsProps {
  internships?: InternshipCardData[];
  upcomingHackathon?: HackathonHighlightData | null;
}

export const PopularInternships: React.FC<PopularInternshipsProps> = ({
  internships = [],
  upcomingHackathon,
}) => {
  // Live countdown timer for the upcoming hackathon
  const [timeLeft, setTimeLeft] = useState({ days: 5, hours: 14, mins: 32, secs: 10 });

  useEffect(() => {
    const rawTarget = upcomingHackathon?.startDate || "2026-09-15T09:00:00Z";
    const targetDate = new Date(rawTarget).getTime();
    const validTarget = isNaN(targetDate) ? new Date("2026-09-15T09:00:00Z").getTime() : targetDate;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, validTarget - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, mins, secs });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [upcomingHackathon?.startDate]);

  return (
    <section className="py-14 bg-[#070B14] relative overflow-hidden">
      {/* Background Ambient Lights */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-purple-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        
        {/* Main 2-Column Grid: Internships (Left) & Hackathon (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: POPULAR INTERNSHIPS (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E1B38] border border-blue-500/30 text-xs font-semibold text-blue-400 shadow-sm">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <span>Career Opportunities</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Popular <span className="text-[#38BDF8]">Intern</span><span className="text-[#C084FC]">ships</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Verified real-world internships with industry mentorship & stipend
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs italic font-semibold text-[#67E8F9] hidden md:inline-block tracking-wide">
                  Gain Real-World Experience ↗
                </span>
                <Link
                  href="/internships"
                  className="group text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition"
                >
                  <span>View All</span>
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>

            {/* 2 Internship Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CARD 1: Backend Developer Intern */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-3xl bg-gradient-to-b from-[#0B152B] to-[#070D1A] border border-blue-500/25 hover:border-blue-400/50 transition-all duration-300 shadow-xl group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Company Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-black border border-slate-700/80 p-1 flex items-center justify-center shrink-0">
                        <Image src="/logo.png" alt="SC TECH" width={28} height={28} className="object-contain" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">SC TECH</div>
                        <div className="text-[10px] text-slate-400">Build Skills. Build Careers.</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      NEW
                    </span>
                  </div>

                  {/* Role & Description with 3D Graphic */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8 space-y-2">
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                        Backend Developer Intern
                      </h3>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        Work on real-world backend systems, APIs and scalable applications.
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 text-cyan-400">
                          <MapPin className="w-3 h-3" />
                          Remote
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          8 Weeks
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart2 className="w-3 h-3" />
                          Stipend
                        </span>
                      </div>
                    </div>

                    {/* 3D Server / Database Graphic */}
                    <div className="col-span-4 flex items-center justify-center">
                      <img
                        src="/images/internship-backend.png"
                        alt="Backend Developer Graphic"
                        className="w-full max-h-24 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_8px_16px_rgba(59,130,246,0.3)]"
                      />
                    </div>
                  </div>

                  {/* Stipend */}
                  <div className="text-lg font-black text-cyan-400">
                    ₹15,000 <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href="/internships"
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold text-center block shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:scale-95 duration-75 cursor-pointer"
                  >
                    Apply Now →
                  </Link>
                </div>

                {/* Bottom Feature Strip */}
                <div className="flex items-center justify-between gap-1 pt-3 mt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-400" />
                    <span>Industry Mentorship</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1">
                    <FileBadge className="w-3 h-3 text-emerald-400" />
                    <span>Certificate</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-purple-400" />
                    <span>Career Support</span>
                  </div>
                </div>
              </motion.div>

              {/* CARD 2: Full Stack Developer Intern */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-3xl bg-gradient-to-b from-[#0B152B] to-[#070D1A] border border-blue-500/25 hover:border-blue-400/50 transition-all duration-300 shadow-xl group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Company Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-black border border-slate-700/80 p-1 flex items-center justify-center shrink-0">
                        <Image src="/logo.png" alt="SC TECH" width={28} height={28} className="object-contain" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">SC TECH</div>
                        <div className="text-[10px] text-slate-400">Build Skills. Build Careers.</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      NEW
                    </span>
                  </div>

                  {/* Role & Description with 3D Graphic */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8 space-y-2">
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                        Full Stack Developer Intern
                      </h3>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        Build end-to-end web applications with modern technologies.
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 text-cyan-400">
                          <MapPin className="w-3 h-3" />
                          Remote
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          6 Weeks
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart2 className="w-3 h-3" />
                          Stipend
                        </span>
                      </div>
                    </div>

                    {/* 3D Laptop with React/Node/JS Graphic */}
                    <div className="col-span-4 flex items-center justify-center">
                      <img
                        src="/images/internship-fullstack.png"
                        alt="Full Stack Developer Graphic"
                        className="w-full max-h-24 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_8px_16px_rgba(59,130,246,0.3)]"
                      />
                    </div>
                  </div>

                  {/* Stipend */}
                  <div className="text-lg font-black text-cyan-400">
                    ₹15,000 <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href="/internships"
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold text-center block shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:scale-95 duration-75 cursor-pointer"
                  >
                    Apply Now →
                  </Link>
                </div>

                {/* Bottom Feature Strip */}
                <div className="flex items-center justify-between gap-1 pt-3 mt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <FolderGit2 className="w-3 h-3 text-blue-400" />
                    <span>Real Projects</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-400" />
                    <span>Expert Guidance</span>
                  </div>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-purple-400" />
                    <span>Job Opportunities</span>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>

          {/* RIGHT COLUMN: UPCOMING HACKATHON (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Header Badges */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1238] border border-purple-500/30 text-xs font-semibold text-purple-300">
                  <Trophy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Hackathon</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2A1128] border border-pink-500/30 text-xs font-semibold text-pink-300">
                  <span>🔥</span>
                  <span>Innovate • Build • Win</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Upcoming <span className="text-[#38BDF8]">Hackathon</span>
              </h2>
              <p className="text-xs text-slate-400">
                Compete. Collaborate. Create Something Extraordinary.
              </p>
            </div>

            {/* Hackathon Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0D152F] via-[#091024] to-[#060B16] border border-blue-500/35 hover:border-blue-400/60 shadow-2xl relative overflow-hidden group transition-all duration-300"
            >
              {/* Card Glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                
                {/* Top Row: Trophy Icon + Live Countdown Timer */}
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-md">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#070D1D] border border-slate-800 text-[10px] text-slate-300 font-mono">
                    <span className="text-slate-400 font-sans mr-0.5">Starts In</span>
                    <span className="font-bold text-white bg-slate-800/80 px-1 py-0.5 rounded">{String(timeLeft.days).padStart(2, "0")}d</span>
                    <span>:</span>
                    <span className="font-bold text-white bg-slate-800/80 px-1 py-0.5 rounded">{String(timeLeft.hours).padStart(2, "0")}h</span>
                    <span>:</span>
                    <span className="font-bold text-white bg-slate-800/80 px-1 py-0.5 rounded">{String(timeLeft.mins).padStart(2, "0")}m</span>
                    <span>:</span>
                    <span className="font-bold text-cyan-400 bg-slate-800/80 px-1 py-0.5 rounded">{String(timeLeft.secs).padStart(2, "0")}s</span>
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {upcomingHackathon?.title ? (
                      <span>{upcomingHackathon.title}</span>
                    ) : (
                      <>
                        SC TECH <span className="text-[#A855F7]">HACKATHON 2026</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-blue-400 font-medium">
                    {upcomingHackathon?.tagLine || "Code. Innovate. Elevate."}
                  </p>
                </div>

                {/* Main Details & 3D Trophy Graphic */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-7 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Entry Fee</span>
                      <span className="font-bold text-white">
                        {upcomingHackathon
                          ? upcomingHackathon.entryFee > 0
                            ? `₹${upcomingHackathon.entryFee} / Person`
                            : "Free Entry"
                          : "₹35 / Person"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Participants</span>
                      <span className="font-bold text-white">
                        {upcomingHackathon?.participantsCount
                          ? `${upcomingHackathon.participantsCount}+`
                          : "500+"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Prize Pool</span>
                      <span className="font-extrabold text-[#38BDF8]">
                        {upcomingHackathon?.prizePool
                          ? `₹${upcomingHackathon.prizePool.toLocaleString()}+`
                          : "₹50,000+"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Date</span>
                      <span className="font-semibold text-white">
                        {upcomingHackathon?.startDate
                          ? new Date(upcomingHackathon.startDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "15 – 17 Sep 2026"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Mode</span>
                      <span className="font-semibold text-white">Online</span>
                    </div>
                  </div>

                  {/* 3D Golden Trophy on Podium Graphic */}
                  <div className="col-span-5 flex items-center justify-center">
                    <img
                      src="/images/hackathon-trophy.png"
                      alt="Hackathon 3D Trophy"
                      className="w-full max-h-28 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(168,85,247,0.35)]"
                    />
                  </div>
                </div>

                {/* Register CTA */}
                <Link
                  href={
                    upcomingHackathon?.slug || upcomingHackathon?.id
                      ? `/hackathons/${upcomingHackathon.slug || upcomingHackathon.id}`
                      : "/hackathons"
                  }
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs text-center block shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:scale-95 duration-75 cursor-pointer"
                >
                  Register Now →
                </Link>

                {/* Bottom Badges */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-400" /> Network</span>
                  <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3 text-amber-400" /> Learn</span>
                  <span className="flex items-center gap-1"><Code2 className="w-3 h-3 text-emerald-400" /> Build</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-purple-400" /> Win</span>
                </div>

              </div>
            </motion.div>
          </div>

        </div>

        {/* BOTTOM KICKSTART STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-3.5 sm:p-4 rounded-2xl bg-[#0B152B]/90 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">
              Kickstart Your Career with <span className="text-[#38BDF8]">Real Opportunities</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-medium hidden lg:block">
            Learn • Build • Grow • Get Hired
          </div>

          <Link
            href="/internships"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11244E] hover:bg-blue-600 border border-blue-400/30 text-blue-300 hover:text-white text-xs font-semibold transition active:scale-95 duration-75"
          >
            <span>Explore More Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

