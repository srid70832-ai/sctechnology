"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InternshipItem } from "@/lib/internship-discovery";
import { formatINR } from "@/lib/utils";
import { 
  Globe, 
  Clock, 
  MapPin, 
  Briefcase, 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Loader2,
  Sparkles
} from "lucide-react";

export default function InternshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [internship, setInternship] = useState<InternshipItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    async function loadInternship() {
      if (!rawId) return;
      try {
        // Try getting by document ID directly
        const docRef = doc(db, "internships", rawId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInternship({ id: docSnap.id, ...(docSnap.data() as InternshipItem) });
        } else {
          // Try querying by slug
          const colRef = collection(db, "internships");
          const q = query(colRef, where("slug", "==", rawId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setInternship({ id: snap.docs[0].id, ...(snap.docs[0].data() as InternshipItem) });
          }
        }
      } catch (err) {
        console.error("Error fetching internship detail from Firestore:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInternship();
  }, [rawId]);

  const handleInternalApply = async () => {
    if (!user || !firebaseUser?.uid) {
      window.location.href = `/login?redirect=/internships/${rawId}`;
      return;
    }

    setApplying(true);
    try {
      await addDoc(collection(db, "internshipApplications"), {
        internshipId: internship?.id || rawId,
        internshipTitle: internship?.title,
        companyName: internship?.companyName,
        userId: firebaseUser.uid,
        userName: user.name || "Student",
        userEmail: user.email || "",
        status: "SUBMITTED",
        createdAt: serverTimestamp(),
      });

      // Notification
      await addDoc(collection(db, "notifications"), {
        userId: firebaseUser.uid,
        title: "Internship Application Submitted",
        message: `Your application for "${internship?.title}" at ${internship?.companyName} was received.`,
        type: "INTERNSHIP",
        read: false,
        link: "/dashboard",
        createdAt: serverTimestamp(),
      });

      setHasApplied(true);
      success("Application submitted successfully through SC TECH!");
    } catch {
      error("Application submission failed");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="py-24 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading internship details...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        <Navbar />
        <div className="p-16 text-center max-w-md mx-auto space-y-4">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-xl font-bold text-white">Internship Opportunity Not Found</h2>
          <p className="text-xs text-slate-400">The listing may have expired or was removed by the hiring company.</p>
          <Link href="/internships" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs inline-block">
            &larr; Back to Internships
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar />

      <main className="flex-1 py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        <Link href="/internships" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Internships</span>
        </Link>

        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
          
          {/* Company & Role Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 text-2xl shrink-0">
                {internship.companyName.charAt(0)}
              </div>
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                  {internship.category || "Engineering"}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {internship.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                  <span className="text-blue-400">{internship.companyName}</span>
                  <span>•</span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {internship.location || "Bengaluru"} ({internship.mode})
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-2xl font-black text-emerald-400">
                {internship.stipend ? formatINR(Number(internship.stipend)) : "Not specified"}
              </div>
              <span className="text-[11px] text-slate-500">{internship.stipend ? "per month stipend" : "Stipend info"}</span>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Work Mode</span>
              <div className="font-bold text-white flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>{internship.mode}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Duration</span>
              <div className="font-bold text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{internship.duration || "Not specified"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Source</span>
              <div className="font-bold text-white truncate">
                {internship.sourceName || "Careers Portal"}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Deadline</span>
              <div className="font-bold text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{internship.applicationDeadline || "Open until filled"}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Opportunity Overview</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {internship.description}
            </p>
          </div>

          {/* Required Skills */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Required Skills & Technologies</h3>
            <div className="flex flex-wrap gap-2">
              {internship.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action Bar (External vs Internal Application) */}
          <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">Application Procedure</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {internship.externalApplication
                    ? `This opportunity was discovered from ${internship.sourceName || "the employer careers portal"}. Apply directly on their official hiring page.`
                    : "Submit your SC TECH verified portfolio and profile directly to the recruiter."}
                </p>
              </div>

              {internship.externalApplication ? (
                <a
                  href={internship.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Apply on Original Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : hasApplied ? (
                <span className="px-5 py-3 rounded-2xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Application Submitted ✓</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleInternalApply}
                  disabled={applying}
                  className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                  <span>Apply with SC TECH Profile</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
