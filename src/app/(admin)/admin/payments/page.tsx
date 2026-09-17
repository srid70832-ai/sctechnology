"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatINR, formatDate } from "@/lib/utils";
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  Loader2, 
  ShieldCheck,
  QrCode,
  Printer,
  DollarSign,
  TrendingUp,
  RefreshCw
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  useEffect(() => {
    const payCol = collection(db, "payments");
    const unsubscribe = onSnapshot(
      payCol,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });

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
  }, []);

  // Compute Verified Metrics (Never fake data)
  const capturedPayments = payments.filter((p) => p.status === "CAPTURED" || p.status === "SUCCESS");
  const totalVerifiedRevenue = capturedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const qrPaymentsCount = capturedPayments.filter((p) => p.paymentMethod === "QR_UPI").length;
  const checkoutPaymentsCount = capturedPayments.filter((p) => p.paymentMethod !== "QR_UPI").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING" || p.status === "CREATED").length;

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "ALL") {
      if (statusFilter === "SUCCESS" && (p.status !== "SUCCESS" && p.status !== "CAPTURED")) return false;
      if (statusFilter !== "SUCCESS" && p.status !== statusFilter) return false;
    }
    if (methodFilter !== "ALL") {
      if (methodFilter === "QR_UPI" && p.paymentMethod !== "QR_UPI") return false;
      if (methodFilter === "RAZORPAY_CHECKOUT" && p.paymentMethod === "QR_UPI") return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(q) ||
      p.userEmail?.toLowerCase().includes(q) ||
      p.receiptNumber?.toLowerCase().includes(q) ||
      p.orderId?.toLowerCase().includes(q) ||
      p.razorpayOrderId?.toLowerCase().includes(q) ||
      p.razorpayPaymentId?.toLowerCase().includes(q) ||
      p.planName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <span>Razorpay Payments & QR Settlement Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time audit log of all student payments, dynamic QR scans, and plan subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments/qr"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-cyan-600/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Payment QR Settings</span>
          </Link>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Verified Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {formatINR(totalVerifiedRevenue)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">All Captured Transactions</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Successful Payments</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {capturedPayments.length}
          </div>
          <span className="text-[10px] text-blue-400 font-medium block">Active Subscriptions</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>UPI / QR Scans</span>
            <QrCode className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400">
            {qrPaymentsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">Dynamic QR Payments</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Checkout Orders</span>
            <CreditCard className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">
            {checkoutPaymentsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">Razorpay Gateway Modal</span>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          {["ALL", "SUCCESS", "PENDING", "FAILED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl font-bold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Methods</option>
            <option value="QR_UPI">UPI / Dynamic QR</option>
            <option value="RAZORPAY_CHECKOUT">Razorpay Checkout</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, email, receipt, or order ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading payment ledger from Firestore...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No payment records found</h3>
          <p className="text-xs text-slate-500">Transactions processed in Razorpay TEST Mode or Dynamic QR will appear here.</p>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] pb-3">
                <th className="pb-3 font-semibold">Student Account</th>
                <th className="pb-3 font-semibold">Plan / Target</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Receipt / Order Ref</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4">
                    <div className="font-bold text-white">{p.userName || "Student"}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{p.userEmail || "—"}</div>
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
                      <span>{p.paymentMethod === "QR_UPI" ? "UPI QR" : "Checkout"}</span>
                    </span>
                  </td>
                  <td className="py-4 font-bold text-emerald-400 text-sm">{formatINR(p.amount || 0)}</td>
                  <td className="py-4 font-mono text-[11px] text-slate-400">
                    <div className="text-white font-bold">{p.receiptNumber || "—"}</div>
                    <div className="text-[10px] text-slate-500">{p.orderId || p.razorpayOrderId || "—"}</div>
                  </td>
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
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition inline-flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Printer className="w-3 h-3 text-blue-400" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
