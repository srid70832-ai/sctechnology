"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/components/providers/ToastProvider";
import { HelpCircle, Send, Loader2, MessageSquare, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function StudentSupportPage() {
  const { success, error } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support/ticket");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Student", email: "student@sctech.com", subject, category, message }),
      });
      const data = await res.json();
      if (res.ok) {
        success("Support ticket opened! Admin team has been notified.");
        setSubject("");
        setMessage("");
        fetchTickets();
      } else {
        error(data.error || "Failed to submit ticket");
      }
    } catch {
      error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl">
          <div>
            <h1 className="text-2xl font-black text-white">Help & Support Desk</h1>
            <p className="text-xs text-slate-400">Submit questions or issues directly to SC TECH engineering & billing team.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create Ticket Form */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">Create New Support Request</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="General">General Question</option>
                    <option value="Payment">Payment / Subscription</option>
                    <option value="Hackathon">Hackathon & Submissions</option>
                    <option value="Internship">Internship Process</option>
                    <option value="Certificate">Certificate ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide full context or transaction ID..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Ticket</span>
                </button>
              </form>
            </div>

            {/* Ticket List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-white">Your Support Tickets</h3>

              {loading ? (
                <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Loading tickets...</span>
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div key={t.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-md">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{t.subject}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "RESOLVED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{t.message}</p>
                      {t.adminNotes && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 mt-2">
                          <strong>Admin Reply:</strong> {t.adminNotes}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 block pt-1">{formatDate(t.createdAt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  No support tickets filed yet.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
