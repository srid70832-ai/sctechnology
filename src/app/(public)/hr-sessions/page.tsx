"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { HRSession, getEligibleHRSessions, registerForHRSession } from "@/lib/hr-sessions";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Briefcase, 
  Loader2 
} from "lucide-react";

export default function HRSessionsPage() {
  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [sessions, setSessions] = useState<HRSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getEligibleHRSessions(user?.userId, (user as any)?.plan || "STARTER");
      setSessions(data);
    } catch (err) {
      console.error("Error fetching eligible HR sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const handleRegister = async (session: HRSession) => {
    if (!user || !firebaseUser?.uid) {
      window.location.href = `/login?redirect=/hr-sessions`;
      return;
    }

    setRegisteringId(session.id!);
    try {
      const res = await registerForHRSession(
        session.id!,
        firebaseUser.uid,
        user.name || "Student",
        user.email || ""
      );

      if (res.success) {
        success(`Successfully registered for "${session.title}"!`);
      } else {
        error(res.error || "Failed to register");
      }
    } catch {
      error("Registration error");
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar />

      <main className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        
        {/* Top Header Banner */}
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-[11px] font-bold text-blue-300 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>INDUSTRY MENTORSHIP & TALENT TALKS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            HR & Industry Interaction Sessions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Gain direct insights from talent acquisition leaders, engineering hiring managers, and technical recruiters across leading software organizations.
          </p>
        </div>

        {/* Sessions Grid or Clean Empty State */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Loading upcoming sessions...</span>
          </div>
        ) : sessions.length === 0 ? (
          /* Clean Empty State (No fake sessions) */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 sm:p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center max-w-xl mx-auto space-y-5 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">No HR sessions available for you yet.</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check back when SC TECH adds new industry sessions, or explore our active verified internships and real-world project repositories.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/internships"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition inline-flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                <span>Explore Internships</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between shadow-xl space-y-6"
              >
                <div className="space-y-4">
                  {/* Status & Type Bar */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      s.status === "LIVE"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {s.status === "LIVE" ? "LIVE NOW" : s.status.replace("_", " ")}
                    </span>

                    <span className="text-[11px] text-blue-400 font-semibold">
                      {s.sessionType}
                    </span>
                  </div>

                  {/* Speaker Header with Clean Initials */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-base text-blue-300 shrink-0">
                      {s.speakerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{s.speakerName}</h3>
                      <p className="text-xs text-slate-400">
                        {s.speakerRole} {s.companyName ? `• ${s.companyName}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h2 className="text-lg font-bold text-white leading-snug mb-1.5">{s.title}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{s.description}</p>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{s.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>{s.startTime} ({s.duration} mins)</span>
                    </div>
                  </div>
                </div>

                {/* Registration & Join Action */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Live Interactive Session
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/hr-sessions/${s.id}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() => handleRegister(s)}
                      disabled={registeringId === s.id}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {registeringId === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      <span>Register / Join</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
