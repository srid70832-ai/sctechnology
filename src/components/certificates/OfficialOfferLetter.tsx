"use client";

import React from "react";
import Image from "next/image";
import { 
  User, 
  Building2, 
  Laptop, 
  Clock, 
  Calendar, 
  CalendarCheck, 
  IndianRupee, 
  Timer, 
  Users, 
  CreditCard,
  Globe,
  Mail,
  MapPin,
  Linkedin,
  Youtube,
  Instagram
} from "lucide-react";
import { DocumentData, getRoleTemplate } from "@/lib/document-templates";

interface OfficialOfferLetterProps {
  data?: DocumentData;
  scale?: number;
}

export function OfficialOfferLetter({
  data,
  scale = 1,
}: OfficialOfferLetterProps) {
  const role = getRoleTemplate(data?.roleId || "fullstack");

  const studentName = data?.studentName || "Your Name Here";
  const candidateId = data?.candidateId || "SCT-STU-2026-089";
  const offerId = data?.offerId || "SCT-OFFER-2026-000123";
  const issueDate = data?.issueDate || "09 September 2026";
  const startDate = data?.startDate || "15 September 2026";
  const endDate = data?.endDate || "15 December 2026";
  const stipend = data?.customStipend || role.defaultStipend;
  const workMode = data?.customWorkMode || role.workMode;
  const mentor = data?.customMentor || role.mentorName;
  const department = data?.customDepartment || role.department;

  return (
    <div
      id="sctech-offer-letter"
      className="bg-white text-slate-900 mx-auto rounded-none shadow-2xl relative overflow-hidden print:shadow-none print:m-0 print:border-none select-text"
      style={{
        width: "794px",
        minHeight: "1123px",
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* Top Header Dark Bar */}
      <div className="bg-[#0A1224] text-white px-8 py-5 flex items-center justify-between border-b-2 border-blue-500">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 relative flex items-center justify-center bg-blue-600/20 rounded-xl border border-blue-400/30 overflow-hidden">
            <Image
              src="/logo.png"
              alt="SC TECH Logo"
              width={38}
              height={38}
              className="object-contain"
            />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>SC</span>
              <span className="text-blue-400">TECH</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium tracking-wide">
              Build Skills. Build Careers.
            </p>
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
            LEARN | BUILD
          </div>
          <div className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">
            GROW | SUCCEED
          </div>
          <div className="text-[9px] text-slate-400 tracking-wider uppercase font-semibold">
            EMPOWERING THE NEXT GENERATION
          </div>
        </div>
      </div>

      {/* Main Letter Body */}
      <div className="p-8 sm:p-10 space-y-5 text-[12px] leading-relaxed relative">
        
        {/* Subtle background watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
          <Image src="/logo.png" alt="watermark" width={420} height={420} />
        </div>

        {/* Offer Meta Line & Badge */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 text-[11px] text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Offer Letter ID: </span>
              <span className="font-mono font-bold text-slate-900">{offerId}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Date: </span>
              <span className="font-medium text-slate-900">{issueDate}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200">
              Future Ready Together
            </span>
          </div>
        </div>

        {/* Letter Heading */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight uppercase">
            INTERNSHIP OFFER LETTER
          </h1>
        </div>

        {/* Salutation & Intro */}
        <div className="space-y-2 text-slate-700">
          <p className="font-bold text-slate-900 text-sm">
            Dear <span className="text-blue-700 font-extrabold">{studentName}</span>,
          </p>
          <p>
            Congratulations! We are pleased to offer you an internship opportunity at <strong>SC TECH</strong>.
            We were impressed by your skills, enthusiasm and potential, and we believe you will be a valuable addition to our team.
          </p>
        </div>

        {/* INTERNSHIP DETAILS BOX (Structured Grid) */}
        <div className="rounded-2xl bg-blue-50/60 border border-blue-200/80 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-blue-200/70 pb-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-blue-900">
              INTERNSHIP DETAILS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-[11.5px]">
            {/* Role Title */}
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Internship Role</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900 truncate">{role.roleTitle}</span>
            </div>

            {/* Department */}
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Department</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900 truncate">{department}</span>
            </div>

            {/* Work Mode */}
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Work Mode</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900">{workMode}</span>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Duration</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900">{role.duration}</span>
            </div>

            {/* Start Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Start Date</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900">{startDate}</span>
            </div>

            {/* End Date */}
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">End Date</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900">{endDate}</span>
            </div>

            {/* Stipend */}
            <div className="flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Stipend</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-emerald-700">{stipend}</span>
            </div>

            {/* Working Hours */}
            <div className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Working Hours</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900">{role.workingHours}</span>
            </div>

            {/* Reporting Mentor */}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Reporting Mentor</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-bold text-slate-900">{mentor}</span>
            </div>

            {/* Candidate ID */}
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-slate-600 w-28 shrink-0 font-medium">Candidate ID</span>
              <span className="text-slate-400 font-bold">:</span>
              <span className="font-mono font-bold text-blue-800">{candidateId}</span>
            </div>
          </div>
        </div>

        {/* Important Information Bullets */}
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Important Information</span>
          </h3>
          <ul className="space-y-1.5 text-[11px] text-slate-700 pl-3">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>You will be working on real-world projects and receive guidance from industry mentors.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>This internship is a learning opportunity and does not guarantee future employment.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>You are expected to maintain professionalism, confidentiality and adhere to our policies.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>A completion certificate will be issued based on performance and successful completion.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>Refer to the attached terms and conditions for more details.</span>
            </li>
          </ul>
        </div>

        <p className="text-[11.5px] text-slate-700 pt-1">
          We are excited to have you on board and look forward to your contributions to <strong>SC TECH</strong>. Welcome to the team!
        </p>

        {/* Signatures & Acceptance Section */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
          
          {/* Left: Two Founders Signatures */}
          <div className="sm:col-span-7 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Warm Regards,</span>
            
            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Founder 1: Charudeshna */}
              <div className="space-y-1 text-left">
                <div className="h-10 flex items-end">
                  <svg className="w-28 h-8 text-blue-900" viewBox="0 0 160 50" fill="none">
                    <path d="M10 35 C20 15, 30 10, 45 25 C55 35, 60 15, 75 20 C90 25, 100 15, 120 30 C130 38, 140 20, 150 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M35 15 C40 30, 45 40, 50 42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M70 28 C90 32, 110 28, 130 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="h-px w-28 bg-slate-300" />
                <div className="font-extrabold text-slate-900 text-[11px] leading-tight">Charudeshna</div>
                <div className="text-[9.5px] text-slate-500 font-medium">Founder, SC TECH</div>
              </div>

              {/* Founder 2: Sridharan */}
              <div className="space-y-1 text-left">
                <div className="h-10 flex items-end">
                  <svg className="w-28 h-8 text-blue-900" viewBox="0 0 160 50" fill="none">
                    <path d="M15 30 C30 10, 45 8, 55 22 C65 32, 80 18, 95 24 C110 30, 125 10, 140 20 C148 26, 152 35, 155 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M25 22 C45 25, 75 22, 105 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="h-px w-28 bg-slate-300" />
                <div className="font-extrabold text-slate-900 text-[11px] leading-tight">Sridharan</div>
                <div className="text-[9.5px] text-slate-500 font-medium">Co-Founder, SC TECH</div>
              </div>
            </div>
          </div>

          {/* Right: Acceptance Box */}
          <div className="sm:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-[10.5px]">
            <div className="font-bold text-slate-900 text-xs">Acceptance</div>
            <p className="text-slate-600 text-[10px] leading-tight">
              I accept this internship offer and agree to the terms and conditions.
            </p>
            <div className="pt-2 space-y-2 text-[10px] text-slate-700">
              <div className="flex items-center gap-1">
                <span>Student Signature :</span>
                <span className="flex-1 border-b border-slate-400 border-dotted" />
              </div>
              <div className="flex items-center gap-1">
                <span>Date :</span>
                <span className="flex-1 border-b border-slate-400 border-dotted" />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Official Footer Strip */}
      <div className="bg-[#0A1224] text-slate-300 px-8 py-3.5 text-[10px] space-y-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-slate-300">www.sctech.in</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-slate-300">support@sctech.in</span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-slate-300">Coimbatore, India</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Linkedin className="w-3 h-3 hover:text-blue-400" />
            <Youtube className="w-3 h-3 hover:text-red-400" />
            <Instagram className="w-3 h-3 hover:text-pink-400" />
          </div>
        </div>

        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
          <span>Build Skills. Build Careers.</span>
          <span>LEARN | BUILD | GROW | SUCCEED</span>
        </div>
      </div>
    </div>
  );
}
