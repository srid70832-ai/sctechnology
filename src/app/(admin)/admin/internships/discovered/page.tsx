"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  InternshipItem, 
  getDiscoveredInternships, 
  approveInternship, 
  rejectInternship 
} from "@/lib/internship-discovery";
import { formatINR } from "@/lib/utils";
import { 
  Briefcase, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Globe, 
  Clock, 
  Filter, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  Search,
  Trash2
} from "lucide-react";

export default function AdminDiscoveredReviewPage() {
  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadInternships = async () => {
    setLoading(true);
    try {
      const list = await getDiscoveredInternships(statusFilter);
      setInternships(list);
    } catch (err) {
      console.error("Error loading internships for review:", err);
      error("Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInternships();
  }, [statusFilter]);

  const handleApprove = async (item: InternshipItem) => {
    if (!firebaseUser?.uid || !item.id) return;
    setProcessingId(item.id);
    try {
      const ok = await approveInternship(item.id, firebaseUser.uid);
      if (ok) {
        success(`Approved "${item.title}"! Now live on /internships.`);
        setInternships(internships.map((i) => (i.id === item.id ? { ...i, status: "PUBLISHED" } : i)));
      } else {
        error("Failed to approve internship");
      }
    } catch {
      error("Approval error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: InternshipItem) => {
    if (!firebaseUser?.uid || !item.id) return;
    setProcessingId(item.id);
    try {
      const ok = await rejectInternship(item.id, firebaseUser.uid);
      if (ok) {
        success(`Rejected "${item.title}".`);
        setInternships(internships.map((i) => (i.id === item.id ? { ...i, status: "REJECTED" } : i)));
      } else {
        error("Failed to reject internship");
      }
    } catch {
      error("Rejection error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing permanently?")) return;
    try {
      await deleteDoc(doc(db, "internships", id));
      setInternships(internships.filter((i) => i.id !== id));
      success("Listing deleted");
    } catch {
      error("Failed to delete listing");
    }
  };

  const filteredList = internships.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.companyName?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin/internship-discovery" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery Engine</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-amber-400" />
            <span>Discovered Internships Review Queue</span>
          </h1>
          <p className="text-xs text-slate-400">
            Verify legitimate external tech opportunities before publishing to the student marketplace.
          </p>
        </div>

        <Link
          href="/admin/internship-discovery"
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
        >
          <span>Discovery Dashboard</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {["PENDING_REVIEW", "PUBLISHED", "REJECTED", "ALL"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, or skills..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* List Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading discovered opportunities...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No opportunities in this queue</h3>
          <p className="text-xs text-slate-500">Run the automatic discovery crawler or switch filter tabs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredList.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Status & Source Header */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                    item.status === "PENDING_REVIEW"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : item.status === "PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    {item.status.replace("_", " ")}
                  </span>

                  <span className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                    <span>Source: {item.sourceName || "Careers"}</span>
                  </span>
                </div>

                {/* Company & Role */}
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{item.title}</h3>
                  <div className="text-xs text-blue-400 font-semibold mt-0.5">
                    {item.companyName} • {item.location} ({item.mode})
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5">
                  {item.skills?.slice(0, 5).map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-300">
                      {sk}
                    </span>
                  ))}
                </div>

                {/* Metadata details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-800 text-slate-400">
                  <div>
                    Stipend: <span className="text-white font-bold">{item.stipend ? formatINR(Number(item.stipend)) : "Not specified"}</span>
                  </div>
                  <div>
                    Duration: <span className="text-white font-bold">{item.duration || "Not specified"}</span>
                  </div>
                </div>

                {/* Original Source URL link */}
                <div className="pt-2">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    <span>View original opportunity</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.status !== "PUBLISHED" && (
                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      disabled={processingId === item.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Approve & Publish</span>
                    </button>
                  )}

                  {item.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => handleReject(item)}
                      disabled={processingId === item.id}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id!)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition rounded-xl"
                  title="Delete Opportunity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
