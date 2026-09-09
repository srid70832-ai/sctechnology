"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HRSession, checkSessionRegistration, registerForHRSession } from "@/lib/hr-sessions";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldAlert, 
  Sparkles, 
  Loader2, 
  Lock,
  ExternalLink
} from "lucide-react";

export default function HRSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [session, setSession] = useState<HRSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      try {
        const docRef = doc(db, "hrSessions", sessionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const sData = { id: docSnap.id, ...(docSnap.data() as HRSession) };
          setSession(sData);

          if (firebaseUser?.uid) {
            const registered = await checkSessionRegistration(sessionId, firebaseUser.uid);
            setIsRegistered(registered);
          }
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId, firebaseUser]);

  const handleRegister = async () => {
    if (!user || !firebaseUser?.uid) {
      window.location.href = `/login?redirect=/hr-sessions/${sessionId}`;
      return;
    }

    setRegistering(true);
    try {
      const res = await registerForHRSession(
        sessionId,
        firebaseUser.uid,
        user.name || "Student",
        user.email || ""
      );

      if (res.success) {
        setIsRegistered(true);
        success("Registration confirmed! Your seat is reserved.");
      } else {
        error(res.error || "Failed to register");
      }
    } catch {
      error("Registration error");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading session details...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!session || session.status === "DRAFT") {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">This session isn&apos;t available for your account.</h2>
          <p className="text-xs text-slate-400">
            You might not be allocated to this private session, or it has not been published yet.
          </p>
          <Link href="/hr-sessions" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs inline-block">
            &larr; Back to HR Sessions
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if user is eligible
  const isEligible = session.eligibility === "ALL" ||
    (session.eligibility === "PLAN_BASED" && session.allowedPlans?.includes((user as any)?.plan || "STARTER")) ||
    (firebaseUser?.uid && session.allocatedUserIds?.includes(firebaseUser.uid));

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar />

      <main className="flex-1 py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        <Link href="/hr-sessions" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All HR Sessions</span>
        </Link>

        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
          
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                session.status === "LIVE"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}>
                {session.status === "LIVE" ? "LIVE NOW" : session.status.replace("_", " ")}
              </span>

              <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                {session.sessionType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {session.title}
            </h1>

            {/* Speaker Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xl shrink-0">
                {session.speakerName.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{session.speakerName}</h3>
                <p className="text-xs text-slate-400">
                  {session.speakerRole} {session.companyName ? `• ${session.companyName}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{session.date}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{session.startTime} ({session.duration} mins)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Platform: {session.meetingPlatform}</span>
            </div>
          </div>

          {/* Description & Agenda */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Session Agenda & Overview</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {session.description}
            </p>
          </div>

          {/* Join / Registration Action Area with Secure Window Guard */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {isRegistered ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>You are registered for this session</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  Click register to secure your seat and receive meeting reminders.
                </span>
              )}
            </div>

            <div>
              {isRegistered ? (
                session.meetingLink && (session.status === "LIVE" || session.status === "PUBLISHED") ? (
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Live Session</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Meeting link opens at start time</span>
                  </div>
                )
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                  <span>Register for Session</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
