"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Award, 
  Sliders, 
  RefreshCw, 
  Share2, 
  ExternalLink, 
  Check, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { OfficialOfferLetter } from "./OfficialOfferLetter";
import { OfficialCertificate } from "./OfficialCertificate";
import { 
  DocumentData, 
  DEFAULT_DOCUMENT_DATA, 
  ROLE_TEMPLATES, 
  getRoleTemplate 
} from "@/lib/document-templates";
import { useToast } from "@/components/providers/ToastProvider";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: "OFFER_LETTER" | "CERTIFICATE";
  initialData?: Partial<DocumentData>;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  initialType = "CERTIFICATE",
  initialData,
}: DocumentViewerModalProps) {
  const { success, toast } = useToast();
  const [docData, setDocData] = useState<DocumentData>({
    ...DEFAULT_DOCUMENT_DATA,
    documentType: initialType,
    ...(initialData || {}),
  });

  const [activeTab, setActiveTab] = useState<"OFFER_LETTER" | "CERTIFICATE">(
    initialType || "CERTIFICATE"
  );
  const [showCustomizer, setShowCustomizer] = useState(false);

  if (!isOpen) return null;

  const currentRole = getRoleTemplate(docData.roleId);

  const handlePrint = () => {
    toast("Opening high-resolution print & PDF generator...", "info");
    window.print();
  };

  const handleShareLink = () => {
    const link = `${window.location.origin}/verify/${docData.certificateId}`;
    navigator.clipboard.writeText(link);
    success("Official verification link copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      
      {/* Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-6xl bg-[#090E1A] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden"
      >
        {/* Top Control Bar */}
        <div className="px-5 py-4 bg-[#0D1527] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Document Type Switcher */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("CERTIFICATE");
                  setDocData((prev) => ({ ...prev, documentType: "CERTIFICATE" }));
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "CERTIFICATE"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificate (Landscape)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("OFFER_LETTER");
                  setDocData((prev) => ({ ...prev, documentType: "OFFER_LETTER" }));
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "OFFER_LETTER"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Offer Letter (Portrait A4)</span>
              </button>
            </div>

            {/* Quick Role Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Role:</span>
              <span className="font-bold text-blue-400">{currentRole.roleTitle}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
                showCustomizer
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Change Role & Details</span>
            </button>

            {activeTab === "CERTIFICATE" && (
              <button
                type="button"
                onClick={handleShareLink}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customizer Drawer (Toggleable) */}
        <AnimatePresence>
          {showCustomizer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0c1426] border-b border-slate-800 p-5 text-xs text-slate-200 overflow-hidden"
            >
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-sm">Dynamic Role & Content Customizer</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Content adapts dynamically based on role</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Role Selector */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Select Role Track</label>
                    <select
                      value={docData.roleId}
                      onChange={(e) => setDocData({ ...docData, roleId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                    >
                      {ROLE_TEMPLATES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roleTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Name */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Recipient / Student Name</label>
                    <input
                      type="text"
                      value={docData.studentName}
                      onChange={(e) => setDocData({ ...docData, studentName: e.target.value })}
                      placeholder="e.g. Arun Kumar"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Candidate ID */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Candidate ID</label>
                    <input
                      type="text"
                      value={docData.candidateId}
                      onChange={(e) => setDocData({ ...docData, candidateId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Issue Date</label>
                    <input
                      type="text"
                      value={docData.issueDate}
                      onChange={(e) => setDocData({ ...docData, issueDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Internship Start Date</label>
                    <input
                      type="text"
                      value={docData.startDate}
                      onChange={(e) => setDocData({ ...docData, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Internship End Date</label>
                    <input
                      type="text"
                      value={docData.endDate}
                      onChange={(e) => setDocData({ ...docData, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Stipend */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Stipend Details</label>
                    <input
                      type="text"
                      value={docData.customStipend || currentRole.defaultStipend}
                      onChange={(e) => setDocData({ ...docData, customStipend: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Work Mode */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Work Mode</label>
                    <select
                      value={docData.customWorkMode || currentRole.workMode}
                      onChange={(e) => setDocData({ ...docData, customWorkMode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Canvas Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#070B14] flex items-center justify-center">
          <div className="transform origin-top transition-all duration-300 shadow-2xl">
            {activeTab === "OFFER_LETTER" ? (
              <OfficialOfferLetter data={docData} />
            ) : (
              <OfficialCertificate data={docData} />
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
