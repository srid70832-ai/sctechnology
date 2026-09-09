"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  MessageSquare, 
  Star, 
  Filter, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  User, 
  Globe, 
  Loader2 
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  rating: number;
  category: string;
  message: string;
  pageUrl: string;
  anonymous: boolean;
  status: "NEW" | "REVIEWED" | "RESOLVED";
  createdAt: any;
}

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items: FeedbackItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          rating: data.rating || 5,
          category: data.category || "General",
          message: data.message || "",
          pageUrl: data.pageUrl || "/",
          anonymous: !!data.anonymous,
          status: data.status || "NEW",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        });
      });
      setFeedbacks(items);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      error("Failed to load feedback records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleUpdateStatus = async (feedbackId: string, newStatus: "NEW" | "REVIEWED" | "RESOLVED") => {
    try {
      const docRef = doc(db, "feedback", feedbackId);
      await updateDoc(docRef, { status: newStatus });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
      );
      success(`Feedback marked as ${newStatus}`);
    } catch (err) {
      error("Failed to update status");
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && f.category !== categoryFilter) return false;
    return true;
  });

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
            <MessageSquare className="w-7 h-7 text-blue-500" />
            <span>Student Feedback Portal</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real user feedback and ratings submitted via the SC TECH persistent feedback widget.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchFeedbacks}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
        >
          {loading ? "Refreshing..." : "Refresh Feed"}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          {["ALL", "NEW", "REVIEWED", "RESOLVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Categories</option>
          <option value="UI/UX">UI/UX & Design</option>
          <option value="Internships">Internships</option>
          <option value="Hackathons">Hackathons</option>
          <option value="Projects">Projects</option>
          <option value="Payments">Payments</option>
          <option value="Performance">Performance</option>
          <option value="Authentication">Authentication</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Feedbacks Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading feedback records...</span>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No feedback matching filters</h3>
          <p className="text-xs text-slate-500">Student feedback will appear here as soon as users submit it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeedbacks.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider text-blue-400">
                    {item.category}
                  </span>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= item.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Message */}
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  &ldquo;{item.message}&rdquo;
                </p>
              </div>

              {/* Meta & Status Actions */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.userName} {item.userEmail ? `(${item.userEmail})` : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{item.pageUrl}</span>
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === "RESOLVED"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : item.status === "REVIEWED"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {item.status}
                  </span>

                  <div className="flex gap-1.5">
                    {item.status !== "REVIEWED" && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, "REVIEWED")}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300"
                      >
                        Review
                      </button>
                    )}
                    {item.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, "RESOLVED")}
                        className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-[10px] font-semibold"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
