"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  Copy, 
  Check, 
  ArrowRight,
  Award,
  Calendar,
  User,
  Hash
} from "lucide-react";
import { OfficialCertificate } from "@/components/certificates/OfficialCertificate";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CertificateVerificationPage() {
  const params = useParams();
  const certIdParam = params?.certificateId ? String(params.certificateId) : "";
  const certNo = decodeURIComponent(certIdParam).trim();

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!certNo) {
      setLoading(false);
      return;
    }

    async function fetchCert() {
      try {
        const res = await fetch(`/api/certificates/${encodeURIComponent(certNo)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.certificate) {
            setCertificate(data.certificate);
          }
        }
      } catch (err) {
        console.error("Error fetching certificate:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCert();
  }, [certNo]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const isRevoked = certificate?.status === "REVOKED";
  const isVerified = certificate && certificate.status === "VERIFIED";

  // Map certificate metadata to OfficialCertificate props
  const certData = certificate ? {
    certificateType: certificate.metadata?.certificateType || certificate.type || "INTERNSHIP",
    studentName: certificate.studentName || "Verified Student",
    certificateId: certificate.certificateNo || certNo,
    issueDate: certificate.issueDate ? formatDate(certificate.issueDate) : "09 September 2026",
    eventName: certificate.eventName || certificate.metadata?.eventName,
    roundNumber: certificate.metadata?.roundNumber,
    winnerPosition: certificate.metadata?.winnerPosition,
    internshipTitle: certificate.metadata?.internshipTitle || certificate.eventName,
    companyName: certificate.metadata?.companyName || "SC TECH",
    startDate: certificate.metadata?.startDate,
    endDate: certificate.metadata?.endDate,
    completionDate: certificate.metadata?.completionDate,
    projectName: certificate.metadata?.projectName,
    projectDomain: certificate.metadata?.projectDomain,
    technologies: certificate.metadata?.technologies,
    courseName: certificate.metadata?.courseName || certificate.eventName,
    courseProvider: certificate.metadata?.courseProvider || "SC TECH",
    duration: certificate.metadata?.duration,
    skills: certificate.metadata?.skills,
    verificationCode: certificate.verificationToken || certificate.metadata?.verificationCode,
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 py-10 max-w-6xl mx-auto px-4 sm:px-6 w-full space-y-8">
        
        {/* Verification Status Banner */}
        <div className="text-center space-y-2 max-w-2xl mx-auto print:hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>OFFICIAL SC TECH CREDENTIAL REGISTRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Certificate Authenticity Verification
          </h1>
          <p className="text-xs text-slate-400">
            Official cryptographic verification and public record registry for SC TECH engineering credentials.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Validating digital signature against cryptographic ledger...</span>
          </div>
        ) : isRevoked ? (
          /* REVOKED STATE */
          <div className="p-8 sm:p-10 rounded-3xl bg-red-950/40 border-2 border-red-500/60 shadow-2xl space-y-6 max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-black uppercase tracking-wider">
                REVOKED CREDENTIAL
              </span>
              <h2 className="text-2xl font-black text-white">This Certificate Has Been Revoked</h2>
              <p className="text-xs text-red-300/80 leading-relaxed">
                Certificate ID <strong className="text-white font-mono">{certNo}</strong> has been officially revoked by SC TECH Administration and is no longer valid or recognized for academic or professional credit.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-red-500/30 text-left text-xs text-slate-300 space-y-1.5">
              <div className="text-slate-400">Recipient: <strong className="text-white">{certificate.studentName}</strong></div>
              <div className="text-slate-400">Event/Track: <strong className="text-white">{certificate.eventName}</strong></div>
              <div className="text-slate-400">Original Date: <span className="text-slate-300">{formatDate(certificate.issueDate)}</span></div>
            </div>

            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                <span>Verify Another Certificate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : isVerified && certData ? (
          /* VERIFIED GENUINE STATE */
          <div className="space-y-6">
            
            {/* Status Summary & Actions Bar */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">Genuine & Validated Credential</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold uppercase">
                      VERIFIED ✓
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Issued to <strong className="text-white">{certData.studentName}</strong> for <span className="text-blue-400 font-semibold">{certData.eventName || certData.internshipTitle || certData.courseName}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
                  <span>{copied ? "Link Copied!" : "Copy Link"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>

            {/* Quick Metadata Spec Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Recipient</div>
                  <div className="text-xs font-bold text-white truncate">{certData.studentName}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Category</div>
                  <div className="text-xs font-bold text-indigo-300 truncate">{certData.certificateType}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Issue Date</div>
                  <div className="text-xs font-bold text-white truncate">{certData.issueDate}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Certificate ID</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 truncate">{certData.certificateId}</div>
                </div>
              </div>
            </div>

            {/* Official SC TECH Certificate Template Render */}
            <div className="overflow-x-auto p-2 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 flex justify-center shadow-2xl">
              <OfficialCertificate data={certData} />
            </div>

            {/* Bottom Details & Security Info */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2 print:hidden">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Cryptographically Sealed & Tamper-Proof</span>
              </div>
              <p className="text-[11px] max-w-xl mx-auto text-slate-400">
                SC TECH digital certificates are issued exclusively to students who demonstrate verified engineering competence and completion of industry requirements.
              </p>
            </div>

          </div>
        ) : (
          /* NOT FOUND OR PENDING EVALUATION STATE */
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-5 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">Certificate Not Found or Pending Evaluation</h3>
              <p className="text-xs text-slate-400">
                Identifier: <span className="font-mono text-cyan-400 font-semibold">{certNo || "None"}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-left text-xs text-slate-300 space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Certificate Issuance Policy:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                SC TECH verified digital certificates are strictly issued <strong>only after</strong> a student completes an assigned Internship Track or submits and successfully finishes a Hackathon Challenge.
              </p>
              <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1 pt-1">
                <li>If you recently enrolled, complete your project milestones first.</li>
                <li>Certificates will be automatically unlocked and verifiable once evaluated.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/internships"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25"
              >
                Explore Internships
              </Link>
              <Link
                href="/hackathons"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition"
              >
                View Live Hackathons
              </Link>
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
