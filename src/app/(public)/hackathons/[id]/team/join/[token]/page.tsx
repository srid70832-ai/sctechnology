"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Users, ShieldCheck, ArrowRight, Loader2, Trophy, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function TeamInviteJoinPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast, success, error } = useToast();

  const hackathonId = params.id as string;
  const token = params.token as string;

  const [joining, setJoining] = useState(false);
  const [hackathon, setHackathon] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadHackathon() {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}`);
        if (res.ok) {
          const data = await res.json();
          setHackathon(data.hackathon);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    }
    loadHackathon();
  }, [hackathonId]);

  const handleJoinTeam = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser && !user) {
      toast("Please log in as a student to join this team", "info");
      router.push(`/login?redirect=/hackathons/${hackathonId}/team/join/${token}`);
      return;
    }

    setJoining(true);
    try {
      const idToken = await currentUser?.getIdToken();
      const res = await fetch(`/api/hackathons/${hackathonId}/team/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ inviteToken: token }),
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message || "Successfully joined team!");
        router.push(`/hackathons/${hackathonId}?tab=team`);
      } else {
        error(data.error || "Failed to join team");
      }
    } catch {
      error("An error occurred while joining the team");
    } finally {
      setJoining(false);
    }
  };

  if (pageLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading invitation...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-blue-500/30 shadow-2xl shadow-blue-900/20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 border border-blue-400/30">
            <Users className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Team Invitation
            </span>
            <h1 className="text-xl font-black text-white">Join Hackathon Team</h1>
            <p className="text-xs text-slate-300">
              You have been invited to collaborate and compete in{" "}
              <span className="text-blue-400 font-semibold">{hackathon?.title || "SC TECH Hackathon"}</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Event:</span>
              <span className="text-white font-medium truncate max-w-[200px]">{hackathon?.title}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Registration Status:</span>
              <span className="text-emerald-400 font-medium">Invitation Verified</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Team Access:</span>
              <span className="text-blue-300 font-medium">Collaborative Roster</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleJoinTeam}
              disabled={joining}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining Team...</span>
                </>
              ) : (
                <>
                  <span>Accept Invitation & Join Team</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <Link
              href={`/hackathons/${hackathonId}`}
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hackathon Overview</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
