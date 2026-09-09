"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Award, 
  ArrowLeft, 
  Clock, 
  Layers, 
  PlayCircle, 
  CheckCircle2, 
  Loader2, 
  BookOpen, 
  ArrowRight,
  GraduationCap,
  Sparkles,
  User,
  ShieldCheck
} from "lucide-react";

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses?id=${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        <span>Loading course syllabus...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0F19]">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Course Not Found</h2>
          <p className="text-xs text-slate-400">The requested curriculum does not exist or has been unpublished.</p>
          <Link href="/courses" className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold inline-block">
            Back to Courses
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar />

      <main className="flex-1 py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Courses</span>
        </Link>

        {/* Hero Course Banner */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#130E26] to-[#0B0F19] border border-violet-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider border border-violet-500/30">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>{course.category} • {course.difficulty}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {course.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {course.shortDescription}
              </p>
            </div>

            {/* Action CTA */}
            <div className="w-full sm:w-auto">
              <Link
                href={`/courses/${course.slug || course.id}/learn`}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <span>Start Learning Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">Instructor</span>
              <span className="font-bold text-white">{course.instructor}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Estimated Duration</span>
              <span className="font-bold text-white">{course.duration}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Curriculum</span>
              <span className="font-bold text-violet-400">
                {course.totalModules || course.modules?.length || 0} Modules • {course.totalLessons || 0} Lessons
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Access</span>
              <span className="font-bold text-emerald-400">
                {course.isFree ? "Free Student Tier" : `₹${course.price}`}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Full Description */}
        {course.fullDescription && (
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">About This Curriculum</h2>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {course.fullDescription}
            </p>
          </div>
        )}

        {/* Syllabus Breakdown (Modules & Lessons) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" />
              <span>Complete Course Syllabus</span>
            </h2>
            <span className="text-xs text-slate-400">
              {course.modules?.length || 0} Modules Organized
            </span>
          </div>

          {(!course.modules || course.modules.length === 0) ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
              Syllabus modules are currently being finalized by the instructor.
            </div>
          ) : (
            <div className="space-y-4">
              {course.modules.map((mod: any, mIdx: number) => (
                <div
                  key={mod.id}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl"
                >
                  <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-violet-600/20 text-violet-400 text-xs font-bold flex items-center justify-center border border-violet-500/30">
                        {mIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-[11px] text-slate-400">{mod.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {mod.lessons?.length || 0} Lessons
                    </span>
                  </div>

                  {/* Lessons list */}
                  <div className="p-3 sm:p-4 divide-y divide-slate-800/60">
                    {(!mod.lessons || mod.lessons.length === 0) ? (
                      <p className="text-[11px] text-slate-500 italic p-2">No lessons in this module.</p>
                    ) : (
                      mod.lessons.map((less: any, lIdx: number) => (
                        <div
                          key={less.id}
                          className="py-3 px-2 flex items-center justify-between hover:bg-slate-800/20 rounded-xl transition text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <PlayCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-200">
                                {mIdx + 1}.{lIdx + 1} {less.title}
                              </span>
                              {less.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">{less.description}</p>
                              )}
                            </div>
                          </div>

                          <Link
                            href={`/courses/${course.slug || course.id}/learn`}
                            className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-violet-500/40 text-[11px] font-semibold text-violet-300"
                          >
                            Watch
                          </Link>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
