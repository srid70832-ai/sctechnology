"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building, Users, Briefcase, Plus, CheckCircle2, Video, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDate } from "@/lib/utils";

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("SHORTLISTED");
  const [meetingLink, setMeetingLink] = useState("https://meet.google.com/sct-interview-call");
  const [scheduledAt, setScheduledAt] = useState("2026-09-25T14:00");
  const [offerStipend, setOfferStipend] = useState(15000);
  const [updating, setUpdating] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/company/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch("/api/company/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          status: newStatus,
          meetingLink,
          scheduledAt,
          offerStipend,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        success(`Candidate status updated to ${newStatus.replace("_", " ")}!`);
        setSelectedApp(null);
        fetchApplications();
      } else {
        error(data.error || "Failed to update candidate status");
      }
    } catch {
      error("Update error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Company & HR Recruitment Portal</h1>
              <p className="text-xs text-slate-400">TechNova Talent Operations & Candidate Tracking</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            EMPLOYER ACCESS
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
          <span>Loading applicants...</span>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4 max-w-5xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Candidate Applications Pipeline</h3>
            <span className="text-xs text-slate-400">{applications.length} Total Applicants</span>
          </div>

          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{app.student.name}</h4>
                    <span className="text-xs text-slate-400">({app.student.email})</span>
                  </div>
                  <p className="text-xs text-blue-400">Role: {app.internship.title}</p>
                  <p className="text-[11px] text-slate-500">Applied: {formatDate(app.createdAt)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    app.status === "SELECTED"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : app.status === "SHORTLISTED"
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}>
                    {app.status.replace("_", " ")}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setNewStatus(app.status);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition"
                  >
                    Manage Candidate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
          No applicants currently in pipeline.
        </div>
      )}

      {/* Candidate Pipeline Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Manage Applicant: {selectedApp.student.name}</h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pipeline Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="APPLIED">APPLIED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="INTERVIEW_SCHEDULED">INTERVIEW_SCHEDULED</option>
                  <option value="SELECTED">SELECTED / OFFERED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              {newStatus === "INTERVIEW_SCHEDULED" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Interview Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Meeting Link (Google Meet / Zoom)</label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {newStatus === "SELECTED" && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Offer Stipend (₹ / month)</label>
                  <input
                    type="number"
                    value={offerStipend}
                    onChange={(e) => setOfferStipend(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition"
              >
                {updating ? "Saving Changes..." : "Update Pipeline Status"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
