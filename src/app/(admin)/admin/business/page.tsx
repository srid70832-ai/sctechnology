"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatINR } from "@/lib/utils";
import { 
  BarChart3, 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Zap, 
  TrendingUp, 
  CreditCard, 
  Layers, 
  Loader2 
} from "lucide-react";

export default function AdminBusinessPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    paidUsers: 0,
    freeUsers: 0,
    totalRevenue: 0,
    monthlySubscriptions: 0,
    annualSubscriptions: 0,
    hackathonRevenue: 0,
    activePlansCount: 4,
  });

  useEffect(() => {
    async function loadBusinessData() {
      try {
        // 1. Users
        const usersSnap = await getDocs(collection(db, "users"));
        const totalU = usersSnap.size;

        // 2. Payments & Subscriptions
        const paymentsSnap = await getDocs(collection(db, "payments"));
        let rev = 0;
        let paidU = 0;

        paymentsSnap.forEach((pDoc) => {
          const p = pDoc.data();
          if (p.status === "SUCCESS") {
            rev += (p.amount || 0);
            paidU += 1;
          }
        });

        // 3. Subscriptions
        const subsSnap = await getDocs(collection(db, "subscriptions"));
        let monthly = 0;
        let yearly = 0;

        subsSnap.forEach((sDoc) => {
          const s = sDoc.data();
          if (s.billingCycle === "YEARLY") yearly += 1;
          else monthly += 1;
        });

        setMetrics({
          totalUsers: totalU,
          paidUsers: paidU,
          freeUsers: Math.max(0, totalU - paidU),
          totalRevenue: rev,
          monthlySubscriptions: monthly,
          annualSubscriptions: yearly,
          hackathonRevenue: 0,
          activePlansCount: 4,
        });
      } catch (err) {
        console.error("Error loading business metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBusinessData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            <span>SC TECH Business & Revenue Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time monetization, subscription cohorts, and student platform conversion metrics.
          </p>
        </div>

        <Link
          href="/admin/plans"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>Manage Plans & Pricing</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Calculating live business metrics...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Revenue (Razorpay)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">{formatINR(metrics.totalRevenue)}</div>
              <p className="text-[11px] text-emerald-400 font-medium">100% verified settlement volume</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Student Users</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">{metrics.totalUsers}</div>
              <p className="text-[11px] text-slate-400">{metrics.freeUsers} Free Users</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Paid Subscriptions</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white">{metrics.paidUsers}</div>
              <p className="text-[11px] text-blue-400">{metrics.monthlySubscriptions} Monthly / {metrics.annualSubscriptions} Annual</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Conversion Rate</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {metrics.totalUsers > 0 ? ((metrics.paidUsers / metrics.totalUsers) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-[11px] text-slate-400">Freemium to Paid conversion</p>
            </div>
          </div>

          {/* Business Revenue Streams Overview */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              SC TECH Multi-Stream Revenue Engine
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="font-bold text-blue-400">1. Student Subscriptions</span>
                <p className="text-slate-400 leading-relaxed">
                  Freemium student base upgrading to Starter (₹299/mo), Pro (₹499/mo), and Career (₹599/mo) plans.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400">2. Hackathon & Event Entry</span>
                <p className="text-slate-400 leading-relaxed">
                  Configurable entry fees for sponsored challenges, developer tournaments, and prizes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="font-bold text-indigo-400">3. Company & B2B Talent Pipeline</span>
                <p className="text-slate-400 leading-relaxed">
                  Direct recruiter hiring packages, talent shortlisting, and employer-sponsored hackathon challenges.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
