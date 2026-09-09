"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { 
  Sparkles, 
  FolderGit2, 
  Award, 
  Trophy, 
  Calendar, 
  Briefcase, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Loader2
} from "lucide-react";
import { formatDate } from "@/lib/utils";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user: authUser, studentProfile, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Role & Onboarding guards: Never route Admin or Super Admin to onboarding
  useEffect(() => {
    if (!authLoading) {
      const cleanEmail = authUser?.email?.toLowerCase().trim() || "";
      if (authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN" || cleanEmail === "srics2425@gmail.com" || cleanEmail === "admin@sctech.com") {
        router.replace("/admin");
        return;
      }
      if (studentProfile) {
        if (!studentProfile.onboardingCompleted) {
          router.push("/onboarding");
        }
      }
    }
  }, [authLoading, authUser, studentProfile, router]);

  useEffect(() => {
    if (authLoading) return;
    async function fetchDashboard() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/student/dashboard", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading your student portal...</span>
      </div>
    );
  }

  const { user, stats, events, recommendedInternships, progress } = data || {};

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Sidebar */}
      <DashboardSidebar
        unreadCount={data?.unreadNotificationsCount || 0}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl">
          
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/40 border border-blue-500/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            
            <div className="space-y-1 relative z-10">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                Welcome back, {user?.name || "Student"} <span className="animate-bounce inline-block">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Track your active subscriptions, project repository downloads, and internship progress.
              </p>
            </div>

            {/* Active Plan Pill */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center gap-2.5 shadow-lg shadow-blue-500/10 hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "10s" }} />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">ACTIVE PLAN</div>
                  <div className="text-xs font-black text-white">
                    {stats?.activePlan || "Free Starter"} {stats?.planValidUntil ? `• Valid till ${formatDate(stats.planValidUntil)}` : ""}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4 Metric Stats Cards with Actual Database Numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 group hover:border-blue-500/40 transition duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Available Projects</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:rotate-12 transition-transform">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {String(stats?.totalProjects ?? 0).padStart(2, "0")}
              </div>
              <span className="text-[10px] text-blue-400 font-medium block">Repository Library</span>
            </motion.div>

            {/* Certificates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 group hover:border-emerald-500/40 transition duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Certificates Earned</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:rotate-12 transition-transform">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {String(stats?.totalCertificates ?? 0).padStart(2, "0")}
              </div>
              <span className="text-[10px] text-emerald-400 font-medium block">Verifiable Credentials</span>
            </motion.div>

            {/* Hackathons Joined */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 group hover:border-amber-500/40 transition duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Hackathons Joined</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {String(stats?.totalHackathons ?? 0).padStart(2, "0")}
              </div>
              <span className="text-[10px] text-amber-400 font-medium block">Submissions & Entries</span>
            </motion.div>

            {/* HR Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ y: -4 }}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3 group hover:border-violet-500/40 transition duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">HR Sessions</span>
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:rotate-12 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {String(stats?.totalHRSessions ?? 0).padStart(2, "0")}
              </div>
              <span className="text-[10px] text-violet-400 font-medium block">Mentorship Webinars</span>
            </motion.div>

          </div>

          {/* Real-World Problem Statements Challenge Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>SIH-STYLE REAL-WORLD CHALLENGES</span>
              </div>
              <h3 className="text-lg font-black text-white">Solve Industry Problem Statements</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Form teams, pick authentic technology challenges, build production-grade prototypes, and get evaluated directly by industry judges.
              </p>
            </div>

            <Link
              href="/problem-statements"
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 shrink-0"
            >
              <span>Explore Problem Statements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Middle Section: Upcoming Events & Recommended Internships */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Cols: Upcoming Events */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Upcoming Events & Sessions
                </h3>
                <Link href="/hackathons" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                  <span>Explore All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {events && events.length > 0 ? (
                  events.map((ev: any) => (
                    <motion.div
                      key={ev.id}
                      whileHover={{ x: 4 }}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-4 shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white mb-0.5">{ev.title}</h4>
                          <span className="text-[11px] text-slate-400">{formatDate(ev.date)} • {ev.type}</span>
                        </div>
                      </div>

                      <Link
                        href={ev.link || "/hackathons"}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white text-xs font-semibold transition shrink-0"
                      >
                        View Details
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
                    No upcoming events scheduled at this moment.
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Cols: Recommended Internships */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Recommended Internships
                </h3>
                <Link href="/internships" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {recommendedInternships && recommendedInternships.length > 0 ? (
                  recommendedInternships.map((item: any) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -3 }}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-md flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400">{item.companyName} • {item.mode}</div>
                        <div className="text-[11px] text-emerald-400 font-semibold">₹{item.stipend?.toLocaleString()} / mo</div>
                      </div>

                      <Link
                        href={`/internships/${item.slug || item.id}`}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
                      >
                        Apply
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
                    No internships currently open. Check back soon.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Row: My Progress & Upgrade Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* My Progress with Animated Progress Bar */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Profile Completion</span>
                <span className="text-base font-black text-blue-400">
                  {studentProfile?.profileCompletionPercentage ?? (progress?.profileCompletion || 0)}%
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${studentProfile?.profileCompletionPercentage ?? (progress?.profileCompletion || 0)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full shadow-lg shadow-blue-500/50"
                />
              </div>

              {/* Step Checklist */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className={`w-4 h-4 ${studentProfile?.college ? "text-emerald-400" : "text-slate-600"}`} />
                  <span>College & Personal Details {studentProfile?.college ? "Verified" : "Pending"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className={`w-4 h-4 ${(studentProfile?.technicalSkills?.length || studentProfile?.skills?.length) ? "text-emerald-400" : "text-slate-600"}`} />
                  <span>Technical Skills Added</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className={`w-4 h-4 ${studentProfile?.resumeUrl || studentProfile?.githubUrl ? "text-emerald-400" : "text-slate-600"}`} />
                  <span>Resume & Social Links Attached</span>
                </div>
              </div>

              <Link
                href="/profile"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center text-xs font-semibold text-slate-200 block transition"
              >
                Update Profile Details
              </Link>
            </div>

            {/* Upgrade Plan Banner */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/50 via-indigo-950/70 to-slate-900 border border-blue-500/40 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-2 relative z-10 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-400/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>UNLOCK FULL ACCESS</span>
                </div>
                <h3 className="text-xl font-black text-white">Upgrade Subscription Plan</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Get unlimited source code downloads, free entry to upcoming hackathons, and priority direct internship matching with partner HR teams.
                </p>
              </div>

              <Link
                href="/plans"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition shrink-0 text-center relative z-10 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full animate-shimmer pointer-events-none" />
                <span>Explore Plans &rarr;</span>
              </Link>
            </motion.div>

          </div>

        </main>
      </div>
    </div>
  );
}
