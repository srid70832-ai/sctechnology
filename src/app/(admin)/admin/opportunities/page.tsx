"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Compass, 
  ArrowLeft, 
  RotateCw, 
  Search, 
  ExternalLink, 
  Loader2, 
  Briefcase, 
  Trophy, 
  Flame, 
  Eye, 
  EyeOff, 
  Trash2, 
  Globe, 
  Calendar, 
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { OpportunityItem } from "@/lib/opportunity-models";
import { formatISTDate } from "@/lib/platform-models";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminOpportunitiesPage() {
  const { success, error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/opportunities?limit=100", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      } else {
        error("Failed to load opportunities");
      }
    } catch {
      error("Network error loading opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/opportunities/sync", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "External feeds synchronized successfully!");
        loadData();
      } else {
        error(data.error || "Sync failed");
      }
    } catch {
      error("Network error during sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleFeature = async (item: OpportunityItem) => {
    const newFeatured = !item.featured;
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/opportunities", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: item.id, featured: newFeatured }),
      });
      if (res.ok) {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === item.id ? { ...o, featured: newFeatured } : o))
        );
        success(newFeatured ? "Marked as Featured" : "Unmarked Featured");
      }
    } catch {
      error("Failed to update feature status");
    }
  };

  const handleToggleVisibility = async (item: OpportunityItem) => {
    const newHidden = !item.hidden;
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/opportunities", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: item.id, hidden: newHidden }),
      });
      if (res.ok) {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === item.id ? { ...o, hidden: newHidden } : o))
        );
        success(newHidden ? "Opportunity Hidden from Public" : "Opportunity Visible to Public");
      }
    } catch {
      error("Failed to update visibility");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this opportunity?")) return;
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch(`/api/admin/opportunities?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setOpportunities((prev) => prev.filter((o) => o.id !== id));
        success("Opportunity deleted");
      }
    } catch {
      error("Failed to delete opportunity");
    }
  };

  const filteredOpportunities = opportunities.filter((item) => {
    if (typeFilter !== "ALL" && item.opportunityType !== typeFilter) return false;
    if (sourceFilter !== "ALL" && item.sourceType !== sourceFilter) return false;
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
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Opportunity Aggregator Control Panel</h1>
              <p className="text-sm text-slate-400">
                Manage internal & external opportunities aggregated from verified career feeds & Devpost
              </p>
            </div>
          </div>
        </div>

        {/* Sync Trigger Button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Ingesting Feeds...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4" /> Sync External Feeds Now
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Opportunities</span>
          <span className="text-2xl font-bold text-white">{opportunities.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Internships</span>
          <span className="text-2xl font-bold text-blue-400">
            {opportunities.filter((o) => o.opportunityType === "INTERNSHIP").length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Hackathons</span>
          <span className="text-2xl font-bold text-amber-400">
            {opportunities.filter((o) => o.opportunityType === "HACKATHON").length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">External Feeds</span>
          <span className="text-2xl font-bold text-purple-400">
            {opportunities.filter((o) => o.sourceType === "EXTERNAL").length}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, company, or skills..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Types</option>
            <option value="INTERNSHIP">Internships</option>
            <option value="HACKATHON">Hackathons</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Sources</option>
            <option value="INTERNAL">SC TECH Internal</option>
            <option value="EXTERNAL">External Sources</option>
          </select>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-400" />
            <p className="text-sm">Loading opportunities inventory...</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No opportunities match the criteria</p>
            <p className="text-xs text-slate-600 mt-1">Try triggering a sync or adjusting filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Opportunity</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Source & Attribution</th>
                  <th className="px-4 py-4">Deadline / Status</th>
                  <th className="px-4 py-4 text-center">Featured</th>
                  <th className="px-4 py-4 text-center">Visibility</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOpportunities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-400">
                          {item.companyLogoUrl ? (
                            <img src={item.companyLogoUrl} alt="" className="w-6 h-6 object-contain" />
                          ) : item.opportunityType === "HACKATHON" ? (
                            <Trophy className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Briefcase className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-sm">
                          <div className="font-semibold text-white truncate flex items-center gap-2">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {item.company} • {item.location} ({item.mode})
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
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.opportunityType === "HACKATHON"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {item.opportunityType}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-medium ${
                            item.sourceType === "INTERNAL" ? "text-emerald-400 font-bold" : "text-purple-400"
                          }`}
                        >
                          {item.sourceType === "INTERNAL" ? "SC TECH Official" : item.sourceName}
                        </span>
                        {item.sourceUrl && (
                          <a
                            href={item.applyUrl || item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[11px] text-slate-500 hover:text-slate-300 transition"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> View Original
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">
                      <div>
                        {item.deadline ? formatISTDate(item.deadline) : "Open / Rolling"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.stipend || item.prize || "Unspecified"}
                      </div>
                    </td>

                    {/* Featured Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeature(item)}
                        className={`p-1.5 rounded-lg border transition ${
                          item.featured
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "text-slate-600 hover:text-slate-400 border-transparent hover:border-slate-700"
                        }`}
                        title={item.featured ? "Featured on Home" : "Click to Feature"}
                      >
                        <Flame className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Visibility Toggle */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleVisibility(item)}
                        className={`p-1.5 rounded-lg border transition ${
                          item.hidden
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                        title={item.hidden ? "Currently Hidden" : "Currently Visible"}
                      >
                        {item.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        title="Delete from Platform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
