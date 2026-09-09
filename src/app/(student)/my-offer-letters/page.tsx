"use client";

import React, { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OfficialOfferLetter } from "@/components/certificates/OfficialOfferLetter";
import { DocumentViewerModal } from "@/components/certificates/DocumentViewerModal";
import { 
  FileText, 
  Printer, 
  Sliders, 
  Sparkles, 
  Maximize2,
  CheckCircle2,
  Award
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  ROLE_TEMPLATES, 
  getRoleTemplate, 
  DocumentData 
} from "@/lib/document-templates";
import Link from "next/link";

export default function MyOfferLettersPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("fullstack");
  const [modalOpen, setModalOpen] = useState(false);

  const currentRole = getRoleTemplate(selectedRole);

  const activeDocData: DocumentData = {
    documentType: "OFFER_LETTER",
    roleId: selectedRole,
    studentName: user?.name || "Your Name Here",
    candidateId: user?.userId ? `SCT-STU-${user.userId.slice(0, 6).toUpperCase()}` : "SCT-STU-2026-089",
    offerId: `SCT-OFFER-2026-${(user?.userId || "000123").slice(0, 6).toUpperCase()}`,
    certificateId: `SCT-CERT-2026-${(user?.userId || "000789").slice(0, 6).toUpperCase()}`,
    issueDate: "09 September 2026",
    startDate: "15 September 2026",
    endDate: "15 December 2026",
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                <FileText className="w-7 h-7 text-blue-400" />
                <span>Internship Offer Letters</span>
              </h1>
              <p className="text-xs text-slate-400">
                Official SC TECH verified internship opportunity letter and appointment credentials.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/my-certificates"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>View Certificates</span>
              </Link>
            </div>
          </div>

          {/* Role Track Selector Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Select Internship Track:</span>
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize Offer Details</span>
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {r.roleTitle}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canvas Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">
                  Official Internship Offer Letter (A4 Portrait)
                </h3>
                <p className="text-xs text-blue-400">
                  Role: {currentRole.roleTitle} • {currentRole.department}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
            <div className="overflow-x-auto p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-center">
              <OfficialOfferLetter data={activeDocData} />
            </div>
          </div>

          {/* Modal */}
          <DocumentViewerModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            initialType="OFFER_LETTER"
            initialData={activeDocData}
          />
        </main>
      </div>
    </div>
  );
}
