"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Loader2, 
  Github, 
  Linkedin, 
  FileText, 
  Award,
  GraduationCap,
  Building
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminStudentsPage() {
  const { error } = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/students", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      } else {
        const data = await res.json().catch(() => ({}));
        const message = data.error || `Student directory request failed (${res.status})`;
        setLoadError(message);
        error(message);
      }
    } catch (err: any) {
      const message = err?.message || "Network error while loading student directory";
      setLoadError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    const unsubscribe = onSnapshot(
      collection(db, "students"),
      () => { void loadStudents(); },
      (snapshotError) => {
        console.error("Admin student realtime listener failed:", snapshotError);
        setLoadError(`Realtime student sync failed: ${snapshotError.message}`);
      }
    );
    return unsubscribe;
  }, []);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.college?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.skills?.some((sk: string) => sk.toLowerCase().includes(q))
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
            Real-time telemetry and profiles of students registered on SC TECH across colleges and hackathons.
          </p>
        </div>

        <button
          onClick={loadStudents}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          Refresh Directory
        </button>
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
          <Users className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">Unable to load student directory</h3>
          <p className="text-xs text-rose-300">{loadError}</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Students Found</h3>
          <p className="text-xs text-slate-400">Adjust your search query.</p>
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
                      <div className="font-bold text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200 font-medium">{s.college}</div>
                      <div className="text-[10px] text-slate-400">{s.department}</div>
                    </td>
                    <td className="p-4 text-slate-300">
                      {s.year}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {Array.isArray(s.skills) && s.skills.slice(0, 3).map((sk: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300 border border-slate-800"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {s.plan}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      {s.profileScore}%
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
