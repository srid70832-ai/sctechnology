'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  Sparkles,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ExternalLink,
  Search,
  Filter,
  Users,
  Briefcase,
  Layers,
  ChevronRight,
  RefreshCw,
  Eye,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  FileText,
  Globe,
  Share2,
  CheckSquare,
  Square,
  MessageSquare,
  ArrowRight,
  History,
  Zap,
  Target
} from 'lucide-react';
import { IdeaSubmission, IdeaStatus, CompanyMatchItem, ConnectionRequest, ConnectionStatus, IdeaAuditLogItem } from '@/lib/idea-link-models';

export default function AdminIdeaLinkPage() {
  const [activeTab, setActiveTab] = useState<'ideas' | 'connections'>('ideas');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaSubmission[]>([]);
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [stats, setStats] = useState<{
    totalIdeas: number;
    submittedIdeas: number;
    approvedIdeas: number;
    analyzedIdeas: number;
    sharedIdeas: number;
    totalConnections: number;
    activeConnections: number;
    connectedCount: number;
  }>({
    totalIdeas: 0,
    submittedIdeas: 0,
    approvedIdeas: 0,
    analyzedIdeas: 0,
    sharedIdeas: 0,
    totalConnections: 0,
    activeConnections: 0,
    connectedCount: 0
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Active Selections
  const [selectedIdea, setSelectedIdea] = useState<IdeaSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Gemini AI Analysis
  const [analyzingIdeaId, setAnalyzingIdeaId] = useState<string | null>(null);

  // Match Sharing Modal
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [selectedMatchIndices, setSelectedMatchIndices] = useState<number[]>([]);
  const [adminShareNotes, setAdminShareNotes] = useState<string>('');
  const [submittingShare, setSubmittingShare] = useState<boolean>(false);

  // Connection Status Update Modal
  const [selectedConnection, setSelectedConnection] = useState<ConnectionRequest | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState<boolean>(false);
  const [targetConnStatus, setTargetConnStatus] = useState<ConnectionStatus>('COMPANY_REVIEW');
  const [connNotes, setConnNotes] = useState<string>('');
  const [submittingConn, setSubmittingConn] = useState<boolean>(false);

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/idea-link');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch Admin Idea Link data');
      setIdeas(data.ideas || []);
      setConnections(data.connections || []);
      setStats(data.stats || {
        totalIdeas: 0,
        submittedIdeas: 0,
        approvedIdeas: 0,
        analyzedIdeas: 0,
        sharedIdeas: 0,
        totalConnections: 0,
        activeConnections: 0,
        connectedCount: 0
      });
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Review (Approve/Reject)
  const handleReviewSubmit = async () => {
    if (!selectedIdea) return;
    try {
      setSubmittingReview(true);
      const res = await fetch('/api/admin/idea-link/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          decision: reviewAction,
          adminNotes: reviewNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review idea');
      setShowReviewModal(false);
      setReviewNotes('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Gemini AI Analysis
  const handleAnalyzeWithGemini = async (idea: IdeaSubmission) => {
    try {
      setAnalyzingIdeaId(idea.id);
      const res = await fetch('/api/admin/idea-link/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze idea with Gemini AI');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Analysis failed');
    } finally {
      setAnalyzingIdeaId(null);
    }
  };

  // Open Share Matches Modal
  const handleOpenShareModal = (idea: IdeaSubmission) => {
    setSelectedIdea(idea);
    if (idea.aiAnalysis?.generatedMatches) {
      const preSelected = idea.aiAnalysis.generatedMatches.map((_: CompanyMatchItem, i: number) => i);
      setSelectedMatchIndices(preSelected);
    } else {
      setSelectedMatchIndices([]);
    }
    setAdminShareNotes(idea.adminNotes || 'Verified high-potential startup & enterprise synergies.');
    setShowShareModal(true);
  };

  // Submit Share Matches
  const handleShareMatchesSubmit = async () => {
    if (!selectedIdea || !selectedIdea.aiAnalysis?.generatedMatches) return;
    if (selectedMatchIndices.length === 0) {
      alert('Please select at least one company match to share with the student.');
      return;
    }
    try {
      setSubmittingShare(true);
      const selectedCompanies = selectedMatchIndices.map(
        (idx: number) => selectedIdea.aiAnalysis!.generatedMatches[idx]
      );

      const res = await fetch('/api/admin/idea-link/share-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          selectedCompanies,
          adminNotes: adminShareNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to share matches');
      setShowShareModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to share matches');
    } finally {
      setSubmittingShare(false);
    }
  };

  // Handle Connection Status Update
  const handleConnectionStatusSubmit = async () => {
    if (!selectedConnection) return;
    try {
      setSubmittingConn(true);
      const res = await fetch('/api/admin/idea-link/connection-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: selectedConnection.id,
          status: targetConnStatus,
          adminNotes: connNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update connection status');
      setShowConnectionModal(false);
      setConnNotes('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setSubmittingConn(false);
    }
  };

  // Filter Ideas
  const filteredIdeas = ideas.filter((idea: IdeaSubmission) => {
    const matchesSearch =
      idea.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.industry.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || idea.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: IdeaStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Review</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Approved (Ready for AI)</span>;
      case 'AI_ANALYZED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">AI Analyzed</span>;
      case 'MATCHES_SHARED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Matches Shared</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  const getConnStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'INTEREST_SENT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Interest Sent</span>;
      case 'COMPANY_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Admin & Company Review</span>;
      case 'CONNECTION_PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Connection Pending</span>;
      case 'CONNECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Connected</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>SC TECH Startup Ecosystem Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              SC IDEA LINK <span className="text-amber-400">Control Center</span>
            </h1>
            <p className="text-sm text-slate-400">
              Review student startup proposals, trigger Gemini AI matching, share vetted company connections, and manage outreach pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition text-sm font-medium shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* 8 Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xs font-medium text-slate-400">Total Ideas</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.totalIdeas || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs font-medium text-amber-400">Pending Review</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.submittedIdeas || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <div className="text-xs font-medium text-blue-400">Approved</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{stats.approvedIdeas || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
            <div className="text-xs font-medium text-purple-400">AI Analyzed</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{stats.analyzedIdeas || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-xs font-medium text-emerald-400">Matches Shared</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.sharedIdeas || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
            <div className="text-xs font-medium text-indigo-400">Total Interests</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{stats.totalConnections || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
            <div className="text-xs font-medium text-cyan-400">Active Pipeline</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{stats.activeConnections || 0}</div>
          </div>
          <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20">
            <div className="text-xs font-medium text-teal-400">Connected</div>
            <div className="text-2xl font-bold text-teal-400 mt-1">{stats.connectedCount || 0}</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('ideas')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'ideas'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Startup Ideas & AI Matches</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'ideas' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
              {ideas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('connections')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'connections'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Student Connection Pipeline</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'connections' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
              {connections.length}
            </span>
          </button>
        </div>

        {/* TAB 1: IDEAS & MATCHES */}
        {activeTab === 'ideas' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by ID, student, idea title, industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm text-slate-200"
                />
              </div>

              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Pending Review</option>
                  <option value="APPROVED">Approved (Ready for AI)</option>
                  <option value="AI_ANALYZED">AI Analyzed</option>
                  <option value="MATCHES_SHARED">Matches Shared</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Ideas Table */}
            {filteredIdeas.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white">No Idea Submissions Found</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Try adjusting your search query or status filter.'
                    : 'Student startup submissions will appear here for validation and AI matching.'}
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">Idea ID & Title</th>
                        <th className="py-3.5 px-4 font-semibold">Student</th>
                        <th className="py-3.5 px-4 font-semibold">Industry & Tech</th>
                        <th className="py-3.5 px-4 font-semibold">Status</th>
                        <th className="py-3.5 px-4 font-semibold">AI Match / Synergy</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredIdeas.map((idea: IdeaSubmission) => {
                        const isAnalyzing = analyzingIdeaId === idea.id;
                        return (
                          <tr key={idea.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-4 px-4">
                              <div className="font-semibold text-white hover:text-amber-400 transition cursor-pointer" onClick={() => { setSelectedIdea(idea); setShowDetailModal(true); }}>
                                {idea.title}
                              </div>
                              <div className="text-xs text-amber-400/80 font-mono mt-0.5">{idea.id}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-slate-200">{idea.studentName}</div>
                              <div className="text-xs text-slate-400">{idea.studentEmail}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-slate-300 font-medium">{idea.industry}</div>
                              <div className="text-xs text-slate-500 truncate max-w-[180px]">
                                {Array.isArray(idea.technologyUsed) ? idea.technologyUsed.join(', ') : idea.technologyUsed}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(idea.status)}
                            </td>
                            <td className="py-4 px-4">
                              {idea.aiAnalysis ? (
                                <div>
                                  <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                    <span>{idea.aiAnalysis.generatedMatches?.length || 0} Vetted Companies</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                                    {idea.approvedMatches && idea.approvedMatches.length > 0
                                      ? `${idea.approvedMatches.length} shared with student`
                                      : 'Pending Admin share'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Not analyzed</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Inspect Button */}
                                <button
                                  onClick={() => { setSelectedIdea(idea); setShowDetailModal(true); }}
                                  title="View Details"
                                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Approve / Reject Button */}
                                {idea.status === 'SUBMITTED' && (
                                  <button
                                    onClick={() => {
                                      setSelectedIdea(idea);
                                      setReviewAction('APPROVED');
                                      setReviewNotes('');
                                      setShowReviewModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-xs font-semibold transition"
                                  >
                                    Review
                                  </button>
                                )}

                                {/* Gemini AI Analysis Button */}
                                {(idea.status === 'APPROVED' || idea.status === 'AI_ANALYZED' || idea.status === 'MATCHES_SHARED') && (
                                  <button
                                    onClick={() => handleAnalyzeWithGemini(idea)}
                                    disabled={isAnalyzing}
                                    title="Trigger Gemini AI Discovery & Matching"
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                                      isAnalyzing
                                        ? 'bg-purple-900/50 text-purple-300 animate-pulse'
                                        : 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-purple-200'
                                    }`}
                                  >
                                    <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                    <span>{idea.aiAnalysis ? 'Re-Analyze AI' : 'Analyze AI'}</span>
                                  </button>
                                )}

                                {/* Share Matches Button */}
                                {idea.aiAnalysis && (
                                  <button
                                    onClick={() => handleOpenShareModal(idea)}
                                    title="Review & Share Matches"
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>Matches</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONNECTIONS PIPELINE */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            {connections.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white">No Connection Requests Yet</h3>
                <p className="text-sm text-slate-400 mt-1">
                  When students click &quot;Express Interest&quot; on matched companies, requests will appear here for facilitation.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">Request ID & Date</th>
                        <th className="py-3.5 px-4 font-semibold">Student & Idea</th>
                        <th className="py-3.5 px-4 font-semibold">Target Company</th>
                        <th className="py-3.5 px-4 font-semibold">Student Message</th>
                        <th className="py-3.5 px-4 font-semibold">Pipeline Status</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {connections.map((conn: ConnectionRequest) => (
                        <tr key={conn.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-4">
                            <div className="font-mono text-xs font-semibold text-amber-400">{conn.id}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {new Date(conn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-200">{conn.studentName}</div>
                            <div className="text-xs text-slate-400">{conn.studentEmail}</div>
                            <div className="text-xs text-amber-400/80 truncate max-w-[200px] mt-0.5">Idea: {conn.ideaTitle}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white">{conn.companyName}</div>
                            <div className="text-xs text-slate-400">{conn.companyIndustry}</div>
                            {conn.companyWebsite && (
                              <a
                                href={conn.companyWebsite}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-0.5"
                              >
                                <span>Website</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-xs text-slate-300 line-clamp-2 max-w-[240px] italic">
                              &quot;{conn.studentMessage || 'No message attached'}&quot;
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {getConnStatusBadge(conn.status)}
                            {conn.adminNotes && (
                              <div className="text-[11px] text-slate-400 mt-1 max-w-[180px] truncate">
                                Note: {conn.adminNotes}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedConnection(conn);
                                setTargetConnStatus(conn.status);
                                setConnNotes(conn.adminNotes || '');
                                setShowConnectionModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition"
                            >
                              Manage Pipeline
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: FULL IDEA DETAILS & AUDIT TRAIL */}
        {showDetailModal && selectedIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                      {selectedIdea.id}
                    </span>
                    {getStatusBadge(selectedIdea.status)}
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-2">{selectedIdea.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted by <strong className="text-slate-200">{selectedIdea.studentName}</strong> ({selectedIdea.studentEmail}) on {new Date(selectedIdea.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Industry & Domain</div>
                  <div className="text-slate-200 font-medium">{selectedIdea.industry}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Tech Stack & Tools</div>
                  <div className="text-slate-200 font-medium">
                    {Array.isArray(selectedIdea.technologyUsed) ? selectedIdea.technologyUsed.join(', ') : selectedIdea.technologyUsed}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Target Users</div>
                  <div className="text-slate-200 font-medium">{selectedIdea.targetUsers}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Business Model & Monetization</div>
                  <div className="text-slate-200 font-medium">{selectedIdea.businessModel}</div>
                </div>
              </div>

              {/* Problem & Solution */}
              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-rose-400 uppercase">Problem Statement</div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedIdea.problem}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-semibold text-emerald-400 uppercase">Proposed Solution & Product Vision</div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedIdea.solution}</p>
                </div>

                {selectedIdea.expectedImpact && (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-xs font-semibold text-indigo-400 uppercase">Expected Impact</div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedIdea.expectedImpact}</p>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {selectedIdea.pitchDeckUrl && (
                  <a
                    href={selectedIdea.pitchDeckUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>View Pitch Deck</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
                {selectedIdea.demoUrl && (
                  <a
                    href={selectedIdea.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                  >
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Live Demo Link</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
                {selectedIdea.githubUrl && (
                  <a
                    href={selectedIdea.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                  >
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>

              {/* AI Analysis Summary if exists */}
              {selectedIdea.aiAnalysis && (
                <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Gemini AI Discovery Insights</span>
                    </div>
                    <span className="text-xs text-purple-400 font-mono">
                      Potential Score: {selectedIdea.aiAnalysis.businessPotentialScore || 85}/100
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 leading-relaxed">
                    {selectedIdea.aiAnalysis.summary}
                  </p>
                </div>
              )}

              {/* Audit Trail */}
              {selectedIdea.auditTrail && selectedIdea.auditTrail.length > 0 && (
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
                    <History className="w-4 h-4" />
                    <span>Audit Trail</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedIdea.auditTrail.map((log: IdeaAuditLogItem, idx: number) => (
                      <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="text-slate-500 font-mono">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <strong className="text-slate-300">{log.action}:</strong>
                        <span>{log.details}</span>
                        <span className="text-slate-500">by {log.actor} ({log.actorRole})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: APPROVE / REJECT REVIEW */}
        {showReviewModal && selectedIdea && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Review Startup Idea</span>
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-sm text-slate-300">
                  You are evaluating proposal <strong className="text-white">&quot;{selectedIdea.title}&quot;</strong> by {selectedIdea.studentName}.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Idea</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition ${
                      reviewAction === 'REJECTED'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Idea</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Admin Feedback / Internal Notes
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewAction === 'APPROVED' ? 'e.g., Solid domain problem with strong tech execution plan. Ready for Gemini AI synergy matching.' : 'e.g., Scope is unclear or duplicates existing projects. Please refine solution.'}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Save Decision'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: REVIEW & SHARE COMPANY MATCHES */}
        {showShareModal && selectedIdea && selectedIdea.aiAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                      Gemini AI Matched Opportunities
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    Select Companies to Share with {selectedIdea.studentName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    For Idea: <strong className="text-slate-200">{selectedIdea.title}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Company Match Cards Selector */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase">
                  Select Verified Companies ({selectedMatchIndices.length} Selected)
                </div>

                {selectedIdea.aiAnalysis.generatedMatches?.map((company: CompanyMatchItem, idx: number) => {
                  const isChecked = selectedMatchIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedMatchIndices(selectedMatchIndices.filter((i: number) => i !== idx));
                        } else {
                          setSelectedMatchIndices([...selectedMatchIndices, idx]);
                        }
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-4 ${
                        isChecked
                          ? 'bg-purple-950/30 border-purple-500/50 shadow-md shadow-purple-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="pt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-white text-base flex items-center gap-2">
                            <span>{company.companyName}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                              {company.industry}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            {company.matchScore}% Match
                          </div>
                        </div>

                        <div className="text-xs text-slate-300">
                          <strong>Synergy:</strong> {company.whyItMatches}
                        </div>

                        {company.companySummary && (
                          <div className="text-xs text-slate-400">
                            <strong>Summary:</strong> {company.companySummary}
                          </div>
                        )}

                        {company.officialWebsite && (
                          <div className="pt-1">
                            <span className="text-[11px] text-blue-400 hover:underline">
                              {company.officialWebsite}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Admin Note for Student */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Admin Guidance Note for Student
                </label>
                <textarea
                  rows={3}
                  value={adminShareNotes}
                  onChange={(e) => setAdminShareNotes(e.target.value)}
                  placeholder="e.g. These companies are actively investing in this domain. Review their offerings and express interest to initiate connection."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm text-slate-200"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShareMatchesSubmit}
                  disabled={submittingShare || selectedMatchIndices.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingShare ? 'Sharing...' : 'Share Selected Matches with Student'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: MANAGE CONNECTION STATUS */}
        {showConnectionModal && selectedConnection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span>Facilitate Connection</span>
                </h3>
                <button
                  onClick={() => setShowConnectionModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div><span className="text-slate-400">Request ID:</span> <strong className="text-amber-400 font-mono">{selectedConnection.id}</strong></div>
                <div><span className="text-slate-400">Student:</span> <strong className="text-slate-200">{selectedConnection.studentName}</strong> ({selectedConnection.studentEmail})</div>
                <div><span className="text-slate-400">Target Company:</span> <strong className="text-white">{selectedConnection.companyName}</strong></div>
                <div><span className="text-slate-400">Student Note:</span> <span className="text-slate-300 italic">&quot;{selectedConnection.studentMessage || 'No message attached'}&quot;</span></div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">Update Pipeline Status</label>
                <select
                  value={targetConnStatus}
                  onChange={(e) => setTargetConnStatus(e.target.value as ConnectionStatus)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl p-3 focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="INTEREST_SENT">INTEREST_SENT (Submitted by Student)</option>
                  <option value="COMPANY_REVIEW">COMPANY_REVIEW (Admin / Outreach Review)</option>
                  <option value="CONNECTION_PENDING">CONNECTION_PENDING (Intro Email / Meeting in Progress)</option>
                  <option value="CONNECTED">CONNECTED (Connection Formed / Partnership Active)</option>
                  <option value="CLOSED">CLOSED (Archived / Inactive)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">
                  Progress Notes / Feedback for Student
                </label>
                <textarea
                  rows={3}
                  value={connNotes}
                  onChange={(e) => setConnNotes(e.target.value)}
                  placeholder="e.g. Sent introduction email to company talent & venture partnership team. Awaiting reply."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none text-sm text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConnectionStatusSubmit}
                  disabled={submittingConn}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {submittingConn ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
