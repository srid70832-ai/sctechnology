"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Bell, CheckCircle2, Clock, Sparkles, Trophy, Briefcase, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function NotificationsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/student/dashboard", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-black text-white">Notifications & Alerts</h1>
            <p className="text-xs text-slate-400">Updates on applications, hackathons, and subscription events.</p>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-4 shadow-md"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === "PAYMENT"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : n.type === "HACKATHON"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {n.type === "PAYMENT" ? <Sparkles className="w-4 h-4" /> : n.type === "HACKATHON" ? <Trophy className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">{n.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-500 block pt-1">{formatDate(n.createdAt)}</span>
                    </div>
                  </div>

                  {n.link && (
                    <Link
                      href={n.link}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold shrink-0"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Bell className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No New Notifications</h3>
              <p className="text-xs text-slate-400">You are all caught up!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
