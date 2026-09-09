"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { HRSession, allocateHRSession } from "@/lib/hr-sessions";
import { 
  Users, 
  ArrowLeft, 
  Search, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Calendar, 
  Clock, 
  ShieldCheck,
  Send
} from "lucide-react";

interface StudentUserItem {
  id: string;
  name: string;
  email: string;
  department?: string;
  college?: string;
}

export default function AdminAllocateHRSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [session, setSession] = useState<HRSession | null>(null);
  const [students, setStudents] = useState<StudentUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Allocation State
  const [eligibility, setEligibility] = useState<"ALL" | "PLAN_BASED" | "SPECIFIC_STUDENTS">("SPECIFIC_STUDENTS");
  const [selectedPlans, setSelectedPlans] = useState<string[]>(["PRO", "CAREER"]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;
      try {
        // 1. Fetch Session
        const sessionRef = doc(db, "hrSessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
          const sData = sessionSnap.data() as HRSession;
          setSession({ id: sessionSnap.id, ...sData });
          setEligibility(sData.eligibility || "SPECIFIC_STUDENTS");
          if (sData.allowedPlans) setSelectedPlans(sData.allowedPlans);
          if (sData.allocatedUserIds) setSelectedStudentIds(sData.allocatedUserIds);
        }

        // 2. Fetch Students from Firestore
        const usersSnap = await getDocs(collection(db, "users"));
        const studentList: StudentUserItem[] = [];
        usersSnap.forEach((u) => {
          const uData = u.data();
          if (uData.role === "STUDENT" || !uData.role) {
            studentList.push({
              id: u.id,
              name: uData.displayName || uData.name || "Student",
              email: uData.email || "",
            });
          }
        });
        setStudents(studentList);
      } catch (err) {
        console.error("Error loading allocation data:", err);
        error("Failed to load allocation data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sessionId]);

  const toggleStudentSelection = (uid: string) => {
    if (selectedStudentIds.includes(uid)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== uid));
    } else {
      setSelectedStudentIds([...selectedStudentIds, uid]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const combined = Array.from(new Set([...selectedStudentIds, ...filteredIds]));
    setSelectedStudentIds(combined);
  };

  const handleClearAll = () => {
    setSelectedStudentIds([]);
  };

  const togglePlan = (plan: string) => {
    if (selectedPlans.includes(plan)) {
      setSelectedPlans(selectedPlans.filter((p) => p !== plan));
    } else {
      setSelectedPlans([...selectedPlans, plan]);
    }
  };

  const handleConfirmAllocation = async () => {
    if (!firebaseUser?.uid || !session) return;
    setSaving(true);
    try {
      const ok = await allocateHRSession(
        sessionId,
        selectedStudentIds,
        selectedPlans,
        eligibility,
        firebaseUser.uid,
        session.title
      );

      if (ok) {
        success(`Session published & allocated to ${eligibility === "ALL" ? "all students" : selectedStudentIds.length + " students"}!`);
        setShowConfirmModal(false);
        router.push("/admin/hr-sessions");
      } else {
        error("Allocation failed");
      }
    } catch {
      error("Allocation error");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span>Loading allocation portal...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">HR Session not found</h2>
        <Link href="/admin/hr-sessions" className="text-xs text-blue-400">
          &larr; Back to HR Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin/hr-sessions" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to HR Sessions</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Allocate HR Session</span>
          </h1>
          <p className="text-xs text-slate-400">
            Control student visibility and dispatch notifications for &quot;{session.title}&quot;.
          </p>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Allocate & Publish Session</span>
        </button>
      </div>

      {/* Session Summary Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">{session.title}</h2>
          <span className="text-xs text-blue-400 font-semibold">{session.speakerName} ({session.companyName})</span>
        </div>
        <p className="text-xs text-slate-300 line-clamp-2">{session.description}</p>
        <div className="flex gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{session.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{session.startTime} ({session.duration} mins)</span>
          </div>
        </div>
      </div>

      {/* Allocation Rule Selection */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          1. Choose Allocation Target
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "SPECIFIC_STUDENTS", title: "Specific Students", desc: "Handpick individual student accounts" },
            { id: "PLAN_BASED", title: "Students by Plan", desc: "Unlock for selected subscription tiers" },
            { id: "ALL", title: "All Registered Students", desc: "Broadcast to every active student" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setEligibility(item.id as any)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                eligibility === item.id
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
                  : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <span className="text-xs font-bold text-white mb-1">{item.title}</span>
              <span className="text-[11px] text-slate-400">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Plan Selectors if PLAN_BASED */}
        {eligibility === "PLAN_BASED" && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Select Eligible Subscription Plans:</span>
            <div className="flex flex-wrap gap-2">
              {["STARTER", "PLUS", "PRO", "CAREER"].map((plan) => {
                const isChecked = selectedPlans.includes(plan);
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => togglePlan(plan)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      isChecked
                        ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {plan} Plan {isChecked ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Student List Picker (Visible if SPECIFIC_STUDENTS) */}
      {eligibility === "SPECIFIC_STUDENTS" && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Select Students ({selectedStudentIds.length} Selected)
              </h3>
              <p className="text-xs text-slate-400">Search and select students to allocate to this session.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Select All ({filteredStudents.length})
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name or email address..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Student Checkbox Table */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No students found matching your search.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() => toggleStudentSelection(st.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500/50 text-white"
                        : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">{st.name}</div>
                        <div className="text-[11px] text-slate-400">{st.email}</div>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">UID: {st.id.slice(0, 8)}...</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl text-slate-100 space-y-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-base font-bold text-white">Confirm HR Session Allocation</h3>
                <p className="text-xs text-slate-300">
                  {eligibility === "ALL"
                    ? "Allocate and publish this session to all registered students?"
                    : eligibility === "PLAN_BASED"
                    ? `Allocate this session to students on ${selectedPlans.join(", ")} plans?`
                    : `Allocate this session to ${selectedStudentIds.length} selected student(s)?`}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllocation}
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
