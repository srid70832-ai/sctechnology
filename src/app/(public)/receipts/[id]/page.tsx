"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatINR, formatDate } from "@/lib/utils";
import { 
  CheckCircle2, 
  Printer, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  Loader2,
  FileText
} from "lucide-react";

export default function PaymentReceiptPage() {
  const params = useParams();
  const rawId = params.id as string;

  const [payment, setPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReceipt() {
      if (!rawId) return;
      try {
        // Try getting by document ID directly
        const docRef = doc(db, "payments", rawId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPayment({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Try querying by receiptNumber or orderId
          const q = query(
            collection(db, "payments"), 
            where("receiptNumber", "==", rawId)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setPayment({ id: snap.docs[0].id, ...snap.docs[0].data() });
          }
        }
      } catch (err) {
        console.error("Error loading payment receipt:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [rawId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Generating official receipt...</span>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-600" />
        <h2 className="text-xl font-bold text-white">Payment Receipt Not Found</h2>
        <p className="text-xs text-slate-400">The requested transaction reference was not found.</p>
        <Link href="/payments" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs">
          View Payment History
        </Link>
      </div>
    );
  }

  const paymentDate = payment.paidAt?.toMillis 
    ? new Date(payment.paidAt.toMillis()).toLocaleString() 
    : payment.createdAt?.toMillis 
    ? new Date(payment.createdAt.toMillis()).toLocaleString() 
    : new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      
      {/* Print Controls (Hidden when printing) */}
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Payments</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Official Receipt Card */}
      <div 
        id="receipt-card"
        className="w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black"
      >
        {/* Brand Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/logo.png" alt="SC TECH Logo" width={44} height={44} className="object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white print:text-black">SC TECH</h1>
              <p className="text-[11px] text-slate-400 print:text-slate-600">Official Payment & Tax Invoice Receipt</p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold print:border print:border-emerald-600 print:text-emerald-700">
              PAID ✓
            </span>
            <div className="text-[11px] font-mono text-slate-400 print:text-slate-600">
              {payment.receiptNumber || `SCT-2026-${payment.id?.slice(0, 6)}`}
            </div>
          </div>
        </div>

        {/* Customer & Transaction Overview */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Billed To</span>
            <div className="font-bold text-white print:text-black">{payment.userName || "Student"}</div>
            <div className="text-slate-400 print:text-slate-600 font-mono text-[11px]">{payment.userEmail}</div>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Payment Date</span>
            <div className="font-semibold text-slate-200 print:text-black">{paymentDate}</div>
            <div className="text-slate-400 print:text-slate-600 text-[11px]">
              Method: {payment.paymentMethod === "QR_UPI" ? "UPI / Dynamic QR" : "Razorpay Checkout"}
            </div>
          </div>
        </div>

        {/* Line Item Table */}
        <div className="space-y-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] pb-2 print:border-slate-300 print:text-slate-600">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Billing</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 print:divide-slate-200 text-slate-200 print:text-black">
              <tr>
                <td className="py-3">
                  <div className="font-bold">{payment.planName || `${payment.planId} Plan`}</div>
                  <div className="text-[11px] text-slate-400 print:text-slate-600">
                    Full-Stack Blueprints, Digital Credentials, & Career Support
                  </div>
                </td>
                <td className="py-3 text-right font-mono text-[11px]">
                  {payment.billingCycle || "MONTHLY"}
                </td>
                <td className="py-3 text-right font-bold text-emerald-400 print:text-black text-sm">
                  {formatINR(payment.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Calculation */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400 print:text-slate-600">
            <span>Subtotal</span>
            <span>{formatINR(payment.amount)}</span>
          </div>
          <div className="flex justify-between text-slate-400 print:text-slate-600">
            <span>Taxes / Gateway Surcharge</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between text-base font-black text-white print:text-black pt-2 border-t border-slate-800/60 print:border-slate-200">
            <span>Total Amount Paid</span>
            <span className="text-emerald-400 print:text-black">{formatINR(payment.amount)}</span>
          </div>
        </div>

        {/* Audit Details */}
        <div className="p-4 rounded-2xl bg-slate-950/80 print:bg-slate-100 border border-slate-800 print:border-slate-300 space-y-1 text-[11px] font-mono text-slate-400 print:text-slate-600">
          <div>Order ID: <span className="text-slate-300 print:text-black">{payment.orderId || payment.razorpayOrderId}</span></div>
          {payment.razorpayPaymentId && (
            <div>Payment ID: <span className="text-slate-300 print:text-black">{payment.razorpayPaymentId}</span></div>
          )}
          <div>Mode: <span className="text-blue-400 font-bold">{payment.mode || "TEST"}</span></div>
        </div>

        {/* Footer Mandate */}
        <div className="pt-6 border-t border-slate-800 print:border-slate-300 text-center space-y-1 text-xs text-slate-500 print:text-slate-600">
          <p className="font-semibold text-slate-400 print:text-black">Developed by SC TECH ❤️</p>
          <p className="text-[11px]">© 2026 SC TECH. All rights reserved.</p>
        </div>

      </div>

    </div>
  );
}
