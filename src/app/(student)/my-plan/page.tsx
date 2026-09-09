"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import Link from "next/link";

export default function MyPlanPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.user?.activeSubscription);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-black text-white">My Plan & Entitlements</h1>
            <p className="text-xs text-slate-400">View and manage your active SC TECH subscription status.</p>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading subscription...</span>
            </div>
          ) : subscription ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-blue-500/40 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Tier</span>
                    <h2 className="text-2xl font-black text-white">{subscription.plan?.name} PLAN</h2>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {subscription.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Subscription Price</span>
                  <span className="text-lg font-bold text-white">{formatINR(subscription.plan?.price || 499)} / month</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Renewal / Expiry Date</span>
                  <span className="text-lg font-bold text-emerald-400">{formatDate(subscription.endDate)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Unlocked Privileges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 500+ Project Source Codes</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verifiable Certificates with QR</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Priority Internship Review</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exclusive HR Mentorship Access</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                <Link href="/plans" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                  Switch Plan &rarr;
                </Link>
                <Link
                  href="/payments"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
                >
                  View Invoices & Payments
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <h3 className="text-lg font-bold text-white">No Active Paid Plan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upgrade to PRO to unlock premium project source code, unlimited certificates, and HR interaction sessions.
              </p>
              <Link
                href="/plans"
                className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30"
              >
                Explore Subscription Plans
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
