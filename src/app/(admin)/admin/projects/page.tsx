"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderGit2, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Github, 
  Layers, 
  Calendar,
  Sparkles,
  CheckCircle2,
  Lock,
  Code2,
  Award
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { ProjectItem, formatISTDate } from "@/lib/platform-models";
import { auth } from "@/lib/firebase";

export default function AdminProjectsPage() {
  const { success, error } = useToast();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    problemStatement: "",
    requirements: "",
    features: "",
    technologyStack: "",
    difficulty: "INTERMEDIATE" as ProjectItem["difficulty"],
    estimatedDuration: "3-4 Weeks",
    skillsRequired: "",
    githubRepoUrl: "",
    liveDemoUrl: "",
    documentationUrl: "",
    bannerUrl: "",
    startDate: "",
    deadline: "",
    submissionMethod: "WEBSITE" as ProjectItem["submissionMethod"],
    googleFormUrl: "",
    status: "PUBLISHED" as ProjectItem["status"],
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/projects", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        // Fallback to public endpoint
        const fallbackRes = await fetch("/api/projects");
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setProjects(fallbackData.projects || []);
        }
      }
    } catch (err) {
      console.error(err);
      error("Network error while loading projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      shortDescription: "",
      fullDescription: "",
      problemStatement: "",
      requirements: "Clean architecture, unit tests, responsive UI",
      features: "User authentication, dashboard, REST/GraphQL API, database persistence",
      technologyStack: "React, Next.js, Node.js, TypeScript, PostgreSQL / Firestore",
      difficulty: "INTERMEDIATE",
      estimatedDuration: "3-4 Weeks",
      skillsRequired: "Frontend, Backend, System Architecture",
      githubRepoUrl: "",
      liveDemoUrl: "",
      documentationUrl: "",
      bannerUrl: "",
      startDate: "",
      deadline: "",
      submissionMethod: "WEBSITE",
      googleFormUrl: "",
      status: "PUBLISHED",
    });
    setModalOpen(true);
  };

  const openEditModal = (proj: ProjectItem) => {
    setEditingProject(proj);
    setFormData({
      title: proj.title,
      shortDescription: proj.shortDescription,
      fullDescription: proj.fullDescription || proj.shortDescription,
      problemStatement: proj.problemStatement || "",
      requirements: Array.isArray(proj.requirements) ? proj.requirements.join(", ") : "",
      features: Array.isArray(proj.features) ? proj.features.join(", ") : "",
      technologyStack: Array.isArray(proj.technologyStack) ? proj.technologyStack.join(", ") : "",
      difficulty: proj.difficulty || "INTERMEDIATE",
      estimatedDuration: proj.estimatedDuration || "3-4 Weeks",
      skillsRequired: Array.isArray(proj.skillsRequired) ? proj.skillsRequired.join(", ") : "",
      githubRepoUrl: proj.githubRepoUrl || (proj as any).githubUrl || "",
      liveDemoUrl: proj.liveDemoUrl || (proj as any).demoUrl || "",
      documentationUrl: proj.documentationUrl || "",
      bannerUrl: proj.bannerUrl || (proj as any).thumbnail || "",
      startDate: proj.startDate ? proj.startDate.split("T")[0] : "",
      deadline: proj.deadline ? proj.deadline.split("T")[0] : "",
      submissionMethod: proj.submissionMethod || "WEBSITE",
      googleFormUrl: proj.googleFormUrl || "",
      status: proj.status || "PUBLISHED",
    });
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.shortDescription || !formData.githubRepoUrl) {
      error("Project title, short description, and GitHub repository URL are required.");
      return;
    }

    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const payload = {
        ...(editingProject ? { id: editingProject.id } : {}),
        title: formData.title,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        problemStatement: formData.problemStatement,
        requirements: formData.requirements.split(",").map((s) => s.trim()).filter(Boolean),
        features: formData.features.split(",").map((s) => s.trim()).filter(Boolean),
        technologyStack: formData.technologyStack.split(",").map((s) => s.trim()).filter(Boolean),
        difficulty: formData.difficulty,
        estimatedDuration: formData.estimatedDuration,
        skillsRequired: formData.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean),
        githubRepoUrl: formData.githubRepoUrl,
        liveDemoUrl: formData.liveDemoUrl || null,
        documentationUrl: formData.documentationUrl || null,
        bannerUrl: formData.bannerUrl || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        submissionMethod: formData.submissionMethod,
        googleFormUrl: formData.googleFormUrl || null,
        status: formData.status,
      };

      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        success(json.message || "Project saved successfully!");
        setModalOpen(false);
        loadProjects();
      } else {
        error(json.error || "Failed to save project");
      }
    } catch {
      error("Error saving project");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project "${title}"?`)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/projects?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        success("Project deleted successfully.");
        setProjects(projects.filter((p) => p.id !== id));
      } else {
        error("Failed to delete project");
      }
    } catch {
      error("Network error");
    }
  };

  const toggleStatus = async (proj: ProjectItem) => {
    const nextStatus: ProjectItem["status"] = proj.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          id: proj.id, 
          status: nextStatus, 
          title: proj.title, 
          shortDescription: proj.shortDescription, 
          githubRepoUrl: proj.githubRepoUrl || (proj as any).githubUrl || "https://github.com" 
        }),
      });
      if (res.ok) {
        success(`Status updated to ${nextStatus}`);
        setProjects(projects.map((p) => (p.id === proj.id ? { ...p, status: nextStatus } : p)));
      }
    } catch {
      error("Failed to toggle status");
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (difficultyFilter !== "ALL" && p.difficulty !== difficultyFilter) return false;
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.shortDescription?.toLowerCase().includes(q) ||
      p.technologyStack?.some((t) => t.toLowerCase().includes(q))
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
            <FolderGit2 className="w-7 h-7 text-blue-400" />
            <span>Real-World Project Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Create, manage, and publish production codebases, GitHub repositories, and student submission rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/project-enrollments"
            className="px-4 py-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs border border-indigo-500/30 flex items-center gap-1.5 transition"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Student Enrollments & Lifecycle</span>
          </Link>

          <Link
            href="/admin/projects/tasks"
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition border border-slate-700"
          >
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Task Evaluation Queue</span>
          </Link>

          <Link
            href="/admin/projects/stipends"
            className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 transition"
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Stipend Disbursement</span>
          </Link>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by title, stack, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                difficultyFilter === diff
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading project blueprints...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Projects Found</h3>
          <p className="text-xs text-slate-400">Add a new project or adjust filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const githubUrl = p.githubRepoUrl || (p as any).githubUrl;
            const liveUrl = p.liveDemoUrl || (p as any).demoUrl;

            return (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-xl relative"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.difficulty === "ADVANCED"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : p.difficulty === "INTERMEDIATE"
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {p.difficulty || "INTERMEDIATE"}
                    </span>

                    <button
                      onClick={() => toggleStatus(p)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                        p.status === "PUBLISHED" || (p as any).published
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
                      }`}
                    >
                      {p.status || ((p as any).published ? "PUBLISHED" : "DRAFT")}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{p.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">
                      {p.shortDescription}
                    </p>
                  </div>

                  {/* Tech stack */}
                  {(() => {
                    const rawTech = (p.technologyStack || (p as any).techStack) as any;
                    const techArr: string[] = Array.isArray(rawTech) ? rawTech : typeof rawTech === "string" ? (() => { try { return JSON.parse(rawTech); } catch { return String(rawTech).split(",").map((s: string) => s.trim()).filter(Boolean); } })() : [];
                    if (techArr.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {techArr.slice(0, 4).map((tech: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] font-semibold text-slate-300 border border-slate-800"
                          >
                            {tech}
                          </span>
                        ))}
                        {techArr.length > 4 && (
                          <span className="text-[10px] text-slate-500 self-center">
                            +{techArr.length - 4}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Deadline & Submission Method */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{p.deadline ? formatISTDate(p.deadline) : "Open Deadline"}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-[10px] font-bold text-slate-400 border border-slate-800">
                      {p.submissionMethod || "WEBSITE"}
                    </span>
                  </div>
                </div>

                {/* Footer Links & Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    {githubUrl && (
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source</span>
                      </a>
                    )}
                    {liveUrl && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Demo</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id, p.title)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-blue-400" />
                <span>{editingProject ? "Edit Real-World Project" : "Create Real-World Project"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Project Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Task Queue & Telemetry Platform"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Short Description *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="High-level summary for cards and catalog..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Real-World Problem Statement</label>
                <textarea
                  rows={3}
                  value={formData.problemStatement}
                  onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                  placeholder="Industry pain point, challenges faced by enterprises, why this solution matters..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* GitHub Repo URL & Live Demo */}
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                  Codebase & Deployment Source Links
                </span>
                
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">GitHub Repository URL * (No zip upload needed)</label>
                  <input
                    type="url"
                    required
                    value={formData.githubRepoUrl}
                    onChange={(e) => setFormData({ ...formData, githubRepoUrl: e.target.value })}
                    placeholder="https://github.com/organization/project-repository"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Students will see &quot;View Source Code → GitHub&quot; and directly open this link.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold">Live Demo URL</label>
                    <input
                      type="url"
                      value={formData.liveDemoUrl}
                      onChange={(e) => setFormData({ ...formData, liveDemoUrl: e.target.value })}
                      placeholder="https://demo.project.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold">Documentation URL</label>
                    <input
                      type="url"
                      value={formData.documentationUrl}
                      onChange={(e) => setFormData({ ...formData, documentationUrl: e.target.value })}
                      placeholder="https://docs.project.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Estimated Duration</label>
                  <input
                    type="text"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    placeholder="e.g. 2-3 Weeks"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Technology Stack (comma separated)</label>
                <input
                  type="text"
                  value={formData.technologyStack}
                  onChange={(e) => setFormData({ ...formData, technologyStack: e.target.value })}
                  placeholder="e.g. Next.js, TypeScript, Docker, Redis, TailwindCSS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Features to Build (comma separated)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="e.g. JWT Auth, Real-time WebSockets, Payment Gateway, Export PDF"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              {/* Deadline & Submission Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Submission Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                  <p className="text-[10px] text-slate-500">Enforced strictly on the server in UTC.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Submission Method</label>
                  <select
                    value={formData.submissionMethod}
                    onChange={(e) => setFormData({ ...formData, submissionMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  >
                    <option value="WEBSITE">OPTION 1: Website Submission</option>
                    <option value="GOOGLE_FORM">OPTION 2: Google Form</option>
                  </select>
                </div>

                {formData.submissionMethod === "GOOGLE_FORM" && (
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-amber-400 font-bold">Configured Google Form URL *</label>
                    <input
                      type="url"
                      required
                      value={formData.googleFormUrl}
                      onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                      placeholder="https://docs.google.com/forms/d/e/.../viewform"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-slate-100"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProject ? "Update Project" : "Create Project"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
