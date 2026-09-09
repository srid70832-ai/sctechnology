"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  ArrowLeft, 
  RotateCw, 
  Search, 
  ExternalLink, 
  Loader2, 
  Flame, 
  Eye, 
  EyeOff, 
  Trash2, 
  Globe, 
  Calendar, 
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase";
import { DiscoveredInternship, DiscoveryStats } from "@/lib/gemini-discovery";
import { formatISTDate } from "@/lib/platform-models";

export default function AdminInternshipsDiscoveryPage() {
  const { success, error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [internships, setInternships] = useState<DiscoveredInternship[]>([]);
  const [telemetry, setTelemetry] = useState<DiscoveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/internships/discovery?limit=100", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setInternships(data.internships || []);
        if (data.telemetry) setTelemetry(data.telemetry);
      } else {
        error("Failed to load discovered internships");
      }
    } catch {
      error("Network error loading internships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  // Trigger Gemini AI Discovery Now
  const handleFetchNow = async () => {
    setFetching(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/internships/discovery", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Internship discovery completed successfully!");
        loadData();
      } else {
        error(data.error || "Discovery run failed");
      }
    } catch {
      error("Network error during discovery");
    } finally {
      setFetching(false);
    }
  };

  // Action: Approve or Reject
  const handleStatusAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/internships/discovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        const newStatus = action === "APPROVE" ? "PUBLISHED" : "REJECTED";
        setInternships((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus as any, isActive: action === "APPROVE" } : item))
        );
        success(action === "APPROVE" ? "Internship approved & published to students!" : "Internship rejected.");
      }
    } catch {
      error("Failed to update status");
    }
  };

  // Action: Feature Toggle
  const handleToggleFeature = async (item: DiscoveredInternship) => {
    const newFeatured = !item.featured;
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/internships/discovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: item.id, action: "FEATURE", featured: newFeatured }),
      });
      if (res.ok) {
        setInternships((prev) =>
          prev.map((o) => (o.id === item.id ? { ...o, featured: newFeatured } : o))
        );
        success(newFeatured ? "Marked as Featured" : "Unmarked Featured");
      }
    } catch {
      error("Failed to toggle feature");
    }
  };

  // Action: Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this internship?")) return;
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch(`/api/admin/internships/discovery?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setInternships((prev) => prev.filter((o) => o.id !== id));
        success("Internship deleted");
      }
    } catch {
      error("Failed to delete internship");
    }
  };

  const filteredInternships = internships.filter((item) => {
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchComp = item.company?.toLowerCase().includes(q);
      const matchSkills = item.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchComp && !matchSkills) return false;
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Automatic Internship Discovery Engine</h1>
              <p className="text-sm text-slate-400">
                Powered by Gemini 3.6 Flash • Target 5 Real-World Internships Daily • Zero Hallucinations
              </p>
            </div>
          </div>
        </div>

        {/* Fetch Now Trigger Button */}
        <button
          onClick={handleFetchNow}
          disabled={fetching}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {fetching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Verifying...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4" /> Fetch Internships Now (5 Daily)
            </>
          )}
        </button>
      </div>

      {/* Daily Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Today's Added</span>
          <span className="text-2xl font-bold text-emerald-400">
            {telemetry?.todayInternships ?? 0} / 5
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Pending Review</span>
          <span className="text-2xl font-bold text-amber-400">
            {telemetry?.pendingInternships ?? 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Published</span>
          <span className="text-2xl font-bold text-blue-400">
            {telemetry?.publishedInternships ?? 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Rejected</span>
          <span className="text-2xl font-bold text-rose-400">
            {telemetry?.rejectedInternships ?? 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Expired</span>
          <span className="text-2xl font-bold text-slate-400">
            {telemetry?.expiredInternships ?? 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Last Automatic Fetch</span>
          <span className="text-xs font-semibold text-slate-300 block truncate">
            {telemetry?.lastFetchAt ? formatISTDate(telemetry.lastFetchAt) : "Pending"}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, or skills..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {["ALL", "PENDING_REVIEW", "PUBLISHED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-lg font-medium transition ${
                statusFilter === st ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {st === "ALL" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Internships Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-400" />
            <p className="text-sm">Loading discovered internships...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No internships match the criteria</p>
            <p className="text-xs text-slate-600 mt-1">Click "Fetch Internships Now" to ingest real-world opportunities</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Opportunity</th>
                  <th className="px-4 py-4">Category & Mode</th>
                  <th className="px-4 py-4">Source & Verification</th>
                  <th className="px-4 py-4">Stipend & Deadline</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInternships.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="min-w-0 max-w-sm">
                        <div className="font-semibold text-white truncate flex items-center gap-2">
                          {item.title}
                          {item.featured && <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {item.company} • {item.location}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.skills?.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1 block w-fit">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400 block">{item.workMode}</span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {item.sourceName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          By: {item.fetchedBy}
                        </span>
                        {item.applicationUrl && (
                          <a
                            href={item.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[11px] text-slate-400 hover:text-white transition mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Original Link
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                      <div className="font-semibold text-emerald-400">
                        {item.stipend || "Competitive"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.deadline ? `Deadline: ${formatISTDate(item.deadline)}` : "Rolling application"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== "PUBLISHED" && (
                          <button
                            onClick={() => handleStatusAction(item.id, "APPROVE")}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                            title="Approve & Publish to Students"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {item.status !== "REJECTED" && (
                          <button
                            onClick={() => handleStatusAction(item.id, "REJECT")}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                            title="Reject Opportunity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleFeature(item)}
                          className={`p-1.5 rounded-lg border transition ${
                            item.featured
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                              : "text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700"
                          }`}
                          title="Toggle Featured"
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
