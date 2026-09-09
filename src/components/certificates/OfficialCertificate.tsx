"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { 
  BookOpen, 
  Settings, 
  Users, 
  TrendingUp,
  ShieldCheck,
  Trophy,
  Award,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { CertificateType, WinnerPosition, getCertificateWording, CertificateMetadata } from "@/lib/certificate-system";

export interface OfficialCertificateProps {
  data?: {
    certificateType?: CertificateType;
    studentName: string;
    certificateId: string;
    issueDate?: string;
    eventName?: string;
    roundNumber?: number;
    winnerPosition?: WinnerPosition;
    internshipTitle?: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
    completionDate?: string;
    projectName?: string;
    projectDomain?: string;
    technologies?: string[];
    courseName?: string;
    courseProvider?: string;
    duration?: string;
    skills?: string[];
    verificationCode?: string;
    roleId?: string;
  };
  scale?: number;
}

export function OfficialCertificate({
  data,
  scale = 1,
}: OfficialCertificateProps) {
  const type: CertificateType = data?.certificateType || "INTERNSHIP";
  const studentName = data?.studentName || "Verified Student";
  const certificateId = data?.certificateId || "SC-CERT-2026-000789";
  const issueDate = data?.issueDate || "09 September 2026";
  const isWinner = type === "WINNER";

  const wording = getCertificateWording(type, {
    studentName,
    eventName: data?.eventName,
    roundNumber: data?.roundNumber,
    winnerPosition: data?.winnerPosition,
    internshipTitle: data?.internshipTitle,
    companyName: data?.companyName,
    startDate: data?.startDate,
    endDate: data?.endDate,
    projectName: data?.projectName,
    projectDomain: data?.projectDomain,
    technologies: data?.technologies,
    courseName: data?.courseName,
    courseProvider: data?.courseProvider,
    duration: data?.duration,
    completionDate: data?.completionDate || issueDate,
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const verifyUrl = typeof window !== "undefined"
      ? `${window.location.origin}/verify/${certificateId}`
      : `https://www.sctech.in/verify/${certificateId}`;

    QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: isWinner ? "#1E1B4B" : "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    }).then(setQrDataUrl).catch(console.warn);
  }, [certificateId, isWinner]);

  return (
    <div
      id="sctech-certificate"
      className="bg-white text-slate-900 mx-auto rounded-none shadow-2xl relative overflow-hidden print:shadow-none print:m-0 print:border-none select-text"
      style={{
        width: "960px",
        minHeight: "680px",
        maxWidth: "100%",
        boxSizing: "border-box",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* 1. FUTURISTIC GEOMETRIC CORNER ACCENTS */}
      {/* Top-Left Diagonal Dark Blue Frame */}
      <div className={`absolute top-0 left-0 w-44 h-44 ${isWinner ? "bg-gradient-to-br from-[#1E1435] via-[#2A1B4E] to-[#4C1D95]" : "bg-gradient-to-br from-[#0B1528] via-[#102447] to-[#1E3A8A]"} [clip-path:polygon(0_0,100%_0,0_100%)] z-0 pointer-events-none`} />
      <div className={`absolute top-0 left-0 w-36 h-36 border-b-2 border-r-2 ${isWinner ? "border-amber-400/50" : "border-cyan-400/40"} [clip-path:polygon(0_0,100%_0,0_100%)] z-0 pointer-events-none`} />
      
      {/* Top-Right Diagonal Dark Blue Frame */}
      <div className={`absolute top-0 right-0 w-52 h-52 ${isWinner ? "bg-gradient-to-bl from-[#180E2B] via-[#241442] to-[#3B0764]" : "bg-gradient-to-bl from-[#091122] via-[#0E1E3D] to-[#1A365D]"} [clip-path:polygon(100%_0,0_0,100%_100%)] z-0 pointer-events-none`} />

      {/* Bottom-Right Diagonal Dark Blue Frame */}
      <div className={`absolute bottom-0 right-0 w-48 h-48 ${isWinner ? "bg-gradient-to-tl from-[#1E1435] via-[#2A1B4E] to-[#4C1D95]" : "bg-gradient-to-tl from-[#0B1528] via-[#102447] to-[#1E3A8A]"} [clip-path:polygon(100%_100%,0_100%,100%_0)] z-0 pointer-events-none`} />
      <div className={`absolute bottom-0 right-0 w-40 h-40 border-t-2 border-l-2 ${isWinner ? "border-amber-400/40" : "border-cyan-400/30"} [clip-path:polygon(100%_100%,0_100%,100%_0)] z-0 pointer-events-none`} />

      {/* Bottom-Left Diagonal Accent */}
      <div className={`absolute bottom-0 left-0 w-36 h-36 ${isWinner ? "bg-gradient-to-tr from-[#120824] to-[#2E1065]" : "bg-gradient-to-tr from-[#080E1C] to-[#132240]"} [clip-path:polygon(0_100%,100%_100%,0_0)] z-0 pointer-events-none`} />

      {/* 2. RIGHT RIBBON BADGE */}
      <div className={`absolute top-0 right-10 z-10 w-14 h-32 ${isWinner ? "bg-gradient-to-b from-[#2E1065] via-[#581C87] to-[#1E1B4B] text-amber-300 border-amber-400/60" : "bg-gradient-to-b from-[#0B1528] via-[#112246] to-[#0A1120] text-amber-400 border-amber-500/40"} shadow-xl border-x flex flex-col items-center justify-start pt-3 text-[7.5px] font-black tracking-widest uppercase text-center [clip-path:polygon(0_0,100%_0,100%_100%,50%_85%,0_100%)] select-none`}>
        <span className="text-[9px] text-amber-300">{isWinner ? "🏆" : "★"}</span>
        <span className="leading-tight mt-1 text-slate-200">SKILLS</span>
        <span className="leading-tight text-slate-300">PEOPLE</span>
        <span className="leading-tight text-amber-400">OPPORTUNITIES</span>
        <span className="leading-tight text-[6.5px] text-slate-400 mt-0.5">A BRIGHTER</span>
        <span className="leading-tight text-[6.5px] text-amber-300">TOMORROW</span>
      </div>

      {/* 3. INNER CONTAINER */}
      <div className={`m-6 sm:m-8 p-6 sm:p-8 rounded-none border ${isWinner ? "border-amber-400/70 shadow-inner bg-gradient-to-b from-amber-50/20 via-white to-amber-50/10" : "border-amber-500/40 bg-white/95"} relative z-10 flex flex-col justify-between min-h-[610px]`}>
        
        {/* Fine Inner Accent Border */}
        <div className={`absolute inset-1.5 border ${isWinner ? "border-amber-300/40" : "border-slate-200"} pointer-events-none`} />

        {/* TOP ROW: SC TECH Logo on Left, Certificate Meta on Right */}
        <div className="flex items-start justify-between relative z-10 pr-16 pl-6 pt-1">
          {/* SC TECH Official Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative flex items-center justify-center bg-blue-600/10 rounded-xl border border-blue-500/30 overflow-hidden shadow-xs">
              <Image
                src="/logo.png"
                alt="SC TECH Logo"
                width={42}
                height={42}
                className="object-contain"
              />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-1">
                <span>SC</span>
                <span className="text-blue-600">TECH</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium tracking-wide">
                Build Skills. Build Careers.
              </p>
            </div>
          </div>

          {/* Certificate Metadata */}
          <div className="text-right text-[11px] space-y-0.5 text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Certificate ID: </span>
              <span className="font-mono font-bold text-slate-900">{certificateId}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Issue Date: </span>
              <span className="font-medium text-slate-900">{issueDate}</span>
            </div>
            {data?.verificationCode && (
              <div>
                <span className="font-semibold text-slate-700">Verification Hash: </span>
                <span className="font-mono text-[10px] text-slate-600 font-semibold">{data.verificationCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER CONTENT: Golden Laurel Wreath + Title + Recipient Name + Description */}
        <div className="my-auto text-center space-y-2.5 relative z-10 px-4">
          
          {/* Laurel Wreath & Title Container */}
          <div className="flex items-center justify-center gap-3">
            {/* Left Laurel Branch SVG */}
            <svg className={`w-12 h-16 ${isWinner ? "text-amber-500" : "text-amber-500/80"} -scale-x-100 shrink-0`} viewBox="0 0 60 90" fill="currentColor">
              <path d="M45 80 C35 70, 20 55, 25 35 C28 20, 40 10, 48 5 C46 15, 38 25, 38 35 C38 48, 48 60, 52 70 Z" />
              <path d="M22 65 C12 60, 5 45, 12 32 C18 20, 30 18, 32 20 C25 28, 20 38, 24 50 Z" opacity="0.85" />
              <path d="M12 45 C5 38, 2 25, 8 15 C14 8, 24 10, 25 12 C18 18, 14 26, 16 35 Z" opacity="0.7" />
            </svg>

            <div className="space-y-1">
              {isWinner && (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-800 text-[10px] font-black uppercase tracking-widest shadow-xs">
                  <Trophy className="w-3 h-3 text-amber-600" />
                  <span>{wording.badgeText}</span>
                </div>
              )}
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight uppercase font-serif ${isWinner ? "text-[#3B0764]" : "text-slate-950"}`}>
                {wording.headerTitle}
              </h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-amber-600">
                {wording.subHeaderTitle}
              </p>
            </div>

            {/* Right Laurel Branch SVG */}
            <svg className={`w-12 h-16 ${isWinner ? "text-amber-500" : "text-amber-500/80"} shrink-0`} viewBox="0 0 60 90" fill="currentColor">
              <path d="M45 80 C35 70, 20 55, 25 35 C28 20, 40 10, 48 5 C46 15, 38 25, 38 35 C38 48, 48 60, 52 70 Z" />
              <path d="M22 65 C12 60, 5 45, 12 32 C18 20, 30 18, 32 20 C25 28, 20 38, 24 50 Z" opacity="0.85" />
              <path d="M12 45 C5 38, 2 25, 8 15 C14 8, 24 10, 25 12 C18 18, 14 26, 16 35 Z" opacity="0.7" />
            </svg>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-slate-600 font-medium tracking-wide">
            This certificate is proudly presented to
          </p>

          {/* Recipient Name in Signature Calligraphy Script */}
          <div className="py-1">
            <h2 
              className={`text-4xl sm:text-5xl font-extrabold tracking-normal font-serif italic drop-shadow-xs ${isWinner ? "text-[#4C1D95]" : "text-[#1E3A8A]"}`}
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                letterSpacing: "0.5px",
              }}
            >
              {studentName}
            </h2>
          </div>

          {/* Golden Center Divider */}
          <div className="flex items-center justify-center gap-3 max-w-xs mx-auto py-0.5">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-400 to-amber-500 flex-1" />
            <span className="text-amber-500 text-xs">{isWinner ? "★" : "◆"}</span>
            <div className="h-px bg-gradient-to-l from-transparent via-amber-400 to-amber-500 flex-1" />
          </div>

          {/* Description Body Text */}
          <div className="max-w-2xl mx-auto space-y-1 text-slate-700 text-[12px] leading-relaxed">
            <p className="font-medium text-slate-800">
              {wording.bodyParagraph}
            </p>
          </div>

          {/* 4 Feature Badges Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-800 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Gain Practical Experience</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span>Work on Real Projects</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Industry Mentorship</span>
            </div>

            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Build a Brighter Future</span>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Signatures, QR Code & Footer Banner */}
        <div className="pt-3 border-t border-slate-200 relative z-10">
          <div className="grid grid-cols-12 items-end gap-4 px-6 pb-2">
            
            {/* Founder 1 Signature: Charudeshna */}
            <div className="col-span-4 text-left space-y-0.5">
              <div className="h-10 flex items-end">
                <svg className="w-28 h-8 text-blue-900" viewBox="0 0 160 50" fill="none">
                  <path d="M10 35 C20 15, 30 10, 45 25 C55 35, 60 15, 75 20 C90 25, 100 15, 120 30 C130 38, 140 20, 150 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M35 15 C40 30, 45 40, 50 42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M70 28 C90 32, 110 28, 130 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="h-px w-28 bg-slate-400" />
              <div className="font-extrabold text-slate-900 text-[11px] leading-tight">Charudeshna</div>
              <div className="text-[9px] text-slate-500 font-medium">Founder, SC TECH</div>
            </div>

            {/* Founder 2 Signature: Sridharan */}
            <div className="col-span-4 text-left space-y-0.5 border-l border-slate-200 pl-4">
              <div className="h-10 flex items-end">
                <svg className="w-28 h-8 text-blue-900" viewBox="0 0 160 50" fill="none">
                  <path d="M15 30 C30 10, 45 8, 55 22 C65 32, 80 18, 95 24 C110 30, 125 10, 140 20 C148 26, 152 35, 155 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M25 22 C45 25, 75 22, 105 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="h-px w-28 bg-slate-400" />
              <div className="font-extrabold text-slate-900 text-[11px] leading-tight">Sridharan</div>
              <div className="text-[9px] text-slate-500 font-medium">Co-Founder, SC TECH</div>
            </div>

            {/* Right: Cryptographic Verification QR Code */}
            <div className="col-span-4 flex flex-col items-end text-right">
              <div className="p-1 bg-white border-2 border-slate-900 rounded-lg shadow-sm">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Verify QR Code" className="w-14 h-14 block" />
                ) : (
                  <div className="w-14 h-14 bg-slate-100 flex items-center justify-center text-[9px] font-mono">
                    QR
                  </div>
                )}
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-800 mt-1">
                Scan to Verify
              </span>
            </div>

          </div>

          {/* Bottom Motto Strip */}
          <div className="pt-2 text-center text-[9px] font-black tracking-widest text-blue-600 uppercase border-t border-slate-100">
            LEARN | BUILD | GROW | SUCCEED
          </div>
        </div>

      </div>
    </div>
  );
}
