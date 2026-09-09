"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { HRSession, createHRSession, updateHRSession } from "@/lib/hr-sessions";
import { 
  Users, 
  Calendar, 
  Clock, 
  Video, 
  Plus, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Save,
  X
} from "lucide-react";

export default function AdminHRSessionsPage() {
  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [sessions, setSessions] = useState<HRSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // New Session Form State
  const [form, setForm] = useState({
    title: "",
    speakerName: "",
    speakerRole: "",
    companyName: "",
    description: "",
    date: "",
    startTime: "",
    duration: 60,
    sessionType: "Webinar" as const,
    meetingPlatform: "Google Meet" as const,
    meetingLink: "",
    eligibility: "ALL" as const,
    allowedPlans: [] as string[],
    maxParticipants: 100,
    registrationDeadline: "",
    status: "DRAFT" as const,
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, "hrSessions");
      const q = query(colRef, orderBy("date", "desc"));
      const snap = await getDocs(q);
      const list: HRSession[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as HRSession) });
      });
      setSessions(list);
    } catch (err) {
      console.error("Error fetching HR sessions:", err);
      error("Failed to load HR sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.speakerName || !form.date || !form.startTime || !form.description) {
      error("Please fill in all mandatory fields marked with *");
      return;
    }

    if (!firebaseUser?.uid) return;

    setCreating(true);
    try {
      const id = await createHRSession(form, firebaseUser.uid);
      if (id) {
        success("HR Session created in DRAFT mode!");
        setShowCreateModal(false);
        setForm({
          title: "",
          speakerName: "",
          speakerRole: "",
          companyName: "",
          description: "",
          date: "",
          startTime: "",
          duration: 60,
          sessionType: "Webinar",
          meetingPlatform: "Google Meet",
          meetingLink: "",
          eligibility: "ALL",
          allowedPlans: [],
          maxParticipants: 100,
          registrationDeadline: "",
          status: "DRAFT",
        });
        await fetchSessions();
      } else {
        error("Failed to create session");
      }
    } catch {
      error("Creation error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      await deleteDoc(doc(db, "hrSessions", sessionId));
      setSessions(sessions.filter((s) => s.id !== sessionId));
      success("Session deleted successfully");
    } catch {
      error("Failed to delete session");
    }
  };

  const handleQuickStatusChange = async (sessionId: string, newStatus: HRSession["status"]) => {
    if (!firebaseUser?.uid) return;
    try {
      await updateHRSession(sessionId, { status: newStatus }, firebaseUser.uid);
      setSessions(sessions.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s)));
      success(`Status updated to ${newStatus}`);
    } catch {
      error("Failed to update status");
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: sessions.length,
    published: sessions.filter((s) => s.status === "PUBLISHED" || s.status === "REGISTRATION_OPEN").length,
    draft: sessions.filter((s) => s.status === "DRAFT").length,
    live: sessions.filter((s) => s.status === "LIVE").length,
    completed: sessions.filter((s) => s.status === "COMPLETED").length,
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>HR Sessions Management & Allocation</span>
          </h1>
          <p className="text-xs text-slate-400">
            Create, publish, allocate, and manage live industry mentorship and recruiter sessions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create HR Session</span>
        </button>
      </div>

      {/* 4 Real Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Sessions</span>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.total}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-emerald-400">Active / Published</span>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.published}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-amber-400">Draft Sessions</span>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.draft}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-blue-400">Completed</span>
          <div className="text-2xl sm:text-3xl font-black text-white">{stats.completed}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 border border-slate-800 p-2 rounded-2xl text-xs">
        {["ALL", "DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "LIVE", "COMPLETED", "CANCELLED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              statusFilter === st
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Session Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading HR sessions...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No HR sessions matching filter</h3>
          <p className="text-xs text-slate-500">Click &quot;+ Create HR Session&quot; to schedule and publish a new session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <motion.div
              key={session.id}
              whileHover={{ y: -3 }}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Header with Status Pill */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    session.status === "PUBLISHED" || session.status === "REGISTRATION_OPEN"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : session.status === "LIVE"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse"
                      : session.status === "DRAFT"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {session.status.replace("_", " ")}
                  </span>

                  <span className="text-[11px] text-blue-400 font-semibold">
                    {session.sessionType}
                  </span>
                </div>

                {/* Speaker Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-sm">
                    {session.speakerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{session.speakerName}</h4>
                    <p className="text-[11px] text-slate-400">{session.speakerRole} • {session.companyName}</p>
                  </div>
                </div>

                {/* Session Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-white leading-snug mb-1">{session.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{session.description}</p>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{session.startTime} ({session.duration}m)</span>
                  </div>
                </div>

                {/* Eligibility & Allocation Tag */}
                <div className="text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-300">Access:</span>
                    <span className="text-blue-400 font-bold">{session.eligibility}</span>
                  </div>
                  {session.allocatedUserIds && session.allocatedUserIds.length > 0 && (
                    <div className="flex justify-between text-[10px] text-emerald-400">
                      <span>Allocated Students:</span>
                      <span className="font-bold">{session.allocatedUserIds.length} Students</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Link
                  href={`/admin/hr-sessions/${session.id}/allocate`}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Allocate Students & Publish</span>
                </Link>

                <div className="flex items-center justify-between gap-1.5 pt-1">
                  {/* Status Dropdown */}
                  <select
                    value={session.status}
                    onChange={(e) => handleQuickStatusChange(session.id!, e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="REGISTRATION_OPEN">REGISTRATION OPEN</option>
                    <option value="LIVE">LIVE NOW</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>

                  <button
                    onClick={() => handleDelete(session.id!)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create HR Session Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">Create New HR Session</h3>
                  <p className="text-xs text-slate-400">Schedule industry sessions, mock interviews, and recruiter talks.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Session Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Navigating Technical Interviews at Top Tech Companies"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Speaker Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.speakerName}
                      onChange={(e) => setForm({ ...form, speakerName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Speaker Role</label>
                    <input
                      type="text"
                      value={form.speakerRole}
                      onChange={(e) => setForm({ ...form, speakerRole: e.target.value })}
                      placeholder="e.g. Senior Tech Recruiter"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Company / Organization</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="e.g. Microsoft / Google"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Session Type</label>
                    <select
                      value={form.sessionType}
                      onChange={(e) => setForm({ ...form, sessionType: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Webinar">Webinar</option>
                      <option value="1-on-1 Mock Interview">1-on-1 Mock Interview</option>
                      <option value="Panel Discussion">Panel Discussion</option>
                      <option value="Q&A Session">Q&A Session</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Description & Agenda <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide detailed session topics, prerequisites, and learning takeaways..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Date <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Start Time <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration (Mins)</label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meeting Platform</label>
                    <select
                      value={form.meetingPlatform}
                      onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Private Meeting URL</label>
                    <input
                      type="url"
                      value={form.meetingLink}
                      onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                      placeholder="https://meet.google.com/..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save as DRAFT</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
