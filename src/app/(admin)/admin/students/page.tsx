"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Users, 
  ArrowLeft, 
  Search, 
  RotateCw,
  ExternalLink, 
  Loader2, 
  Github, 
  Linkedin, 
  FileText, 
  Globe,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminStudentsPage() {
  const { error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [students, setStudents] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStudents = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);

    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/students", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success !== false) {
        const studentList = Array.isArray(data?.students) ? data.students : [];
        setStudents(studentList);
        setTotalCount(typeof data?.total === "number" ? data.total : studentList.length);
      } else {
        const message = data?.error || `Student directory request failed (${res.status})`;
        setLoadError(message);
        setStudents([]);
        setTotalCount(0);
        error(message);
      }
    } catch (err: any) {
      const message = err?.message || "Network error while loading student directory";
      setLoadError(message);
      setStudents([]);
      setTotalCount(0);
      error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser, error]);

  useEffect(() => {
    if (!authLoading) {
      loadStudents();
    }
  }, [authLoading, loadStudents]);

  const studentList = Array.isArray(students) ? students : [];
  const filteredStudents = studentList.filter((s) => {
    if (!s) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (s.name && typeof s.name === "string" && s.name.toLowerCase().includes(q)) ||
      (s.displayName && typeof s.displayName === "string" && s.displayName.toLowerCase().includes(q)) ||
      (s.email && typeof s.email === "string" && s.email.toLowerCase().includes(q)) ||
      (s.college && typeof s.college === "string" && s.college.toLowerCase().includes(q)) ||
      (s.department && typeof s.department === "string" && s.department.toLowerCase().includes(q)) ||
      (Array.isArray(s.skills) && s.skills.some((sk: any) => typeof sk === "string" && sk.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-400" />
            <span>Registered Students Directory</span>
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative directory and profiles of verified students registered on SC TECH across colleges and hackathons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300">
            Total Students: <span className="font-bold text-white ml-1">{totalCount}</span>
          </div>
          <button
            onClick={() => loadStudents(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Directory"}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, college, email, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading verified student records...</span>
        </div>
      ) : loadError ? (
        <div className="py-16 text-center rounded-3xl bg-rose-950/20 border border-rose-800/80 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">Unable to load student directory</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">{loadError}</p>
          <button
            onClick={() => loadStudents(false)}
            className="mt-2 px-4 py-2 rounded-xl bg-rose-900/40 border border-rose-700/50 text-xs font-semibold text-white hover:bg-rose-900/60 transition"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            {students.length === 0 ? "No students registered yet." : "No Students Found"}
          </h3>
          <p className="text-xs text-slate-400">
            {students.length === 0 
              ? "New student registrations from SC TECH platform will automatically appear here." 
              : "No student records match your current search query. Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/60">
                  <th className="p-4">Student</th>
                  <th className="p-4">College & Dept</th>
                  <th className="p-4">Year</th>
                  <th className="p-4">Skills</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Score</th>
                  <th className="p-4 text-right">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((s) => (
                  <tr key={s.id || s.uid} className="hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">{s.displayName || s.name || "Student"}</div>
                      <div className="text-[11px] text-slate-400">{s.email || "No email"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200 font-medium">{s.college || "Not provided"}</div>
                      <div className="text-[10px] text-slate-400">{s.department || "Not provided"}</div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {s.year || "Not specified"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Array.isArray(s.skills) && s.skills.length > 0 ? (
                          s.skills.slice(0, 3).map((sk: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300 border border-slate-800"
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No skills listed</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {s.plan || "Free Starter"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      {typeof s.profileScore === "number" ? `${s.profileScore}%` : `${s.profileCompletion || 0}%`}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {s.resumeUrl && (
                          <a
                            href={s.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white text-emerald-400"
                            title="Resume"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {s.githubUrl && (
                          <a
                            href={s.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white text-blue-400"
                            title="GitHub"
                          >
                            <Github className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {s.linkedinUrl && (
                          <a
                            href={s.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white text-cyan-400"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {s.portfolioUrl && (
                          <a
                            href={s.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:text-white text-violet-400"
                            title="Portfolio"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
