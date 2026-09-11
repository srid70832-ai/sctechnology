"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  CreditCard, 
  CheckCircle2, 
  Download, 
  Loader2, 
  ShieldCheck, 
  QrCode, 
  Printer, 
  ExternalLink,
  Sparkles
} from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import Link from "next/link";

export default function PaymentsPage() {
  const { user, firebaseUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setLoading(false);
      return;
    }

    const payCol = collection(db, "payments");
    const q = query(payCol, where("userId", "==", firebaseUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });

        // Sort by timestamp descending
        list.sort((a, b) => {
          const timeA = a.paidAt?.toMillis || a.createdAt?.toMillis || new Date(a.createdAt || 0).getTime();
          const timeB = b.paidAt?.toMillis || b.createdAt?.toMillis || new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        setPayments(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">Payment History & Receipts</h1>
              <p className="text-xs text-slate-400">Verified transaction receipts, dynamic QR invoices, and plan subscriptions.</p>
            </div>

            <Link
              href="/plans"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Plans</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading verified payments...</span>
            </div>
          ) : payments.length > 0 ? (
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 pb-3 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Receipt / Order ID</th>
                    <th className="pb-3 font-semibold">Plan / Item</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 font-mono text-[11px] text-blue-400 font-bold">
                        <div>{p.receiptNumber || `SCT-2026-${(p.id || "PAY").slice(0, 6)}`}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{p.orderId || p.razorpayOrderId}</div>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-white">{p.planName || `${p.planId} Plan`}</div>
                        <div className="text-[10px] text-slate-400">{p.billingCycle || "MONTHLY"}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          p.paymentMethod === "QR_UPI"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                        }`}>
                          {p.paymentMethod === "QR_UPI" ? <QrCode className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                          <span>{p.paymentMethod === "QR_UPI" ? "UPI / QR" : "Checkout"}</span>
                        </span>
                      </td>
                      <td className="py-4 font-bold text-emerald-400 text-sm">{formatINR(p.amount || 0)}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          p.status === "CAPTURED" || p.status === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : p.status === "FAILED"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {p.status === "CAPTURED" ? "SUCCESS ✓" : p.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/receipts/${p.id}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition inline-flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-400" />
                          <span>View Receipt</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-14 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No payments yet.</h3>
              <p className="text-xs text-slate-400">Transactions for subscription plans or hackathons will appear here.</p>
              <Link
                href="/plans"
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-block transition shadow-lg shadow-blue-600/30"
              >
                View Plans & Upgrade
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
