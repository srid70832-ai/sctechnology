"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, doc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  SearchQueryItem, 
  DiscoveryRunItem, 
  getSearchQueries, 
  addSearchQuery, 
  deleteSearchQuery 
} from "@/lib/internship-discovery";
import { 
  Compass, 
  ArrowLeft, 
  Zap, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Layers, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Briefcase
} from "lucide-react";

export default function AdminInternshipDiscoveryPage() {
  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [queries, setQueries] = useState<SearchQueryItem[]>([]);
  const [runs, setRuns] = useState<DiscoveryRunItem[]>([]);
  const [stats, setStats] = useState({
    totalDiscovered: 0,
    pendingReview: 0,
    published: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [runningDiscovery, setRunningDiscovery] = useState(false);

  // New query input
  const [newQueryText, setNewQueryText] = useState("");
  const [newCategory, setNewCategory] = useState("Full Stack");
  const [addingQuery, setAddingQuery] = useState(false);

  const loadData = async () => {
    try {
      // 1. Queries
      const qList = await getSearchQueries();
      setQueries(qList);

      // 2. Runs history
      const runsSnap = await getDocs(query(collection(db, "discoveryRuns"), orderBy("runAt", "desc"), limit(5)));
      const runList: DiscoveryRunItem[] = [];
      runsSnap.forEach((d) => {
        runList.push({ id: d.id, ...d.data() } as DiscoveryRunItem);
      });
      setRuns(runList);

      // 3. Internships count
      const internSnap = await getDocs(collection(db, "internships"));
      let pending = 0;
      let pub = 0;
      let rej = 0;

      internSnap.forEach((d) => {
        const item = d.data();
        if (item.status === "PENDING_REVIEW") pending++;
        else if (item.status === "PUBLISHED") pub++;
        else if (item.status === "REJECTED") rej++;
      });

      setStats({
        totalDiscovered: internSnap.size,
        pendingReview: pending,
        published: pub,
        rejected: rej,
      });
    } catch (err) {
      console.error("Error loading discovery dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunDiscovery = async () => {
    setRunningDiscovery(true);
    try {
      const res = await fetch("/api/internships/discover", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Discovery completed successfully!");
        await loadData();
      } else {
        error(data.error || "Failed to run discovery");
      }
    } catch {
      error("Discovery network error");
    } finally {
      setRunningDiscovery(false);
    }
  };

  const handleAddQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueryText.trim()) return;

    setAddingQuery(true);
    try {
      const ok = await addSearchQuery(newQueryText, newCategory);
      if (ok) {
        success("Search query added!");
        setNewQueryText("");
        const updated = await getSearchQueries();
        setQueries(updated);
      }
    } catch {
      error("Failed to add search query");
    } finally {
      setAddingQuery(false);
    }
  };

  const handleDeleteQuery = async (id: string) => {
    try {
      const ok = await deleteSearchQuery(id);
      if (ok) {
        setQueries(queries.filter((q) => q.id !== id));
        success("Query deleted");
      }
    } catch {
      error("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Compass className="w-7 h-7 text-blue-400" />
            <span>Automatic Internship Discovery Engine</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated crawler collecting, deduplicating, and staging real tech internships for admin approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/internships/discovered"
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Review Queue ({stats.pendingReview})</span>
          </Link>

          <button
            onClick={handleRunDiscovery}
            disabled={runningDiscovery}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {runningDiscovery ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Discovery Engine...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Run Discovery Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Discovered</span>
          <div className="text-3xl font-black text-white">{stats.totalDiscovered}</div>
          <p className="text-[11px] text-slate-500">From verified career sources</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/30 space-y-1">
          <span className="text-xs font-semibold text-amber-400">Pending Review</span>
          <div className="text-3xl font-black text-amber-300">{stats.pendingReview}</div>
          <p className="text-[11px] text-amber-400/80">Requires admin approval</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
          <span className="text-xs font-semibold text-emerald-400">Published to Students</span>
          <div className="text-3xl font-black text-emerald-300">{stats.published}</div>
          <p className="text-[11px] text-emerald-400/80">Live on /internships</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-rose-400">Rejected / Filtered</span>
          <div className="text-3xl font-black text-rose-300">{stats.rejected}</div>
          <p className="text-[11px] text-slate-500">Not displayed to students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Configurable Search Queries */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                <span>Configured Search Targets ({queries.length})</span>
              </h2>
              <p className="text-xs text-slate-400">Queries polled periodically by the automatic discovery runner.</p>
            </div>
          </div>

          {/* Add Query Form */}
          <form onSubmit={handleAddQuery} className="flex gap-2">
            <input
              type="text"
              value={newQueryText}
              onChange={(e) => setNewQueryText(e.target.value)}
              placeholder="e.g. Flutter Mobile App Developer Internship"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Full Stack">Full Stack</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="AI / ML">AI / ML</option>
              <option value="Data Science">Data Science</option>
              <option value="Cloud / DevOps">Cloud / DevOps</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Mobile App">Mobile App</option>
            </select>
            <button
              type="submit"
              disabled={addingQuery}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Queries List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {queries.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-semibold text-slate-200">{q.query}</span>
                  <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-mono">
                    {q.category}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteQuery(q.id!)}
                  className="text-slate-500 hover:text-rose-400 transition p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Discovery Runs Audit History */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Recent Discovery Runs</span>
            </h2>
          </div>

          <div className="space-y-3">
            {runs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No discovery runs executed yet. Click &quot;Run Discovery Now&quot; above.
              </div>
            ) : (
              runs.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {r.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {r.runAt?.toMillis ? new Date(r.runAt.toMillis()).toLocaleString() : "Just now"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/60 text-slate-400">
                    <div>Found: <span className="text-white font-bold">{r.resultsFound}</span></div>
                    <div>New: <span className="text-emerald-400 font-bold">{r.newResults}</span></div>
                    <div>Dupes: <span className="text-slate-300 font-bold">{r.duplicates}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
