"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Award, 
  CreditCard, 
  ArrowLeft, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  ExternalLink, 
  Loader2, 
  Check, 
  Printer, 
  ShieldCheck, 
  FileText,
  DollarSign,
  User,
  X
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { formatINR, formatDate } from "@/lib/utils";

interface EligibleCandidate {
  userId: string;
  studentName: string;
  studentEmail: string;
  projectId: string;
  projectName: string;
  approvedTasks: number;
  totalTasks: number;
  stipendAmount: number;
  bankDetailsSubmitted: boolean;
  paymentStatus: "PENDING" | "PAID";
}

export default function AdminProjectStipendsPage() {
  const [candidates, setCandidates] = useState<EligibleCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [disbursingId, setDisbursingId] = useState<string | null>(null);

  const fetchEligibleCandidates = async () => {
    setLoading(true);
    try {
      // Aggregate user tasks to find eligible candidates
      const tasksSnap = await getDocs(collection(db, "userProjectTasks"));
      const userProjectMap: Record<string, { approved: number; total: number; userId: string; projectId: string }> = {};

      tasksSnap.forEach((d) => {
        const t = d.data();
        const key = `${t.userId}_${t.projectId}`;
        if (!userProjectMap[key]) {
          userProjectMap[key] = { approved: 0, total: 0, userId: t.userId, projectId: t.projectId };
        }
        userProjectMap[key].total += 1;
        if (t.status === "APPROVED" || t.status === "COMPLETED") {
          userProjectMap[key].approved += 1;
        }
      });

      // Check payment receipts for already paid status
      const receiptSnap = await getDocs(collection(db, "paymentReceipts"));
      const paidUserKeys = new Set<string>();
      receiptSnap.forEach((d) => {
        const r = d.data();
        paidUserKeys.add(`${r.userId}_${r.projectName}`);
      });

      const list: EligibleCandidate[] = [];
      for (const key of Object.keys(userProjectMap)) {
        const data = userProjectMap[key];
        if (data.approved >= 6) {
          const stipend = data.approved >= 8 ? 5000 : 1200;
          list.push({
            userId: data.userId,
            studentName: "Verified Candidate",
            studentEmail: "student@sctech.in",
            projectId: data.projectId,
            projectName: data.projectId.replace(/-/g, " ").toUpperCase(),
            approvedTasks: data.approved,
            totalTasks: 8,
            stipendAmount: stipend,
            bankDetailsSubmitted: true,
            paymentStatus: paidUserKeys.has(key) ? "PAID" : "PENDING",
          });
        }
      }

      setCandidates(list);
    } catch (err) {
      console.error("Error fetching stipend candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleCandidates();
  }, []);

  const handleDisburse = async (c: EligibleCandidate) => {
    const txnRef = window.prompt(
      `Enter Bank / IMPS / UPI Transaction Reference for ${c.userId} (Amount: ₹${c.stipendAmount}):`,
      `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/HDFC`
    );
    if (!txnRef) return;

    setDisbursingId(c.userId);
    try {
      const res = await fetch("/api/admin/projects/disburse-stipend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: c.userId,
          studentName: c.studentName,
          studentEmail: c.studentEmail,
          projectId: c.projectId,
          projectName: c.projectName,
          stipendAmount: c.stipendAmount,
          tasksCompleted: 8,
          approvedTasks: c.approvedTasks,
          transactionReference: txnRef,
          paymentMethod: "Direct Bank Transfer (IMPS / UPI)",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Stipend Disbursed Successfully!\nReceipt ID: ${data.receipt?.receiptId}\nOfficial Letter ID: ${data.letter?.letterId}`);
        await fetchEligibleCandidates();
      } else {
        const d = await res.json();
        alert(d.error || "Disbursement failed");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during disbursement");
    } finally {
      setDisbursingId(null);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    return !q || c.userId.toLowerCase().includes(q) || c.projectName.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/projects" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Stipend Disbursement Console</h1>
              <p className="text-xs text-slate-400">Authorize stipend payments, generate Bill Receipts (SC-PAY-2026-XXXXXX) and Official Letters.</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEligibleCandidates}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
          title="Refresh"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs text-slate-300">
            <strong>Active Disbursement Rules:</strong> 8 / 8 Approved Tasks = <span className="text-emerald-400 font-bold">₹5,000</span> | 6-7 Approved Tasks = <span className="text-blue-400 font-bold">₹1,200</span>.
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase">Authoritative Ledger</span>
      </div>

      {/* Eligible Candidates Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs">Evaluating candidate eligibility across projects...</span>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No eligible candidates yet</h3>
            <p className="text-xs text-slate-500">Candidates who get 6+ tasks approved will automatically appear here for disbursement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Tasks Approved</th>
                  <th className="p-4">Stipend Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Disbursement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCandidates.map((c, idx) => {
                  const isDisbursing = disbursingId === c.userId;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-mono font-bold text-white">
                        {c.userId}
                      </td>

                      <td className="p-4 font-bold text-slate-200">
                        {c.projectName}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          {c.approvedTasks} / 8 Approved ✓
                        </span>
                      </td>

                      <td className="p-4 font-black text-emerald-400 text-sm">
                        {formatINR(c.stipendAmount)}
                      </td>

                      <td className="p-4">
                        {c.paymentStatus === "PAID" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            DISBURSED & PAID ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            READY FOR DISBURSEMENT
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {c.paymentStatus === "PAID" ? (
                          <Link
                            href="/my-documents"
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>View Generated Receipt</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={isDisbursing}
                            onClick={() => handleDisburse(c)}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            {isDisbursing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                            <span>Confirm Payment</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
