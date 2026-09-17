"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OfficialOfferLetter } from "@/components/certificates/OfficialOfferLetter";
import { DocumentViewerModal } from "@/components/certificates/DocumentViewerModal";
import { 
  FileText, 
  Printer, 
  Sparkles, 
  Maximize2,
  Award,
  Loader2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { DocumentData } from "@/lib/document-templates";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function MyOfferLettersPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollmentIndex, setSelectedEnrollmentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async () => {
    try {
      const res = await fetch("/api/projects/enrollment/history");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching project enrollments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const selectedEnr = enrollments.length > 0 ? (enrollments[selectedEnrollmentIndex] || enrollments[0] || null) : null;

  const activeOfferDocData: DocumentData | null = selectedEnr ? {
    documentType: "OFFER_LETTER",
    roleId: selectedEnr.projectId || "project",
    studentName: user?.name || "Verified Candidate",
    candidateId: user?.userId ? `SCT-STU-${user.userId.slice(0, 6).toUpperCase()}` : "SCT-STU-2026-089",
    offerId: `SCT-OFFER-2026-${(selectedEnr.id || "ENR").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`,
    certificateId: selectedEnr.certificateId || "PENDING_COMPLETION",
    issueDate: selectedEnr.startDate ? formatDate(selectedEnr.startDate) : formatDate(new Date()),
    startDate: selectedEnr.startDate ? formatDate(selectedEnr.startDate) : formatDate(new Date()),
    endDate: selectedEnr.deadline ? formatDate(selectedEnr.deadline) : formatDate(new Date(Date.now() + 60 * 86400000)),
    customStipend: selectedEnr.stipendAmount ? `Performance-Based / Up to ₹${selectedEnr.stipendAmount.toLocaleString()}` : "Performance-Based / Up to ₹5,000",
    customDepartment: selectedEnr.projectCategory || "Engineering & Software Architecture",
    customMentor: "SC TECH Technical Mentorship Board",
    customWorkMode: "Remote",
  } : null;

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Internship Entitlements</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 mt-2">
                <FileText className="w-7 h-7 text-blue-400" />
                <span>Internship Offer Letters</span>
              </h1>
              <p className="text-xs text-slate-400">
                Official SC TECH verified internship appointment letters for your active and enrolled project tracks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/my-certificates"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition shadow-md"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Certificate Wallet</span>
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Loading your official internship offer letters...</span>
            </div>
          ) : enrollments.length === 0 ? (
            /* EMPTY / UNENROLLED STATE */
            <div className="p-10 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4 max-w-2xl mx-auto my-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">No Internship Offer Letters Available</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Official internship offer letters are generated exclusively upon purchasing and enrolling in a verified Real-World Project track.
                </p>
              </div>
              <div className="pt-3">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition"
                >
                  <span>Explore Real-World Projects</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Role Track Selector Bar for Enrolled Tracks */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Your Enrolled Project Tracks ({enrollments.length}):</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {enrollments.map((enr, idx) => {
                    const isSelected = selectedEnrollmentIndex === idx;
                    return (
                      <button
                        key={enr.id || idx}
                        type="button"
                        onClick={() => setSelectedEnrollmentIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                        }`}
                      >
                        <span>{enr.projectTitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Offer Letter Action Card & Canvas */}
              {activeOfferDocData && (
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:hidden">
                    <div>
                      <h3 className="text-base font-black text-white">
                        {selectedEnr?.projectTitle} — Official Offer Letter
                      </h3>
                      <p className="text-xs text-blue-400 font-semibold">
                        Stipend: {activeOfferDocData.customStipend} • Duration: {selectedEnr?.durationMonths || 2} Months • Mode: Remote
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Fullscreen View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Save PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Offer Letter Canvas */}
                  <div className="overflow-x-auto p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-center shadow-2xl">
                    <OfficialOfferLetter data={activeOfferDocData} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal */}
          {activeOfferDocData && (
            <DocumentViewerModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              initialType="OFFER_LETTER"
              initialData={activeOfferDocData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
