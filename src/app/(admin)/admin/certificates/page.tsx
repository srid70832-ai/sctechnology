"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Award, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Copy, 
  Check, 
  Printer, 
  ExternalLink, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  X,
  Sparkles,
  Trophy,
  Calendar,
  User,
  Layers,
  FileCheck
} from "lucide-react";
import { OfficialCertificate } from "@/components/certificates/OfficialCertificate";
import { CertificateType, WinnerPosition } from "@/lib/certificate-system";
import { formatDate } from "@/lib/utils";

interface CertificateRecord {
  id: string;
  certificateNo: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  type: string;
  eventName: string;
  issueDate: string;
  status: "VERIFIED" | "REVOKED";
  verificationToken?: string;
  metadata?: any;
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [viewingCert, setViewingCert] = useState<CertificateRecord | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Manual Issuance Form State
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    studentId: "",
    type: "INTERNSHIP" as CertificateType,
    eventName: "",
    roundNumber: 1,
    winnerPosition: "Winner" as WinnerPosition,
    internshipTitle: "",
    companyName: "SC TECH",
    projectName: "",
    projectDomain: "Full-Stack Web Development",
    technologies: "Next.js, TypeScript, Tailwind CSS, PostgreSQL",
    courseName: "",
    courseProvider: "SC TECH Academy",
    duration: "12 Weeks (480 Hours)",
    issueDate: new Date().toISOString().split("T")[0],
  });

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/certificates");
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRevoke = async (cert: CertificateRecord) => {
    const reason = window.prompt(
      `Are you sure you want to revoke certificate ${cert.certificateNo} for ${cert.studentName}?\n\nPlease enter revocation reason:`,
      "Revoked by SC TECH Administration due to policy violation or data correction"
    );
    if (!reason) return;

    setActionLoadingId(cert.id);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVOKE_CERTIFICATE",
          certificateId: cert.id,
          reason,
        }),
      });

      if (res.ok) {
        await fetchCertificates();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to revoke certificate");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while revoking");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReissue = async (cert: CertificateRecord) => {
    if (!window.confirm(`Restore and re-validate certificate ${cert.certificateNo}?`)) return;

    setActionLoadingId(cert.id);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REISSUE_CERTIFICATE",
          certificateId: cert.id,
        }),
      });

      if (res.ok) {
        await fetchCertificates();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to reissue certificate");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while restoring");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleManualIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.eventName.trim()) {
      alert("Student Name and Event/Track Name are required.");
      return;
    }

    setSubmittingIssue(true);
    try {
      const techArray = formData.technologies
        ? formData.technologies.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;

      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_CERTIFICATE",
          type: formData.type,
          studentName: formData.studentName.trim(),
          studentEmail: formData.studentEmail.trim() || undefined,
          studentId: formData.studentId.trim() || undefined,
          eventName: formData.eventName.trim(),
          roundNumber: formData.type === "ROUND_1" ? 1 : formData.type === "ROUND_2" ? 2 : undefined,
          winnerPosition: formData.type === "WINNER" ? formData.winnerPosition : undefined,
          internshipTitle: formData.type === "INTERNSHIP" ? (formData.internshipTitle.trim() || formData.eventName.trim()) : undefined,
          companyName: formData.companyName.trim() || "SC TECH",
          projectName: formData.type === "PROJECT" ? (formData.projectName.trim() || formData.eventName.trim()) : undefined,
          projectDomain: formData.projectDomain.trim() || undefined,
          technologies: techArray,
          courseName: formData.type === "COURSE" ? (formData.courseName.trim() || formData.eventName.trim()) : undefined,
          courseProvider: formData.courseProvider.trim() || "SC TECH Academy",
          duration: formData.duration.trim() || undefined,
          issueDate: formData.issueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue certificate");
      }

      alert(`Certificate ${data.certificate?.certificateNo} generated successfully!`);
      setIsIssueModalOpen(false);
      await fetchCertificates();
    } catch (err: any) {
      alert(err.message || "Failed to create certificate");
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Filtered List
  const filteredCerts = certificates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      c.studentName?.toLowerCase().includes(q) ||
      c.studentEmail?.toLowerCase().includes(q) ||
      c.certificateNo?.toLowerCase().includes(q) ||
      c.eventName?.toLowerCase().includes(q);

    const cType = (c.metadata?.certificateType || c.type || "").toUpperCase();
    const matchType = typeFilter === "ALL" || cType === typeFilter;

    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  // Metrics
  const totalCount = certificates.length;
  const verifiedCount = certificates.filter((c) => c.status === "VERIFIED").length;
  const revokedCount = certificates.filter((c) => c.status === "REVOKED").length;
  const winnerCount = certificates.filter((c) => (c.metadata?.certificateType || c.type) === "WINNER").length;
  const internshipCount = certificates.filter((c) => (c.metadata?.certificateType || c.type) === "INTERNSHIP").length;

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Certificate Management & Registry</h1>
              <p className="text-xs text-slate-400">Cryptographic authenticity verification, audit records and manual issuance.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCertificates}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            title="Refresh list"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsIssueModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Certificate</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Registered</span>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <span className="text-[10px] text-slate-500">All Time Issued</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400">Active & Verified</span>
          <div className="text-2xl font-black text-white">{verifiedCount}</div>
          <span className="text-[10px] text-emerald-500/80">Tamper-Proof ✓</span>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-red-400">Revoked</span>
          <div className="text-2xl font-black text-white">{revokedCount}</div>
          <span className="text-[10px] text-red-400/80">Invalidated</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-amber-400">Excellence & Winners</span>
          <div className="text-2xl font-black text-white">{winnerCount}</div>
          <span className="text-[10px] text-amber-500/80">Gold Laurel</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-blue-400">Internship Tracks</span>
          <div className="text-2xl font-black text-white">{internshipCount}</div>
          <span className="text-[10px] text-blue-400/80">Industry Verified</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student, ID, or track..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Certificate Types</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="ROUND_1">Round 1 Qualifier</option>
            <option value="ROUND_2">Round 2 Finalist</option>
            <option value="WINNER">Winner Excellence</option>
            <option value="PARTICIPATION">Participation</option>
            <option value="COURSE">Course Completion</option>
            <option value="PROJECT">Project Completion</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="REVOKED">Revoked Only</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs">Loading certificate registry...</span>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No certificates found</h3>
            <p className="text-xs text-slate-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-4">Certificate ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Event / Track</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCerts.map((c) => {
                  const certType = (c.metadata?.certificateType || c.type || "INTERNSHIP").toUpperCase();
                  const isWin = certType === "WINNER";
                  const isRevoked = c.status === "REVOKED";
                  const isLoadingAction = actionLoadingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition">
                      
                      {/* ID with Copy */}
                      <td className="p-4 font-mono font-bold text-cyan-400">
                        <div className="flex items-center gap-1.5">
                          <span>{c.certificateNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.certificateNo, c.id)}
                            className="text-slate-500 hover:text-slate-300 transition"
                            title="Copy ID"
                          >
                            {copiedId === c.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="p-4">
                        <div className="font-bold text-white">{c.studentName}</div>
                        {c.studentEmail && (
                          <div className="text-[11px] text-slate-400 font-mono">{c.studentEmail}</div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isWin
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : certType.includes("ROUND")
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}>
                          {certType}
                        </span>
                        {c.metadata?.winnerPosition && (
                          <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                            ★ {c.metadata.winnerPosition}
                          </div>
                        )}
                      </td>

                      {/* Event / Track */}
                      <td className="p-4">
                        <div className="font-medium text-slate-200 line-clamp-1">
                          {c.eventName || c.metadata?.internshipTitle || c.metadata?.courseName}
                        </div>
                        {c.metadata?.companyName && (
                          <div className="text-[10px] text-slate-500">{c.metadata.companyName}</div>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="p-4 text-slate-400 font-mono">
                        {formatDate(c.issueDate)}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {isRevoked ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-extrabold uppercase">
                            REVOKED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                            VERIFIED ✓
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal */}
                          <button
                            type="button"
                            onClick={() => setViewingCert(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Preview Certificate"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {/* Public Verify URL */}
                          <Link
                            href={`/verify/${encodeURIComponent(c.certificateNo)}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Public Verification Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                          </Link>

                          {/* Revoke / Reissue */}
                          {isRevoked ? (
                            <button
                              type="button"
                              disabled={isLoadingAction}
                              onClick={() => handleReissue(c)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              {isLoadingAction ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                              <span>Reissue</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isLoadingAction}
                              onClick={() => handleRevoke(c)}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              {isLoadingAction ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANUAL ISSUANCE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Issue Official Certificate</h3>
                  <p className="text-xs text-slate-400">Direct server-side generation with cryptographic verification seal.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualIssue} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Recipient Student Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sridharan / Charudeshna"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Student Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Student Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={formData.studentEmail}
                    onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Certificate Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Certificate Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CertificateType })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="INTERNSHIP">Internship Completion</option>
                    <option value="ROUND_1">Round 1 Completion</option>
                    <option value="ROUND_2">Round 2 Completion</option>
                    <option value="WINNER">Winner Excellence (Gold Laurel)</option>
                    <option value="PARTICIPATION">Participation</option>
                    <option value="COURSE">Course Completion</option>
                    <option value="PROJECT">Project Completion</option>
                  </select>
                </div>

                {/* Event / Track Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Event / Program Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full-Stack Web Development Track"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Conditional: Winner Position */}
              {formData.type === "WINNER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-300">Winner Position</label>
                    <select
                      value={formData.winnerPosition}
                      onChange={(e) => setFormData({ ...formData, winnerPosition: e.target.value as WinnerPosition })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-amber-200"
                    >
                      <option value="Winner">Winner</option>
                      <option value="1st Prize">1st Prize</option>
                      <option value="2nd Prize">2nd Prize</option>
                      <option value="3rd Prize">3rd Prize</option>
                      <option value="Special Recognition">Special Recognition</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Technologies / Domain Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Technologies (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="React, Node.js, Python, AWS"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Duration / Workload</label>
                  <input
                    type="text"
                    placeholder="12 Weeks (480 Hours)"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Organization and Leadership Note */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Institutional Authority & Leadership Signatures:</span>
                </div>
                <p>
                  Official certificates will automatically render with <strong>Charudeshna (Founder)</strong> and <strong>Sridharan (Co-Founder)</strong> authorized signatures and dynamic verification QR code.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {submittingIssue ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Credential...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Generate & Issue Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW CERTIFICATE MODAL */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">{viewingCert.studentName} — {viewingCert.certificateNo}</h3>
                <p className="text-xs text-slate-400 font-mono">Issued {formatDate(viewingCert.issueDate)} • Status: {viewingCert.status}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-center">
              <OfficialCertificate
                data={{
                  certificateType: (viewingCert.metadata?.certificateType || viewingCert.type || "INTERNSHIP") as CertificateType,
                  studentName: viewingCert.studentName,
                  certificateId: viewingCert.certificateNo,
                  issueDate: formatDate(viewingCert.issueDate),
                  eventName: viewingCert.eventName || viewingCert.metadata?.eventName,
                  roundNumber: viewingCert.metadata?.roundNumber,
                  winnerPosition: viewingCert.metadata?.winnerPosition,
                  internshipTitle: viewingCert.metadata?.internshipTitle || viewingCert.eventName,
                  companyName: viewingCert.metadata?.companyName || "SC TECH",
                  startDate: viewingCert.metadata?.startDate,
                  endDate: viewingCert.metadata?.endDate,
                  completionDate: viewingCert.metadata?.completionDate,
                  projectName: viewingCert.metadata?.projectName,
                  projectDomain: viewingCert.metadata?.projectDomain,
                  technologies: viewingCert.metadata?.technologies,
                  courseName: viewingCert.metadata?.courseName || viewingCert.eventName,
                  courseProvider: viewingCert.metadata?.courseProvider || "SC TECH",
                  duration: viewingCert.metadata?.duration,
                  skills: viewingCert.metadata?.skills,
                  verificationCode: viewingCert.verificationToken || viewingCert.metadata?.verificationCode,
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
