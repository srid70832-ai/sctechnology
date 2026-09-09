"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OfficialCertificate } from "@/components/certificates/OfficialCertificate";
import { OfficialOfferLetter } from "@/components/certificates/OfficialOfferLetter";
import { DocumentViewerModal } from "@/components/certificates/DocumentViewerModal";
import { 
  Award, 
  Download, 
  ExternalLink, 
  Loader2, 
  ShieldCheck, 
  FileText, 
  Sliders, 
  Printer, 
  Sparkles,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Copy,
  Check,
  Trophy,
  BookOpen,
  Briefcase,
  Layers,
  PlusCircle,
  Clock
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  ROLE_TEMPLATES, 
  getRoleTemplate, 
  DocumentData 
} from "@/lib/document-templates";
import { CertificateType, CertificateMetadata } from "@/lib/certificate-system";
import Link from "next/link";

interface AvailableMilestone {
  id: string;
  type: CertificateType;
  title: string;
  eventName: string;
  domain: string;
  duration?: string;
  technologies?: string[];
  winnerPosition?: string;
  roundNumber?: number;
}

const AVAILABLE_MILESTONES: AvailableMilestone[] = [
  {
    id: "m-fs-int",
    type: "INTERNSHIP",
    title: "Full-Stack Web Development Internship",
    eventName: "Full-Stack Web Development Track",
    domain: "Web & Cloud Engineering",
    duration: "12 Weeks (480 Hours)",
    technologies: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS"],
  },
  {
    id: "m-ai-int",
    type: "INTERNSHIP",
    title: "AI & Machine Learning Engineering Internship",
    eventName: "Applied AI & Deep Learning Track",
    domain: "Artificial Intelligence",
    duration: "12 Weeks (480 Hours)",
    technologies: ["Python", "PyTorch", "TensorFlow", "FastAPI", "OpenAI APIs", "LangChain"],
  },
  {
    id: "m-h1-r1",
    type: "ROUND_1",
    title: "National Tech Hackathon — Round 1 Qualifier",
    eventName: "SC TECH Nationwide Innovation Challenge 2026",
    domain: "Competitive Hackathon",
    roundNumber: 1,
  },
  {
    id: "m-h1-r2",
    type: "ROUND_2",
    title: "National Tech Hackathon — Round 2 Finalist",
    eventName: "SC TECH Nationwide Innovation Challenge 2026",
    domain: "Competitive Hackathon",
    roundNumber: 2,
  },
  {
    id: "m-cs-py",
    type: "COURSE",
    title: "Advanced Data Structures & Algorithms",
    eventName: "Advanced Data Structures & System Design",
    domain: "Computer Science",
    duration: "60 Hours",
    technologies: ["Data Structures", "Algorithms", "Dynamic Programming", "Graph Theory"],
  },
  {
    id: "m-proj-saas",
    type: "PROJECT",
    title: "Enterprise Multi-Tenant SaaS Platform",
    eventName: "Enterprise SaaS Architecture Capstone",
    domain: "Cloud & Systems",
    technologies: ["Next.js", "Prisma", "Docker", "Stripe", "Redis"],
  },
];

export default function MyCertificatesPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"CERTIFICATES" | "OFFER_LETTERS">("CERTIFICATES");
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCertIndex, setSelectedCertIndex] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("fullstack");
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Document modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"CERTIFICATE" | "OFFER_LETTER">("CERTIFICATE");

  const fetchCertificates = async () => {
    try {
      const res = await fetch("/api/certificates");
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleClaimCertificate = async (milestone: AvailableMilestone) => {
    if (!user) {
      alert("Please log in to claim your certificate.");
      return;
    }
    setClaimingId(milestone.id);
    setClaimSuccessMsg(null);

    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: milestone.type,
          eventName: milestone.eventName,
          roundNumber: milestone.roundNumber,
          winnerPosition: milestone.winnerPosition,
          internshipTitle: milestone.type === "INTERNSHIP" ? milestone.title : undefined,
          companyName: "SC TECH",
          projectName: milestone.type === "PROJECT" ? milestone.title : undefined,
          projectDomain: milestone.domain,
          technologies: milestone.technologies,
          courseName: milestone.type === "COURSE" ? milestone.title : undefined,
          courseProvider: "SC TECH Academy",
          duration: milestone.duration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate certificate");
      }

      setClaimSuccessMsg(`🎉 Milestone certificate "${milestone.title}" generated successfully!`);
      await fetchCertificates();
      setSelectedCertIndex(0);
      setTimeout(() => setClaimSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to claim certificate");
    } finally {
      setClaimingId(null);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (filterType === "ALL") return true;
    const type = (c.metadata?.certificateType || c.type || "").toUpperCase();
    if (filterType === "INTERNSHIP") return type === "INTERNSHIP";
    if (filterType === "HACKATHON") return ["ROUND_1", "ROUND_2", "PARTICIPATION", "WINNER"].includes(type);
    if (filterType === "COURSE") return type === "COURSE";
    if (filterType === "PROJECT") return type === "PROJECT";
    return true;
  });

  const activeCert = filteredCerts[selectedCertIndex] || filteredCerts[0] || certificates[0];

  const activeCertData = activeCert ? {
    certificateType: (activeCert.metadata?.certificateType || activeCert.type || "INTERNSHIP") as CertificateType,
    studentName: activeCert.studentName || user?.name || "Verified Student",
    certificateId: activeCert.certificateNo || "SC-CERT-2026-000789",
    issueDate: activeCert.issueDate ? formatDate(activeCert.issueDate) : "09 September 2026",
    eventName: activeCert.eventName || activeCert.metadata?.eventName,
    roundNumber: activeCert.metadata?.roundNumber,
    winnerPosition: activeCert.metadata?.winnerPosition,
    internshipTitle: activeCert.metadata?.internshipTitle || activeCert.eventName,
    companyName: activeCert.metadata?.companyName || "SC TECH",
    startDate: activeCert.metadata?.startDate,
    endDate: activeCert.metadata?.endDate,
    completionDate: activeCert.metadata?.completionDate,
    projectName: activeCert.metadata?.projectName,
    projectDomain: activeCert.metadata?.projectDomain,
    technologies: activeCert.metadata?.technologies,
    courseName: activeCert.metadata?.courseName || activeCert.eventName,
    courseProvider: activeCert.metadata?.courseProvider || "SC TECH",
    duration: activeCert.metadata?.duration,
    skills: activeCert.metadata?.skills,
    verificationCode: activeCert.verificationToken || activeCert.metadata?.verificationCode,
  } : null;

  const currentRole = getRoleTemplate(selectedRole);
  const activeOfferDocData: DocumentData = {
    documentType: "OFFER_LETTER",
    roleId: selectedRole,
    studentName: user?.name || "Verified Candidate",
    candidateId: user?.userId ? `SCT-STU-${user.userId.slice(0, 6).toUpperCase()}` : "SCT-STU-2026-089",
    offerId: `SCT-OFFER-2026-${(user?.userId || "000123").slice(0, 6).toUpperCase()}`,
    certificateId: activeCert?.certificateNo || "SCT-CERT-2026-000789",
    issueDate: "09 September 2026",
    startDate: "15 September 2026",
    endDate: "15 December 2026",
  };

  const handleCopyPublicLink = (certNo: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/verify/${certNo}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <div className="print:hidden">
        <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="print:hidden">
          <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </div>

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Tamper-Resistant Credentials</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 mt-2">
                <Award className="w-7 h-7 text-blue-400" />
                <span>Student Certificate & Credential Wallet</span>
              </h1>
              <p className="text-xs text-slate-400">
                Official SC TECH verified digital completion certificates and internship offer letters.
              </p>
            </div>

            {/* Document Type Switcher */}
            <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center shadow-lg">
              <button
                type="button"
                onClick={() => setActiveTab("CERTIFICATES")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "CERTIFICATES"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificates ({certificates.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("OFFER_LETTERS")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === "OFFER_LETTERS"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Internship Offer Letters</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {claimSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{claimSuccessMsg}</span>
            </div>
          )}

          {/* Main Content Area */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Loading your official credentials...</span>
            </div>
          ) : activeTab === "CERTIFICATES" ? (
            <div className="space-y-8">
              
              {/* Filter Tabs & Earned Certificates Grid */}
              <div className="space-y-4 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Your Earned Credentials ({certificates.length})</span>
                  </span>

                  {/* Filter by Category */}
                  <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                    {["ALL", "INTERNSHIP", "HACKATHON", "COURSE", "PROJECT"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setFilterType(f);
                          setSelectedCertIndex(0);
                        }}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          filterType === f
                            ? "bg-blue-600 text-white font-bold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {f === "ALL" ? "All Types" : f}
                      </button>
                    ))}
                  </div>
                </div>

                {certificates.length === 0 ? (
                  /* LOCKED / EMPTY STATE */
                  <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4 max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                      <Award className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white">No Certificates Issued Yet</h3>
                      <p className="text-xs text-slate-400">
                        Complete your enrolled internship tracks or hackathon rounds below to automatically unlock your tamper-proof credentials.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* CERTIFICATES SELECTOR CAROUSEL / CARDS */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCerts.map((c, idx) => {
                      const isSelected = activeCert?.id === c.id || (selectedCertIndex === idx);
                      const certType = (c.metadata?.certificateType || c.type || "INTERNSHIP").toUpperCase();
                      const isWin = certType === "WINNER";
                      
                      return (
                        <div
                          key={c.id || idx}
                          onClick={() => setSelectedCertIndex(idx)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? "bg-gradient-to-b from-blue-950/60 to-slate-900 border-blue-500/80 shadow-lg shadow-blue-500/15 ring-1 ring-blue-500/40"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isWin
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : certType.includes("ROUND")
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                            }`}>
                              {certType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {formatDate(c.issueDate)}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">
                            {c.eventName || c.metadata?.internshipTitle || c.metadata?.courseName || c.title}
                          </h4>
                          <div className="text-[11px] font-mono text-cyan-400 font-semibold truncate">
                            {c.certificateNo}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Certificate Preview Canvas & Actions */}
              {activeCertData && (
                <div className="space-y-4">
                  {/* Action Header */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">
                          {activeCertData.eventName || activeCertData.internshipTitle || "Official Certificate"}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                          VERIFIED ✓
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        ID: <strong className="text-cyan-400">{activeCertData.certificateId}</strong> • Issued on {activeCertData.issueDate}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyPublicLink(activeCertData.certificateId)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                        <span>{copiedLink ? "Link Copied!" : "Copy Verify Link"}</span>
                      </button>

                      <Link
                        href={`/verify/${encodeURIComponent(activeCertData.certificateId)}`}
                        target="_blank"
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        <span>Public View</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Save PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* High Resolution Official Certificate Rendering */}
                  <div className="overflow-x-auto p-3 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 flex justify-center shadow-2xl">
                    <OfficialCertificate data={activeCertData} />
                  </div>
                </div>
              )}

              {/* Milestone Completion & Claiming Center */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>Claim Eligible Milestone Certificates</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Finished an internship track, hackathon round, or course? Claim your instant cryptographic credential below.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AVAILABLE_MILESTONES.map((m) => {
                    const isClaiming = claimingId === m.id;
                    const alreadyEarned = certificates.some(
                      (c) => (c.eventName === m.eventName || c.metadata?.internshipTitle === m.title) &&
                             (c.metadata?.certificateType === m.type || c.type === m.type)
                    );

                    return (
                      <div
                        key={m.id}
                        className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-extrabold uppercase">
                              {m.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{m.domain}</span>
                          </div>

                          <h4 className="text-xs font-bold text-white leading-tight">
                            {m.title}
                          </h4>

                          <p className="text-[11px] text-slate-400">
                            {m.eventName}
                          </p>

                          {m.technologies && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {m.technologies.slice(0, 3).map((t, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[9px] text-slate-300">
                                  {t}
                                </span>
                              ))}
                              {m.technologies.length > 3 && (
                                <span className="px-1.5 py-0.5 text-[9px] text-slate-500">
                                  +{m.technologies.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          {alreadyEarned ? (
                            <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Earned in Wallet</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleClaimCertificate(m)}
                              disabled={isClaiming}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              {isClaiming ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Generating Credential...</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-4 h-4" />
                                  <span>Claim Certificate</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* OFFER LETTERS TAB */
            <div className="space-y-6">
              {/* Role Track Selector Bar */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Select Internship Track for Official Offer Letter:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType("OFFER_LETTER");
                      setModalOpen(true);
                    }}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize Letter</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ROLE_TEMPLATES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                        }`}
                      >
                        <span>{r.roleTitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Offer Letter Action Bar */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div>
                  <h3 className="text-base font-black text-white">
                    {currentRole.roleTitle} — Official Offer Letter
                  </h3>
                  <p className="text-xs text-blue-400 font-semibold">
                    Stipend: {currentRole.defaultStipend} • Duration: 3 Months • Mode: {currentRole.workMode}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType("OFFER_LETTER");
                      setModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Fullscreen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* Offer Letter Preview Canvas */}
              <div className="overflow-x-auto p-4 sm:p-8 bg-slate-950 rounded-3xl border border-slate-800 flex justify-center shadow-2xl">
                <OfficialOfferLetter data={activeOfferDocData} />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Document Fullscreen / Customizer Modal */}
      <DocumentViewerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={modalType}
        initialData={{ roleId: selectedRole }}
      />
    </div>
  );
}
