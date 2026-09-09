"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { CheckCircle2, ShieldCheck, IndianRupee, Printer, Calendar, User, Hash, FileCheck, Building2 } from "lucide-react";
import { PaymentReceiptData } from "@/lib/payment-documents";
import { formatINR, formatDate } from "@/lib/utils";

export interface PaymentReceiptProps {
  data: PaymentReceiptData;
  scale?: number;
}

export function PaymentReceiptDocument({ data, scale = 1 }: PaymentReceiptProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const url = data.qrVerificationUrl || (typeof window !== "undefined" ? window.location.href : "https://www.sctech.in");
    QRCode.toDataURL(url, {
      width: 130,
      margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    }).then(setQrCodeDataUrl).catch(console.warn);
  }, [data]);

  return (
    <div
      id="sctech-payment-receipt"
      className="bg-white text-slate-900 mx-auto shadow-2xl relative overflow-hidden print:shadow-none print:m-0 print:border-none select-text"
      style={{
        width: "794px",
        minHeight: "1050px",
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* Top Header */}
      <div className="bg-[#0A1224] text-white px-8 py-6 flex items-center justify-between border-b-2 border-blue-600">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative flex items-center justify-center bg-blue-600/20 rounded-xl border border-blue-400/30 overflow-hidden">
            <Image src="/logo.png" alt="SC TECH Logo" width={42} height={42} className="object-contain" />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>SC</span>
              <span className="text-blue-400">TECH</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium tracking-wide">
              Official Stipend Disbursement & Payment Receipt
            </p>
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            PAID & SETTLED ✓
          </span>
          <div className="text-[10px] font-mono text-slate-400 pt-1">
            Bill ID: <strong className="text-white">{data.receiptId}</strong>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 sm:p-10 space-y-6 text-[12px] leading-relaxed relative">
        {/* Subtle Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.025] pointer-events-none select-none">
          <Image src="/logo.png" alt="watermark" width={400} height={400} />
        </div>

        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ISSUED TO</span>
            <div className="font-extrabold text-slate-900 text-sm">{data.studentName}</div>
            <div className="text-slate-600 font-mono text-[11px]">{data.studentEmail}</div>
            <div className="text-slate-500 text-[10px] pt-1">Verified SC TECH Student Account</div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PAYMENT METADATA</span>
            <div className="font-mono text-slate-900 text-xs">
              Date: <strong>{data.paymentDate}</strong>
            </div>
            <div className="font-mono text-slate-700 text-[11px]">
              Ref: <strong className="text-blue-600">{data.transactionReference}</strong>
            </div>
            <div className="text-emerald-700 font-bold text-[11px]">
              Mode: {data.paymentMethod}
            </div>
          </div>
        </div>

        {/* Stipend Award Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest text-blue-300 uppercase">
              REAL-WORLD PROJECT STIPEND
            </span>
            <h2 className="text-xl font-black text-white">{data.projectName}</h2>
            <p className="text-xs text-slate-300">
              Approved for {data.approvedTasks} / {data.tasksCompleted} Task Milestones
            </p>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-blue-200 uppercase">NET AMOUNT DISBURSED</div>
            <div className="text-3xl font-black text-emerald-400">
              {formatINR(data.stipendAmount)}
            </div>
          </div>
        </div>

        {/* Itemized Breakdown Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3.5">Milestone Description</th>
                <th className="p-3.5 text-center">Difficulty / Scope</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Award Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3.5 font-medium text-slate-900">
                  Real-World Project Task Execution (8/8 Tasks Approved)
                  <div className="text-[10px] text-slate-500">{data.projectName}</div>
                </td>
                <td className="p-3.5 text-center text-slate-600">Full Architecture</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    APPROVED ✓
                  </span>
                </td>
                <td className="p-3.5 text-right font-bold text-slate-900">
                  {formatINR(data.stipendAmount)}
                </td>
              </tr>
              <tr className="bg-slate-50/80 font-bold">
                <td colSpan={3} className="p-3.5 text-slate-700 text-right">Total Disbursed:</td>
                <td className="p-3.5 text-right text-base text-blue-700 font-black">
                  {formatINR(data.stipendAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Security & Organization Details */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official SC TECH Institutional Record</span>
          </div>
          <p>
            This electronic receipt confirms the verified transfer of project stipend funds from <strong>SC TECH</strong> to the registered candidate. All audit logs, task evaluation records, and code hashes are stored cryptographically in the SC TECH Academic Ledger.
          </p>
        </div>

        {/* Signatures & QR Section */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-12 items-end gap-4">
          <div className="col-span-4 text-left space-y-0.5">
            <div className="h-8 flex items-end">
              <svg className="w-24 h-7 text-blue-900" viewBox="0 0 160 50" fill="none">
                <path d="M10 35 C20 15, 30 10, 45 25 C55 35, 60 15, 75 20 C90 25, 100 15, 120 30 C130 38, 140 20, 150 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="h-px w-24 bg-slate-400" />
            <div className="font-bold text-slate-900 text-[11px]">Charudeshna</div>
            <div className="text-[9px] text-slate-500">Founder, SC TECH</div>
          </div>

          <div className="col-span-4 text-left space-y-0.5 border-l border-slate-200 pl-4">
            <div className="h-8 flex items-end">
              <svg className="w-24 h-7 text-blue-900" viewBox="0 0 160 50" fill="none">
                <path d="M15 30 C30 10, 45 8, 55 22 C65 32, 80 18, 95 24 C110 30, 125 10, 140 20 C148 26, 152 35, 155 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="h-px w-24 bg-slate-400" />
            <div className="font-bold text-slate-900 text-[11px]">Sridharan</div>
            <div className="text-[9px] text-slate-500">Co-Founder, SC TECH</div>
          </div>

          <div className="col-span-4 flex flex-col items-end text-right">
            <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-xs">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Receipt QR" className="w-12 h-12 block" />
              ) : (
                <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-[8px] font-mono">QR</div>
              )}
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600 mt-1">
              Cryptographic Seal
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-[9px] font-extrabold tracking-widest text-slate-400 uppercase border-t border-slate-100">
          SC TECH • LEARN | BUILD | GROW | SUCCEED
        </div>
      </div>
    </div>
  );
}
