"use client";

import React, { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Briefcase, Calendar, Video, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import Link from "next/link";

export default function MyInternshipsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch("/api/student/profile");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.user?.applications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      <DashboardSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">My Internship Applications</h1>
              <p className="text-xs text-slate-400">Track real-time hiring review, technical rounds, and offer letters.</p>
            </div>
            <Link
              href="/internships"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Browse Openings
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span>Loading applications...</span>
            </div>
          ) : applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-blue-400 font-semibold">{app.internship.company.name}</span>
                      <h3 className="text-lg font-bold text-white">{app.internship.title}</h3>
                      <p className="text-xs text-slate-400">Applied on {formatDate(app.createdAt)}</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto uppercase tracking-wider ${
                      app.status === "SELECTED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : app.status === "SHORTLISTED"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : app.status === "REJECTED"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {app.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Interview scheduled notice if exists */}
                  {app.status === "SHORTLISTED" && (
                    <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-slate-200">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-blue-400" />
                        <span>Technical round scheduled with lead engineering team.</span>
                      </div>
                      <span className="font-semibold text-blue-400">Upcoming</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                    <span>Stipend: <strong className="text-emerald-400 font-bold">{formatINR(app.internship.stipend)} / month</strong></span>
                    <Link href={`/internships/${app.internship.slug || app.internship.id}`} className="text-blue-400 hover:text-blue-300 font-semibold">
                      View Listing &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Applications Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore popular internships and start applying with your student profile.
              </p>
              <Link href="/internships" className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs">
                Explore Internships
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
