"use client";

import React from "react";
import Image from "next/image";
import { Award, CheckCircle2, ShieldCheck, Building2, Calendar, FileText } from "lucide-react";
import { StipendLetterData } from "@/lib/payment-documents";
import { formatINR, formatDate } from "@/lib/utils";

export interface StipendLetterProps {
  data: StipendLetterData;
  scale?: number;
}

export function StipendLetterDocument({ data, scale = 1 }: StipendLetterProps) {
  return (
    <div
      id="sctech-stipend-letter"
      className="bg-white text-slate-900 mx-auto shadow-2xl relative overflow-hidden print:shadow-none print:m-0 print:border-none select-text"
      style={{
        width: "794px",
        minHeight: "1123px",
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
              Official Stipend & Milestone Achievement Letter
            </p>
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
            LEARN | BUILD | GROW | SUCCEED
          </div>
          <div className="text-[10px] font-mono text-slate-300">
            Letter ID: <strong className="text-white">{data.letterId}</strong>
          </div>
        </div>
      </div>

      {/* Main Letter Body */}
      <div className="p-8 sm:p-10 space-y-6 text-[12px] leading-relaxed relative">
        {/* Subtle Background Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.025] pointer-events-none select-none">
          <Image src="/logo.png" alt="watermark" width={400} height={400} />
        </div>

        {/* Date & Ref Line */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 text-slate-600">
            <div>Date: <strong className="text-slate-900">{data.issueDate}</strong></div>
            <div>Bill Receipt ID: <span className="font-mono font-bold text-blue-700">{data.receiptId}</span></div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
            Official Award
          </span>
        </div>

        {/* Heading */}
        <div className="pt-2">
          <h1 className="text-2xl font-black text-blue-700 uppercase tracking-tight">
            OFFICIAL STIPEND & ACHIEVEMENT LETTER
          </h1>
        </div>

        {/* Salutation & Intro */}
        <div className="space-y-3 text-slate-700 text-[12.5px]">
          <p className="font-bold text-slate-900 text-sm">
            Dear <span className="text-blue-700 font-extrabold">{data.studentName}</span>,
          </p>
          <p>
            On behalf of <strong>SC TECH</strong>, we congratulate you on successfully completing the real-world engineering project <strong>"{data.projectName}"</strong> and excelling in all assigned technical milestones.
          </p>
          <p>
            Your technical rigor, proactive problem solving, and adherence to production coding standards have been evaluated and approved by our engineering assessment board. In recognition of your exemplary work, SC TECH has awarded and disbursed a performance stipend of <strong>{formatINR(data.stipendAmount)}</strong>.
          </p>
        </div>

        {/* Achievement Summary Card */}
        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-blue-200/80 pb-2">
            <Award className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase text-blue-900 tracking-wider">
              PROJECT ACHIEVEMENT SUMMARY
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11.5px]">
            <div>
              <span className="text-slate-500 font-medium">Candidate Name:</span>
              <div className="font-bold text-slate-900">{data.studentName}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Project Name:</span>
              <div className="font-bold text-slate-900">{data.projectName}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Domain Track:</span>
              <div className="font-bold text-blue-700">{data.projectDomain}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tasks Approved:</span>
              <div className="font-bold text-emerald-700">{data.approvedTasks} / {data.tasksCompleted} Tasks ✓</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Stipend Amount:</span>
              <div className="font-black text-emerald-700 text-sm">{formatINR(data.stipendAmount)}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Disbursement Date:</span>
              <div className="font-bold text-slate-900">{data.paymentDate}</div>
            </div>
          </div>
        </div>

        {/* Formal Closing Words */}
        <div className="space-y-2 text-slate-700 text-[12px]">
          <p>
            We commend your engineering diligence and look forward to your continued success as you build cutting-edge software and advance your professional technology career.
          </p>
          <p className="font-semibold text-slate-900">
            Sincerely,
          </p>
        </div>

        {/* Leadership Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8">
          <div className="text-left space-y-0.5">
            <div className="h-10 flex items-end">
              <svg className="w-28 h-8 text-blue-900" viewBox="0 0 160 50" fill="none">
                <path d="M10 35 C20 15, 30 10, 45 25 C55 35, 60 15, 75 20 C90 25, 100 15, 120 30 C130 38, 140 20, 150 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="h-px w-32 bg-slate-400" />
            <div className="font-bold text-slate-900 text-[11px]">Charudeshna</div>
            <div className="text-[9px] text-slate-500 font-medium">Founder, SC TECH</div>
          </div>

          <div className="text-left space-y-0.5">
            <div className="h-10 flex items-end">
              <svg className="w-28 h-8 text-blue-900" viewBox="0 0 160 50" fill="none">
                <path d="M15 30 C30 10, 45 8, 55 22 C65 32, 80 18, 95 24 C110 30, 125 10, 140 20 C148 26, 152 35, 155 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="h-px w-32 bg-slate-400" />
            <div className="font-bold text-slate-900 text-[11px]">Sridharan</div>
            <div className="text-[9px] text-slate-500 font-medium">Co-Founder, SC TECH</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center text-[9px] font-extrabold tracking-widest text-slate-400 uppercase border-t border-slate-100">
          SC TECH • EMPOWERING THE NEXT GENERATION OF ENGINEERS
        </div>
      </div>
    </div>
  );
}
