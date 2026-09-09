"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { PaymentReceiptDocument } from "@/components/documents/PaymentReceiptDocument";
import { StipendLetterDocument } from "@/components/documents/StipendLetterDocument";
import { OfficialCertificate } from "@/components/certificates/OfficialCertificate";
import { 
  FileText, 
  Award, 
  CreditCard, 
  FolderGit2, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  X, 
  Sparkles,
  ShieldCheck,
  Calendar,
  Hash,
  ArrowRight
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function MyDocumentsPage() {
  const { user, firebaseUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"RECEIPTS" | "LETTERS" | "CERTIFICATES" | "PROJECTS">("RECEIPTS");
  const [loading, setLoading] = useState(true);

  const [receipts, setReceipts] = useState<any[]>([]);
  const [letters, setLetters] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [codePackages, setCodePackages] = useState<any[]>([]);

  // Viewer Modal State
  const [activeModalDoc, setActiveModalDoc] = useState<{
    type: "RECEIPT" | "LETTER" | "CERTIFICATE";
    data: any;
  } | null>(null);

  useEffect(() => {
    async function loadDocs() {
      if (!user && !firebaseUser) {
        setLoading(false);
        return;
      }
      try {
        const uid = user?.userId || firebaseUser?.uid;
        const res = await fetch(`/api/student/documents?userId=${uid}`);
        if (res.ok) {
          const json = await res.json();
          setReceipts(json.receipts || []);
          setLetters(json.letters || []);
          setCertificates(json.certificates || []);
          setCodePackages(json.codePackages || []);
        }
      } catch (err) {
        console.error("Error loading documents:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, [user, firebaseUser]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <div className="print:hidden">
        <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="print:hidden">
          <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        </div>

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl w-full mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl print:hidden">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>OFFICIAL SC TECH DOCUMENT VAULT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <FileText className="w-7 h-7 text-blue-400" />
                <span>My Official Documents & Receipts</span>
              </h1>
              <p className="text-xs text-slate-400">
                Authoritative repository for your verified payment receipts, stipend disbursement letters, completion certificates, and project source code archives.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto print:hidden shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTab("RECEIPTS")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "RECEIPTS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Receipts ({receipts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("LETTERS")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "LETTERS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Official Stipend Letters ({letters.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("CERTIFICATES")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "CERTIFICATES"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certificates ({certificates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PROJECTS")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "PROJECTS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Project Code Packages ({codePackages.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Loading official document repository...</span>
            </div>
          ) : activeTab === "RECEIPTS" ? (
            /* PAYMENT RECEIPTS TAB */
            <div className="space-y-4">
              {receipts.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 max-w-xl mx-auto">
                  <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Payment Receipts Yet</h3>
                  <p className="text-xs text-slate-400">
                    Complete your project tasks (6/8 or 8/8) to earn stipends. Once verified and disbursed by administration, your official tax/payment receipts will appear here.
                  </p>
                  <Link
                    href="/my-projects"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold mt-2 hover:bg-blue-500 transition"
                  >
                    <span>View My Projects & Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receipts.map((r, idx) => (
                    <div
                      key={r.receiptId || idx}
                      className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
                            PAID ✓
                          </span>
                          <h4 className="text-sm font-bold text-white mt-2">{r.projectName}</h4>
                          <div className="text-xs font-mono text-cyan-400 font-bold">{r.receiptId}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Disbursed</div>
                          <div className="text-xl font-black text-emerald-400">{formatINR(r.stipendAmount)}</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div>Date: <strong className="text-slate-300">{r.paymentDate}</strong></div>
                        <div>Txn Ref: <span className="font-mono text-slate-400">{r.transactionReference}</span></div>
                        <div>Tasks Approved: <strong className="text-white">{r.approvedTasks} / {r.tasksCompleted}</strong></div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveModalDoc({ type: "RECEIPT", data: r })}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>View Receipt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalDoc({ type: "RECEIPT", data: r });
                            setTimeout(() => window.print(), 300);
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "LETTERS" ? (
            /* OFFICIAL LETTERS TAB */
            <div className="space-y-4">
              {letters.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 max-w-xl mx-auto">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Official Letters Yet</h3>
                  <p className="text-xs text-slate-400">
                    Official achievement letters signed by Charudeshna (Founder) & Sridharan (Co-Founder) are generated upon successful stipend disbursement.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {letters.map((l, idx) => (
                    <div
                      key={l.letterId || idx}
                      className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase">
                            OFFICIAL AWARD LETTER
                          </span>
                          <h4 className="text-sm font-bold text-white mt-2">{l.projectName}</h4>
                          <div className="text-xs font-mono text-cyan-400 font-bold">{l.letterId}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Stipend</div>
                          <div className="text-lg font-black text-emerald-400">{formatINR(l.stipendAmount)}</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div>Issue Date: <strong className="text-slate-300">{l.issueDate}</strong></div>
                        <div>Bill Ref: <span className="font-mono text-blue-400 font-bold">{l.receiptId}</span></div>
                        <div>Tasks Approved: <strong className="text-emerald-400">{l.approvedTasks} / {l.tasksCompleted} Tasks ✓</strong></div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveModalDoc({ type: "LETTER", data: l })}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Read Letter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveModalDoc({ type: "LETTER", data: l });
                            setTimeout(() => window.print(), 300);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "CERTIFICATES" ? (
            /* CERTIFICATES TAB */
            <div className="space-y-4">
              {certificates.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 max-w-xl mx-auto">
                  <Award className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Earned Certificates Yet</h3>
                  <p className="text-xs text-slate-400">
                    Complete an internship track, real-world project, or hackathon challenge to unlock verified credentials.
                  </p>
                  <Link
                    href="/my-certificates"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold mt-2 hover:bg-blue-500 transition"
                  >
                    <span>Go to Certificate Wallet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificates.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase">
                            {c.metadata?.certificateType || c.type || "CERTIFICATE"}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-2">{c.eventName || c.title}</h4>
                          <div className="text-xs font-mono text-cyan-400 font-bold">{c.certificateNo}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                          VERIFIED ✓
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div>Recipient: <strong className="text-white">{c.studentName}</strong></div>
                        <div>Date: <span className="text-slate-300">{formatDate(c.issueDate)}</span></div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/verify/${encodeURIComponent(c.certificateNo)}`}
                          target="_blank"
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          <span>Verify Authenticity</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setActiveModalDoc({ type: "CERTIFICATE", data: c })}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-600/20 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* PROJECT CODE PACKAGES TAB */
            <div className="space-y-4">
              {codePackages.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 max-w-xl mx-auto">
                  <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">No Project Codebases Downloaded</h3>
                  <p className="text-xs text-slate-400">
                    Subscribe to any of our 25 Real-World Projects to download complete source code archives and start assigned engineering tasks.
                  </p>
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold mt-2 hover:bg-blue-500 transition"
                  >
                    <span>Explore 25 Real-World Projects</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {codePackages.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase">
                            SOURCE CODE ACCESS GRANTED
                          </span>
                          <h4 className="text-sm font-bold text-white mt-2">{p.projectTitle || "Real-World Project"}</h4>
                          <div className="text-xs font-mono text-slate-400">ID: {p.projectId}</div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {p.downloadedAt ? formatDate(p.downloadedAt) : "Active"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/my-projects/${p.projectId}`}
                          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-600/20"
                        >
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>Open Task Workspace</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
              <div>
                <h3 className="text-base font-black text-white">
                  {activeModalDoc.type === "RECEIPT" ? "Official Payment Receipt" : activeModalDoc.type === "LETTER" ? "Official Stipend Letter" : "Official Certificate"}
                </h3>
                <p className="text-xs text-slate-400 font-mono">SC TECH Official Institutional Record</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto p-2 sm:p-6 bg-slate-950 rounded-2xl border border-slate-800 flex justify-center shadow-inner">
              {activeModalDoc.type === "RECEIPT" && (
                <PaymentReceiptDocument data={activeModalDoc.data} />
              )}
              {activeModalDoc.type === "LETTER" && (
                <StipendLetterDocument data={activeModalDoc.data} />
              )}
              {activeModalDoc.type === "CERTIFICATE" && (
                <OfficialCertificate
                  data={{
                    certificateType: activeModalDoc.data.metadata?.certificateType || activeModalDoc.data.type || "PROJECT",
                    studentName: activeModalDoc.data.studentName || user?.name || "Verified Student",
                    certificateId: activeModalDoc.data.certificateNo || "SC-PROJ-2026-0001",
                    issueDate: formatDate(activeModalDoc.data.issueDate),
                    eventName: activeModalDoc.data.eventName,
                    projectName: activeModalDoc.data.metadata?.projectName || activeModalDoc.data.eventName,
                    projectDomain: activeModalDoc.data.metadata?.projectDomain || "Software Engineering",
                    technologies: activeModalDoc.data.metadata?.technologies,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
