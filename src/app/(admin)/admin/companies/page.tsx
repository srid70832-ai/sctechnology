"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building, 
  ArrowLeft, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Loader2, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle,
  Briefcase
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { CompanyItem, formatISTDate } from "@/lib/platform-models";
import { auth } from "@/lib/firebase";

export default function AdminCompaniesPage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    description: "",
    website: "",
    hrName: "",
    hrEmail: "",
    hrContact: "",
    requiredSkills: "",
    eligibility: "",
    location: "Remote",
    jobType: "Internship" as CompanyItem["jobType"],
    applicationUrl: "",
    deadline: "",
    status: "PUBLISHED" as CompanyItem["status"],
  });

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/companies", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      } else {
        error("Failed to fetch companies");
      }
    } catch (err) {
      console.error(err);
      error("Network error while loading companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData({
      name: "",
      logoUrl: "",
      description: "",
      website: "",
      hrName: "",
      hrEmail: "",
      hrContact: "",
      requiredSkills: "",
      eligibility: "Open to 2nd, 3rd, and 4th year B.Tech/B.E students",
      location: "Remote / Bengaluru, India",
      jobType: "Internship",
      applicationUrl: "",
      deadline: "",
      status: "PUBLISHED",
    });
    setModalOpen(true);
  };

  const openEditModal = (comp: CompanyItem) => {
    setEditingCompany(comp);
    setFormData({
      name: comp.name,
      logoUrl: comp.logoUrl || "",
      description: comp.description,
      website: comp.website || "",
      hrName: comp.hrName || "",
      hrEmail: comp.hrEmail || "",
      hrContact: comp.hrContact || "",
      requiredSkills: comp.requiredSkills ? comp.requiredSkills.join(", ") : "",
      eligibility: comp.eligibility || "",
      location: comp.location,
      jobType: comp.jobType,
      applicationUrl: comp.applicationUrl,
      deadline: comp.deadline ? comp.deadline.split("T")[0] : "",
      status: comp.status,
    });
    setModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.applicationUrl) {
      error("Company name, description, and application URL are required.");
      return;
    }

    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const payload = {
        ...(editingCompany ? { id: editingCompany.id } : {}),
        name: formData.name,
        logoUrl: formData.logoUrl || null,
        description: formData.description,
        website: formData.website || null,
        hrName: formData.hrName || null,
        hrEmail: formData.hrEmail || null,
        hrContact: formData.hrContact || null,
        requiredSkills: formData.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
        eligibility: formData.eligibility || null,
        location: formData.location,
        jobType: formData.jobType,
        applicationUrl: formData.applicationUrl,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: formData.status,
      };

      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        success(json.message || "Company saved successfully!");
        setModalOpen(false);
        loadCompanies();
      } else {
        error(json.error || "Failed to save company");
      }
    } catch {
      error("Error saving company");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete company "${name}"?`)) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/companies?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        success("Company deleted successfully.");
        setCompanies(companies.filter((c) => c.id !== id));
      } else {
        error("Failed to delete company");
      }
    } catch {
      error("Network error");
    }
  };

  const toggleStatus = async (comp: CompanyItem) => {
    const nextStatus: CompanyItem["status"] = comp.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: comp.id, status: nextStatus, name: comp.name, description: comp.description, applicationUrl: comp.applicationUrl }),
      });
      if (res.ok) {
        success(`Status updated to ${nextStatus}`);
        setCompanies(companies.map((c) => (c.id === comp.id ? { ...c, status: nextStatus } : c)));
      }
    } catch {
      error("Failed to toggle status");
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.requiredSkills?.some((s) => s.toLowerCase().includes(q))
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
            <Building className="w-7 h-7 text-cyan-400" />
            <span>Company & HR Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Create, edit, and publish partner hiring companies and direct application pathways.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Company</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, skills, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "PUBLISHED", "DRAFT", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          <span>Loading hiring companies...</span>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <Building className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Companies Found</h3>
          <p className="text-xs text-slate-400">Add a new company or modify your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-xl relative"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 font-bold overflow-hidden">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{c.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{c.location}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatus(c)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                      c.status === "PUBLISHED"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                        : c.status === "DRAFT"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {c.status}
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                {/* Skills tags */}
                {c.requiredSkills && c.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.requiredSkills.slice(0, 4).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] font-semibold text-slate-300 border border-slate-800"
                      >
                        {sk}
                      </span>
                    ))}
                    {c.requiredSkills.length > 4 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{c.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* HR Details if provided */}
                {(c.hrName || c.hrEmail) && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">HR Contact</span>
                    <div className="text-slate-300 font-medium">{c.hrName || "Hiring Lead"}</div>
                    {c.hrEmail && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{c.hrEmail}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Deadline */}
                {c.deadline && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Deadline: {formatISTDate(c.deadline)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                <a
                  href={c.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <span>Open Application Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(c.id, c.name)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-cyan-400" />
                <span>{editingCompany ? "Edit Company" : "Create New Company"}</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Infosys, Razorpay, Google"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Company Logo URL</label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://.../logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Short Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of the company, team culture, and opportunity..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Official Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Remote, Bengaluru, Hyderabad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Job / Role Type</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PUBLISHED">PUBLISHED (Visible)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  placeholder="e.g. React, Node.js, Python, TypeScript, SQL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Eligibility Criteria</label>
                <input
                  type="text"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g. B.Tech / BCA / MCA 2026/2027 Graduates with 60%+ CGPA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Application URL *</label>
                <input
                  type="url"
                  required
                  value={formData.applicationUrl}
                  onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                  placeholder="https://company.careers/apply/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* HR Information Panel */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  HR / Recruiter Foundation (Internal)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 text-[10px]">HR Name</label>
                    <input
                      type="text"
                      value={formData.hrName}
                      onChange={(e) => setFormData({ ...formData, hrName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px]">HR Email</label>
                    <input
                      type="email"
                      value={formData.hrEmail}
                      onChange={(e) => setFormData({ ...formData, hrEmail: e.target.value })}
                      placeholder="hr@company.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px]">HR Contact / Phone</label>
                    <input
                      type="text"
                      value={formData.hrContact}
                      onChange={(e) => setFormData({ ...formData, hrContact: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                    />
                  </div>
                </div>
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
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCompany ? "Update Company" : "Create Company"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
