"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  Building, 
  Briefcase, 
  Trophy, 
  CreditCard, 
  Award, 
  Activity, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Plus,
  FolderGit2,
  FileCode2,
  ArrowUpRight,
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle,
  HelpCircle,
  Compass,
  ShieldCheck,
  Layers,
  Lightbulb,
  Gift
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060A12] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
        <span>Loading Admin Control Center...</span>
      </div>
    );
  }

  const m = stats?.stats || {
    totalStudents: 0,
    totalCompanies: 0,
    totalHRs: 0,
    totalInternships: 0,
    totalApplications: 0,
    totalProjects: 0,
    totalHackathons: 0,
    activeHackathons: 0,
    upcomingHackathons: 0,
    completedHackathons: 0,
    totalCourses: 0,
    totalProblemStatements: 0,
    totalOpportunities: 0,
    totalRegistrations: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalRevenue: 0,
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">SC TECH Administration</h1>
              <p className="text-xs text-slate-400">Enterprise Database & Platform Management Control Panel</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            ROLE: {user?.role || "ADMIN"}
          </span>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition"
          >
            Switch to Student View
          </Link>
        </div>
      </div>

      {/* Real-time Clickable Primary Metric Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span>Live Platform Overview (Click any metric to manage)</span>
          <span className="text-emerald-400 font-medium lowercase">● live firestore sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <Link
            href="/admin/students"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-blue-300 transition">Students</span>
              <div className="flex items-center gap-1 text-blue-400">
                <Users className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{m.totalStudents}</div>
            <span className="text-[10px] text-slate-500">Verified Profiles →</span>
          </Link>

          <Link
            href="/admin/companies"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-cyan-300 transition">Companies</span>
              <div className="flex items-center gap-1 text-cyan-400">
                <Building className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{m.totalCompanies}</div>
            <span className="text-[10px] text-slate-500">Partner Employers →</span>
          </Link>

          <Link
            href="/admin/projects"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-violet-300 transition">Projects</span>
              <div className="flex items-center gap-1 text-violet-400">
                <FolderGit2 className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{m.totalProjects}</div>
            <span className="text-[10px] text-slate-500">Real-World Blueprints →</span>
          </Link>

          <Link
            href="/admin/hackathons"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300 transition">Hackathons</span>
              <div className="flex items-center gap-1 text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{m.totalHackathons}</div>
            <span className="text-[10px] text-slate-500">All Challenges →</span>
          </Link>

          <Link
            href="/admin/courses"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-300 transition">Courses</span>
              <div className="flex items-center gap-1 text-indigo-400">
                <Award className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{m.totalCourses}</div>
            <span className="text-[10px] text-slate-500">Curricula & Modules →</span>
          </Link>

          <Link
            href="/admin/certificates"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-blue-300 transition">Certificates</span>
              <div className="flex items-center gap-1 text-blue-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">Registry</div>
            <span className="text-[10px] text-blue-400">Cryptographic Issuance →</span>
          </Link>

          <Link
            href="/admin/referrals"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-purple-300 transition">Referral & Rewards</span>
              <div className="flex items-center gap-1 text-purple-400">
                <Gift className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">Program</div>
            <span className="text-[10px] text-purple-400">Live Config & Payouts →</span>
          </Link>

          <Link
            href="/admin/submissions"
            className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 transition-all shadow-lg space-y-1 group"
          >
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-rose-300 transition">Submissions</span>
              <div className="flex items-center gap-1 text-rose-400">
                <Activity className="w-3.5 h-3.5" />
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{m.totalSubmissions}</div>
            <span className="text-[10px] text-amber-400">{m.pendingSubmissions} Pending Review →</span>
          </Link>

        </div>
      </div>

      {/* Secondary Detailed Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Link
          href="/admin/hackathons?status=ACTIVE"
          className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500/60 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-semibold text-emerald-400 block">Active Hackathons</span>
            <span className="text-xl font-black text-white">{m.activeHackathons} Live</span>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition" />
        </Link>

        <Link
          href="/admin/hackathons?status=UPCOMING"
          className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 hover:border-blue-500/60 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-semibold text-blue-400 block">Upcoming Hackathons</span>
            <span className="text-xl font-black text-white">{m.upcomingHackathons} Scheduled</span>
          </div>
          <Clock className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" />
        </Link>

        <Link
          href="/admin/problem-statements"
          className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 hover:border-purple-500/60 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-semibold text-purple-400 block">Problem Statements</span>
            <span className="text-xl font-black text-white">{m.totalProblemStatements} Challenges</span>
          </div>
          <FileCode2 className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
        </Link>

        <Link
          href="/admin/opportunities"
          className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 hover:border-cyan-500/60 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-semibold text-cyan-400 block">Opportunity Feeds</span>
            <span className="text-xl font-black text-white">{m.totalOpportunities || 0} Ingested</span>
          </div>
          <Compass className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
        </Link>

        <Link
          href="/admin/payments"
          className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 transition flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] font-semibold text-amber-400 block">Total Revenue</span>
            <span className="text-xl font-black text-white">₹{m.totalRevenue?.toLocaleString()}</span>
          </div>
          <CreditCard className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
        </Link>
      </div>

      {/* Admin Modules Navigation Hub */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Platform Management & Content Control Centers
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          
          <Link
            href="/admin/students"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Students</div>
          </Link>

          <Link
            href="/admin/companies"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Building className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Companies / HR</div>
          </Link>

          <Link
            href="/admin/project-enrollments"
            className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-500/60 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-indigo-300">Enrollments</div>
          </Link>

          <Link
            href="/admin/projects"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Projects</div>
          </Link>

          <Link
            href="/admin/hackathons"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Hackathons</div>
          </Link>

          <Link
            href="/admin/problem-statements"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Problems</div>
          </Link>

          <Link
            href="/admin/courses"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Courses</div>
          </Link>

          <Link
            href="/admin/submissions"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Submissions</div>
          </Link>

          <Link
            href="/admin/payments"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Payments</div>
          </Link>

          <Link
            href="/admin/opportunities"
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Compass className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Opportunities</div>
          </Link>

          <Link
            href="/admin/idea-link"
            className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 transition text-center space-y-2 shadow-lg group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-amber-300">Idea Link</div>
          </Link>

        </div>
      </div>

      {/* Tables Row: Recent Users & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Registered Users */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Recent Registrations</span>
            </h3>
            <Link href="/admin/students" className="text-xs text-blue-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {stats?.recentUsers?.map((u: any) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{u.name || "Anonymous User"}</div>
                  <div className="text-[10px] text-slate-500">{u.email}</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300">
                    {u.role}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-0.5">{formatDate(u.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Verified Payments */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Recent Orders & Transactions</span>
            </h3>
            <Link href="/admin/payments" className="text-xs text-emerald-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {stats?.recentPayments?.map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{p.user?.name || "Student"}</div>
                  <div className="text-[10px] text-slate-500">{p.orderId}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">{formatINR(p.amount)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{formatDate(p.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
