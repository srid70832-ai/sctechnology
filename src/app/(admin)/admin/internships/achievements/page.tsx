"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  ExternalLink, 
  Search, 
  IndianRupee,
  Sparkles,
  Plus
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";

export default function AdminInternshipAchievementsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [verifiedAchievements, setVerifiedAchievements] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Manual Add Form Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    studentUid: "",
    studentName: "",
    studentEmail: "",
    studentCollege: "",
    internshipId: "int-custom-" + Date.now(),
    companyName: "",
    role: "",
    duration: "6 Weeks",
    stipendAmount: 15000,
    stipendCurrency: "INR",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/internships/achievements", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setVerifiedAchievements(data.verifiedAchievements || []);
      } else {
        error("Failed to load internship achievements");
      }
    } catch {
      error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyApplication = async (app: any) => {
    setProcessingId(app.id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/internships/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentUid: app.studentId,
          studentName: app.student?.name || "Student",
          studentEmail: app.student?.email || "",
          studentCollege: app.student?.studentProfile?.college || "Engineering College",
          internshipId: app.internshipId,
          companyName: app.internship?.company?.name || "Partner Company",
          role: app.internship?.role || "Software Intern",
          duration: app.internship?.duration || "6 Weeks",
          stipendAmount: app.offer?.stipend ?? app.internship?.stipend ?? 15000,
          stipendVerified: true,
          completionVerified: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message || "Internship achievement verified and published!");
        loadData();
      } else {
        error(data.error || "Verification failed");
      }
    } catch {
      error("Verification failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.companyName || !formData.role) {
      error("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/internships/achievements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        success("Internship achievement verified and added to Hall of Fame!");
        setShowModal(false);
        loadData();
      } else {
        error(data.error || "Failed to add achievement");
      }
    } catch {
      error("Failed to add achievement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] p-6 sm:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/leaderboard?tab=internships"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
          >
            <span>View Public Leaderboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Verify New Internship</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase">
            Admin Verification Portal
          </span>
          <span className="text-xs text-slate-400">Published in Global Leaderboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Student Internship & Stipend Verification</h1>
        <p className="text-xs text-slate-400">
          Review completed industry internships, verify monthly stipend payouts, and publish them with official verified digital certificates.
        </p>
      </div>

      {/* Selected Applications for 1-Click Verification */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span>Selected & Completed Applications ({applications.length})</span>
        </h2>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span>Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500 text-xs">
            No completed internship applications pending review.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{app.internship?.company?.name || "Company"}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ₹{(app.offer?.stipend ?? app.internship?.stipend ?? 0).toLocaleString()} / month
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-blue-400">{app.internship?.role}</div>
                  <p className="text-xs text-slate-300">
                    Student: <strong>{app.student?.name}</strong> ({app.student?.email})
                  </p>
                </div>

                <button
                  onClick={() => handleVerifyApplication(app)}
                  disabled={processingId === app.id}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{processingId === app.id ? "Verifying..." : "Verify & Publish Stipend Achievement"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#0B0F19] border border-emerald-500/30 shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verify Internship Achievement</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Student Name *</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value, studentUid: "stu-" + Date.now() })}
                  placeholder="e.g. Sridharan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Google / Microsoft / SC TECH"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Internship Role *</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Full Stack Developer Intern"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly Stipend (₹) *</label>
                  <input
                    type="number"
                    value={formData.stipendAmount}
                    onChange={(e) => setFormData({ ...formData, stipendAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">College / Institution</label>
                <input
                  type="text"
                  value={formData.studentCollege}
                  onChange={(e) => setFormData({ ...formData, studentCollege: e.target.value })}
                  placeholder="e.g. Anna University"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/30"
              >
                Verify & Publish to Leaderboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
