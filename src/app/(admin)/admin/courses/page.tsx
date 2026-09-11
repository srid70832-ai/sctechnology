"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Award, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  RotateCw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Globe,
  Flame,
  Check,
  X,
  Layers,
  PlayCircle
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { CourseItem } from "@/lib/platform-models";
import { DiscoveredCourse, DiscoveryStats } from "@/lib/gemini-discovery";
import { formatISTDate } from "@/lib/platform-models";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminCoursesPage() {
  const { success, error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  // Active top-level mode tab
  const [activeTab, setActiveTab] = useState<"DISCOVERY" | "CURRICULUM">("DISCOVERY");

  // Discovered courses state
  const [discoveredCourses, setDiscoveredCourses] = useState<DiscoveredCourse[]>([]);
  const [discoveryStats, setDiscoveryStats] = useState<DiscoveryStats | null>(null);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);
  const [fetchingDiscovery, setFetchingDiscovery] = useState(false);
  const [discoveryStatusFilter, setDiscoveryStatusFilter] = useState("ALL");
  const [discoverySearch, setDiscoverySearch] = useState("");

  // Internal Curriculum state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);

  // Course Modal state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    thumbnail: "",
    shortDescription: "",
    fullDescription: "",
    category: "Full Stack Development",
    difficulty: "BEGINNER" as CourseItem["difficulty"],
    duration: "8 Weeks",
    skills: "HTML, CSS, JavaScript, React, Node.js",
    instructor: "SC TECH Lead Instructor",
    isFree: true,
    price: 0,
    status: "PUBLISHED" as CourseItem["status"],
  });

  // Load Discovered Courses
  const loadDiscoveryData = async () => {
    setLoadingDiscovery(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/courses/discovery?limit=100", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoveredCourses(data.courses || []);
        if (data.telemetry) setDiscoveryStats(data.telemetry);
      } else {
        error("Failed to load discovered courses");
      }
    } catch {
      error("Network error loading courses");
    } finally {
      setLoadingDiscovery(false);
    }
  };

  // Trigger Gemini AI Discovery Now (3 Daily)
  const handleFetchCoursesNow = async () => {
    setFetchingDiscovery(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/courses/discovery", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || "Course discovery completed successfully!");
        loadDiscoveryData();
      } else {
        error(data.error || "Course discovery failed");
      }
    } catch {
      error("Network error during discovery");
    } finally {
      setFetchingDiscovery(false);
    }
  };

  // Action: Approve or Reject
  const handleCourseStatusAction = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/courses/discovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        const newStatus = action === "APPROVE" ? "PUBLISHED" : "REJECTED";
        setDiscoveredCourses((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus as any, isActive: action === "APPROVE" } : c))
        );
        success(action === "APPROVE" ? "Course approved & published to students!" : "Course rejected.");
      }
    } catch {
      error("Failed to update course status");
    }
  };

  // Action: Feature Toggle
  const handleToggleCourseFeature = async (item: DiscoveredCourse) => {
    const newFeatured = !item.featured;
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/courses/discovery", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: item.id, action: "FEATURE", featured: newFeatured }),
      });
      if (res.ok) {
        setDiscoveredCourses((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, featured: newFeatured } : c))
        );
        success(newFeatured ? "Course marked as Featured" : "Unmarked Featured");
      }
    } catch {
      error("Failed to toggle feature");
    }
  };

  // Action: Delete
  const handleDeleteDiscoveredCourse = async (id: string) => {
    if (!confirm("Are you sure you want to remove this course?")) return;
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch(`/api/admin/courses/discovery?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setDiscoveredCourses((prev) => prev.filter((c) => c.id !== id));
        success("Course deleted successfully");
      }
    } catch {
      error("Failed to delete course");
    }
  };

  // Load Internal Curriculum Courses
  const loadInternalCourses = async () => {
    setLoadingCourses(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/courses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      error("Failed to load curriculum courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadDiscoveryData();
      loadInternalCourses();
    }
  }, [authLoading]);

  const filteredDiscoveredCourses = discoveredCourses.filter((c) => {
    if (discoveryStatusFilter !== "ALL" && c.status !== discoveryStatusFilter) return false;
    if (discoverySearch.trim()) {
      const q = discoverySearch.toLowerCase();
      const matchTitle = (c.title || "").toLowerCase().includes(q);
      const matchProv = (c.provider || "").toLowerCase().includes(q);
      const matchSkills = (c.skills || []).some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchProv && !matchSkills) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Award className="w-7 h-7 text-violet-400" />
            <span>Course & Learning Platform Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Automated Gemini AI Discovery (3 Daily Verified Courses) • Official Providers (Microsoft Learn, Coursera, Google Cloud)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("DISCOVERY")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === "DISCOVERY"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Real-World Discovery (3/Day)
          </button>
          <button
            onClick={() => setActiveTab("CURRICULUM")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === "CURRICULUM"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> SC TECH Internal LMS
          </button>
        </div>
      </div>

      {/* DISCOVERY TAB CONTENT */}
      {activeTab === "DISCOVERY" && (
        <div className="space-y-6">
          {/* Action Row & Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Daily Real-World Course Ingestion</h2>
              <p className="text-xs text-slate-400">
                Verified courses from Microsoft Learn, edX, Google Cloud, and Coursera.
              </p>
            </div>

            <button
              onClick={handleFetchCoursesNow}
              disabled={fetchingDiscovery}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {fetchingDiscovery ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying & Ingesting...
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" /> Fetch Courses Now (3 Daily)
                </>
              )}
            </button>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Today's Added</span>
              <span className="text-2xl font-bold text-emerald-400">
                {discoveryStats?.todayCourses ?? 0} / 3
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Pending Review</span>
              <span className="text-2xl font-bold text-amber-400">
                {discoveryStats?.pendingCourses ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Published</span>
              <span className="text-2xl font-bold text-violet-400">
                {discoveryStats?.publishedCourses ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Rejected</span>
              <span className="text-2xl font-bold text-rose-400">
                {discoveryStats?.rejectedCourses ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 block mb-1">Last Automatic Fetch</span>
              <span className="text-xs font-semibold text-slate-300 block truncate">
                {discoveryStats?.lastFetchAt ? formatISTDate(discoveryStats.lastFetchAt) : "Pending"}
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={discoverySearch}
                onChange={(e) => setDiscoverySearch(e.target.value)}
                placeholder="Search by course title, provider, or skills..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              {["ALL", "PENDING_REVIEW", "PUBLISHED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setDiscoveryStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    discoveryStatusFilter === st ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {st === "ALL" ? "All" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Discovered Courses Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            {loadingDiscovery ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-violet-400" />
                <p className="text-xs">Loading discovered courses...</p>
              </div>
            ) : filteredDiscoveredCourses.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No courses match the criteria</p>
                <p className="text-xs text-slate-600 mt-1">Click &quot;Fetch Courses Now&quot; to ingest real courses</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Course & Provider</th>
                      <th className="px-4 py-4">Category & Level</th>
                      <th className="px-4 py-4">Price & Duration</th>
                      <th className="px-4 py-4">Certificate</th>
                      <th className="px-4 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDiscoveredCourses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <div className="min-w-0 max-w-sm">
                            <div className="font-semibold text-white truncate flex items-center gap-2">
                              {item.title}
                              {item.featured && <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            </div>
                            <div className="text-xs text-violet-400 truncate flex items-center gap-1 mt-0.5">
                              <Globe className="w-3 h-3" /> {item.provider}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(Array.isArray(item.skills) ? item.skills : typeof item.skills === "string" ? (() => { try { return JSON.parse(item.skills); } catch { return [item.skills]; } })() : []).slice(0, 3).map((s: string, idx: number) => (
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-1 block w-fit">
                            {item.category}
                          </span>
                          <span className="text-slate-400 block">{item.level}</span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-semibold text-emerald-400">
                            {item.isFree ? "Free" : item.price ? `$${item.price}` : "Audit Free"}
                          </div>
                          <div className="text-slate-500 mt-0.5">{item.duration}</div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {item.certificateAvailable ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Included
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">No</span>
                          )}
                          {item.courseUrl && (
                            <a
                              href={item.courseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-[11px] text-slate-400 hover:text-white transition mt-1"
                            >
                              <ExternalLink className="w-3 h-3 inline mr-1" /> Original Link
                            </a>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
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
                                onClick={() => handleCourseStatusAction(item.id, "APPROVE")}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                                title="Approve & Publish to Students"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.status !== "REJECTED" && (
                              <button
                                onClick={() => handleCourseStatusAction(item.id, "REJECT")}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                                title="Reject Course"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleCourseFeature(item)}
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
                              onClick={() => handleDeleteDiscoveredCourse(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                              title="Delete Course"
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
      )}

      {/* CURRICULUM TAB CONTENT (Existing internal syllabus manager) */}
      {activeTab === "CURRICULUM" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">SC TECH Platform Courses</h2>
            <button
              onClick={() => {
                setEditingCourse(null);
                setCourseModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/30"
            >
              <Plus className="w-4 h-4" /> Create Custom Course
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 max-w-md">
            <Search className="w-4 h-4 text-slate-500 ml-2" />
            <input
              type="text"
              placeholder="Search custom courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-1 bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {loadingCourses ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              <span>Loading custom courses...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No custom courses yet. Click Create Custom Course.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => (
                <div key={c.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300">
                      {c.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{c.difficulty}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.shortDescription}</p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>{c.duration}</span>
                    <Link
                      href={`/courses/${c.slug || c.id}`}
                      className="text-violet-400 hover:text-violet-300 font-semibold"
                    >
                      View Syllabus →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
