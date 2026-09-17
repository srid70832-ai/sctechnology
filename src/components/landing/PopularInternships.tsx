"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Trophy, 
  ArrowRight, 
  MapPin, 
  Clock, 
  BarChart2, 
  FileBadge, 
  Users, 
  TrendingUp, 
  FolderGit2, 
  Code2, 
  Globe, 
  Lightbulb,
  Sparkles,
  Radio,
  Building,
  AlertCircle
} from "lucide-react";
import { formatINR } from "@/lib/utils";

export interface InternshipCardData {
  id: string;
  title: string;
  role?: string;
  slug?: string;
  companyName: string;
  companyLogoUrl?: string | null;
  companyLogo?: string | null;
  mode?: string;
  duration?: string;
  stipend?: number | string | null;
  location?: string;
  description?: string;
  skills?: string[];
  deadline?: string;
  isNew?: boolean;
}

export interface HackathonHighlightData {
  id: string;
  title: string;
  slug?: string;
  tagLine?: string | null;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate?: string;
  mode?: string;
  participantsCount?: number;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  status?: string;
}

interface PopularInternshipsProps {
  internships?: InternshipCardData[];
  upcomingHackathon?: HackathonHighlightData | null;
}

export const PopularInternships: React.FC<PopularInternshipsProps> = ({
  internships: initialInternships = [],
  upcomingHackathon: initialHackathon = null,
}) => {
  const [internships, setInternships] = useState<InternshipCardData[]>(initialInternships);
  const [hackathon, setHackathon] = useState<HackathonHighlightData | null>(initialHackathon);
  const [loading, setLoading] = useState(initialInternships.length === 0 && !initialHackathon);

  // Sync client-side with fresh Firestore settings on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchFreshFeatured() {
      try {
        const res = await fetch("/api/site-settings/homepage", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success) {
            if (json.featuredHackathon) {
              setHackathon(json.featuredHackathon);
            }
            const intList: InternshipCardData[] = [];
            if (json.featuredInternship1) intList.push(json.featuredInternship1);
            if (json.featuredInternship2) intList.push(json.featuredInternship2);
            if (intList.length > 0) {
              setInternships(intList);
            }
          }
        }
      } catch (err) {
        console.warn("Client fetch of homepage featured settings notice:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFreshFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update when props change
  useEffect(() => {
    if (initialInternships && initialInternships.length > 0) {
      setInternships(initialInternships);
    }
  }, [initialInternships]);

  useEffect(() => {
    if (initialHackathon) {
      setHackathon(initialHackathon);
    }
  }, [initialHackathon]);

  // Real Countdown & Event Status State
  const [countdownState, setCountdownState] = useState<{
    days: number;
    hours: number;
    mins: number;
    secs: number;
    status: "UPCOMING" | "LIVE" | "ENDED";
  }>({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
    status: "UPCOMING",
  });

  useEffect(() => {
    if (!hackathon?.startDate) {
      return;
    }

    const startMs = new Date(hackathon.startDate).getTime();
    const endMs = hackathon.endDate ? new Date(hackathon.endDate).getTime() : startMs + 2 * 24 * 60 * 60 * 1000;

    const calculateTimer = () => {
      const now = Date.now();

      if (!isNaN(endMs) && now > endMs) {
        setCountdownState({ days: 0, hours: 0, mins: 0, secs: 0, status: "ENDED" });
        return;
      }

      if (!isNaN(startMs) && now >= startMs && (!endMs || now <= endMs)) {
        setCountdownState({ days: 0, hours: 0, mins: 0, secs: 0, status: "LIVE" });
        return;
      }

      if (!isNaN(startMs)) {
        const diff = Math.max(0, startMs - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdownState({ days, hours, mins, secs, status: "UPCOMING" });
      }
    };

    calculateTimer();
    const interval = setInterval(calculateTimer, 1000);
    return () => clearInterval(interval);
  }, [hackathon?.startDate, hackathon?.endDate]);

  const internship1 = internships[0] || null;
  const internship2 = internships[1] || null;

  const formatStipendDisplay = (stipend: any) => {
    if (typeof stipend === "number") {
      return stipend > 0 ? `₹${stipend.toLocaleString("en-IN")}` : "Unpaid";
    }
    if (typeof stipend === "string" && stipend.trim()) {
      return stipend;
    }
    return "Stipend Provided";
  };

  const formatHackathonDates = (start?: string, end?: string) => {
    if (!start) return "Dates TBA";
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return start;

    if (end) {
      const endDate = new Date(end);
      if (!isNaN(endDate.getTime())) {
        const startDay = startDate.toLocaleDateString("en-IN", { day: "numeric" });
        const endFormatted = endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        return `${startDay} – ${endFormatted}`;
      }
    }
    return startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <section className="py-14 bg-[#070B14] relative overflow-hidden">
      {/* Background Ambient Lights */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-purple-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        
        {/* Main 2-Column Grid: Internships (Left 8 cols) & Hackathon (Right 4 cols) */}
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

            {/* SKELETON LOADER */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((k) => (
                  <div key={k} className="p-5 rounded-3xl bg-[#0B152B]/60 border border-blue-500/15 animate-pulse space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-24 h-8 bg-slate-800 rounded-xl" />
                      <div className="w-12 h-5 bg-slate-800 rounded-full" />
                    </div>
                    <div className="h-6 bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-850 rounded w-full" />
                    <div className="h-8 bg-slate-800 rounded-xl w-1/2" />
                    <div className="h-10 bg-slate-800 rounded-2xl w-full" />
                  </div>
                ))}
              </div>
            ) : internships.length === 0 ? (
              /* EMPTY STATE */
              <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0B152B]/80 to-[#070D1A]/80 border border-blue-500/20 text-center space-y-3 py-12">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No featured internships currently available</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  New verified opportunities are published regularly. Explore our full catalog of career openings.
                </p>
                <Link
                  href="/internships"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
                >
                  <span>Browse All Internships</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              /* 2 Internship Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CARD 1 */}
                {internship1 && (
                  <motion.div
                    key={internship1.id || "card-1"}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0 }}
                    whileHover={{ y: -4 }}
                    className="p-5 rounded-3xl bg-gradient-to-b from-[#0B152B] to-[#070D1A] border border-blue-500/25 hover:border-blue-400/50 transition-all duration-300 shadow-xl group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Company Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-black border border-slate-700/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {internship1.companyLogoUrl || internship1.companyLogo ? (
                              <img
                                src={internship1.companyLogoUrl || internship1.companyLogo || "/logo.png"}
                                alt={internship1.companyName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Image src="/logo.png" alt="SC TECH" width={28} height={28} className="object-contain" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{internship1.companyName || "SC TECH"}</div>
                            <div className="text-[10px] text-slate-400">Build Skills. Build Careers.</div>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          NEW
                        </span>
                      </div>

                      {/* Role & Description with Graphic */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-8 space-y-2">
                          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {internship1.title}
                          </h3>
                          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                            {internship1.description || "Work on real-world systems, APIs and scalable production applications."}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1 text-cyan-400">
                              <MapPin className="w-3 h-3" />
                              {internship1.mode || internship1.location || "Remote"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {internship1.duration || "8 Weeks"}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" />
                              Stipend
                            </span>
                          </div>
                        </div>

                        {/* Graphic */}
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
                        {formatStipendDisplay(internship1.stipend)}{" "}
                        {typeof internship1.stipend === "number" && (
                          <span className="text-xs text-slate-400 font-normal">/ month</span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Link
                        href={`/internships/${internship1.slug || internship1.id}`}
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
                )}

                {/* CARD 2 */}
                {internship2 && (
                  <motion.div
                    key={internship2.id || "card-2"}
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
                          <div className="w-9 h-9 rounded-xl bg-black border border-slate-700/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {internship2.companyLogoUrl || internship2.companyLogo ? (
                              <img
                                src={internship2.companyLogoUrl || internship2.companyLogo || "/logo.png"}
                                alt={internship2.companyName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Image src="/logo.png" alt="SC TECH" width={28} height={28} className="object-contain" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{internship2.companyName || "SC TECH"}</div>
                            <div className="text-[10px] text-slate-400">Build Skills. Build Careers.</div>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          NEW
                        </span>
                      </div>

                      {/* Role & Description with Graphic */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-8 space-y-2">
                          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {internship2.title}
                          </h3>
                          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                            {internship2.description || "Build end-to-end full-stack applications with modern cloud technologies."}
                          </p>

                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1 text-cyan-400">
                              <MapPin className="w-3 h-3" />
                              {internship2.mode || internship2.location || "Remote"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {internship2.duration || "6 Weeks"}
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" />
                              Stipend
                            </span>
                          </div>
                        </div>

                        {/* Graphic */}
                        <div className="col-span-4 flex items-center justify-center">
                          <img
                            src="/images/internship-fullstack.png"
                            alt="Full Stack Graphic"
                            className="w-full max-h-24 object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_8px_16px_rgba(59,130,246,0.3)]"
                          />
                        </div>
                      </div>

                      {/* Stipend */}
                      <div className="text-lg font-black text-cyan-400">
                        {formatStipendDisplay(internship2.stipend)}{" "}
                        {typeof internship2.stipend === "number" && (
                          <span className="text-xs text-slate-400 font-normal">/ month</span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Link
                        href={`/internships/${internship2.slug || internship2.id}`}
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
                )}

              </div>
            )}
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

            {/* SKELETON LOADER FOR HACKATHON */}
            {loading ? (
              <div className="p-6 rounded-3xl bg-[#0D152F]/60 border border-blue-500/15 animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                  <div className="w-36 h-6 bg-slate-800 rounded-xl" />
                </div>
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-850 rounded w-1/2" />
                <div className="h-28 bg-slate-800 rounded-2xl w-full" />
                <div className="h-10 bg-slate-800 rounded-2xl w-full" />
              </div>
            ) : !hackathon ? (
              /* EMPTY STATE */
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0D152F]/80 to-[#060B16]/80 border border-purple-500/20 text-center space-y-3 py-12">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white">No featured hackathon currently available</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  New challenges and hackathons are published frequently by partner companies and universities.
                </p>
                <Link
                  href="/hackathons"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30"
                >
                  <span>Explore Hackathons</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              /* DYNAMIC HACKATHON CARD */
              <motion.div
                key={hackathon.id || "featured-hackathon"}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
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

                    {/* Dynamic Countdown Display */}
                    {countdownState.status === "LIVE" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                        <span>LIVE NOW</span>
                      </div>
                    ) : countdownState.status === "ENDED" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                        <span>ENDED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#070D1D] border border-slate-800 text-[10px] text-slate-300 font-mono">
                        <span className="text-slate-400 font-sans mr-0.5">Starts In</span>
                        <span className="font-bold text-white bg-slate-800/80 px-1 py-0.5 rounded">{String(countdownState.days).padStart(2, "0")}d</span>
                        <span>:</span>
                        <span className="font-bold text-white bg-slate-800/80 px-1 py-0.5 rounded">{String(countdownState.hours).padStart(2, "0")}h</span>
                        <span>:</span>
                        <span className="font-bold text-white bg-slate-800/80 px-1 py-0.5 rounded">{String(countdownState.mins).padStart(2, "0")}m</span>
                        <span>:</span>
                        <span className="font-bold text-cyan-400 bg-slate-800/80 px-1 py-0.5 rounded">{String(countdownState.secs).padStart(2, "0")}s</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight line-clamp-1">
                      {hackathon.title}
                    </h3>
                    <p className="text-xs text-blue-400 font-medium line-clamp-1">
                      {hackathon.tagLine || "Code. Innovate. Elevate."}
                    </p>
                  </div>

                  {/* Main Details & 3D Trophy Graphic */}
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-7 space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Entry Fee</span>
                        <span className="font-bold text-white">
                          {hackathon.entryFee > 0 ? `₹${hackathon.entryFee} / Person` : "Free Entry"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Participants</span>
                        <span className="font-bold text-white">
                          {hackathon.participantsCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Prize Pool</span>
                        <span className="font-extrabold text-[#38BDF8]">
                          {hackathon.prizePool > 0 ? `₹${hackathon.prizePool.toLocaleString()}+` : "Certificates & Swags"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Date</span>
                        <span className="font-semibold text-white">
                          {formatHackathonDates(hackathon.startDate, hackathon.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Mode</span>
                        <span className="font-semibold text-white">{hackathon.mode || "Online"}</span>
                      </div>
                    </div>

                    {/* 3D Golden Trophy Graphic */}
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
                    href={`/hackathons/${hackathon.slug || hackathon.id}`}
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
            )}
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
