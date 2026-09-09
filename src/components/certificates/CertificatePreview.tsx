"use client";

import React, { useState } from "react";
import { Download, Award, ShieldCheck, Printer, Maximize2, FileText } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { OfficialCertificate } from "./OfficialCertificate";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { DocumentData } from "@/lib/document-templates";

interface CertificatePreviewProps {
  studentName?: string;
  eventName?: string;
  certificateNo?: string;
  issueDate?: string;
  roleId?: string;
  downloadable?: boolean;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  studentName = "Your Name Here",
  eventName = "Full-Stack Web Development Track",
  certificateNo = "SCT-CERT-2026-000789",
  issueDate = "09 September 2026",
  roleId = "fullstack",
  downloadable = true,
}) => {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"CERTIFICATE" | "OFFER_LETTER">("CERTIFICATE");

  const docData: DocumentData = {
    documentType: modalType,
    roleId: roleId || "fullstack",
    studentName,
    candidateId: "SCT-STU-2026-089",
    offerId: "SCT-OFFER-2026-000123",
    certificateId: certificateNo,
    issueDate,
    startDate: "15 September 2026",
    endDate: "15 December 2026",
  };

  const handlePrint = () => {
    toast(`Preparing official SC TECH certificate for printing...`, "info");
    window.print();
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Certificate Container with Exact Ratio */}
      <div className="w-full overflow-x-auto p-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl flex justify-center">
        <div className="w-full max-w-[960px] transform origin-top">
          <OfficialCertificate data={docData} />
        </div>
      </div>

      {/* Interactive Action Bar */}
      {downloadable && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              setModalType("CERTIFICATE");
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Customize & View Fullscreen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalType("OFFER_LETTER");
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>View Offer Letter Template</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      )}

      {/* Document Modal */}
      <DocumentViewerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={modalType}
        initialData={docData}
      />
    </div>
  );
};

