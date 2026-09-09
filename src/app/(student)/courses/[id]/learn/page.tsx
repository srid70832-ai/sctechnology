"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  PlayCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Github, 
  ExternalLink, 
  FileText, 
  Loader2, 
  Layers, 
  ChevronRight,
  BookOpen,
  Award
} from "lucide-react";

export default function StudentCourseLearningPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const { success } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadCourseData() {
      try {
        const res = await fetch(`/api/courses?id=${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course);

          // Find first lesson to play by default
          if (data.course.modules && data.course.modules.length > 0) {
            for (const mod of data.course.modules) {
              if (mod.lessons && mod.lessons.length > 0) {
                setActiveLesson(mod.lessons[0]);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCourseData();
  }, [params.id]);

  const toggleLessonComplete = (lessonId: string) => {
    if (completedLessonIds.includes(lessonId)) {
      setCompletedLessonIds(completedLessonIds.filter((id) => id !== lessonId));
    } else {
      setCompletedLessonIds([...completedLessonIds, lessonId]);
      success("Lesson marked as complete! 🎉");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#060A12] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        <span>Loading interactive classroom...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#060A12] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Course Not Found</h2>
        <Link href="/courses" className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060A12] text-slate-100">
      <Navbar />

      {/* Classroom Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${course.slug || course.id}`}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-md">{course.title}</h1>
            <span className="text-[10px] text-violet-400 font-semibold">{course.category} • Instructor: {course.instructor}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Progress: <strong className="text-emerald-400">{completedLessonIds.length}</strong> / {course.totalLessons || 1} completed
          </span>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Student Portal
          </Link>
        </div>
      </div>

      {/* Main Classroom Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left 8 Cols: Video & Lesson Content */}
        <div className="lg:col-span-8 p-4 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-130px)]">
          
          {/* Video Player */}
          <div className="rounded-3xl bg-black border border-slate-800 overflow-hidden shadow-2xl aspect-video flex items-center justify-center relative">
            {activeLesson?.videoUrl ? (
              <iframe
                src={
                  activeLesson.videoUrl.includes("watch?v=")
                    ? activeLesson.videoUrl.replace("watch?v=", "embed/")
                    : activeLesson.videoUrl
                }
                title={activeLesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center space-y-3 p-8">
                <PlayCircle className="w-16 h-16 text-slate-700 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-slate-400">Lesson Material & Architecture Blueprint</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Read through the detailed engineering notes, formulas, and repository code below.
                </p>
              </div>
            )}
          </div>

          {/* Active Lesson Details */}
          {activeLesson ? (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-white">{activeLesson.title}</h2>
                  {activeLesson.description && (
                    <p className="text-xs text-slate-400 mt-1">{activeLesson.description}</p>
                  )}
                </div>

                <button
                  onClick={() => toggleLessonComplete(activeLesson.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                    completedLessonIds.includes(activeLesson.id)
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{completedLessonIds.includes(activeLesson.id) ? "Completed" : "Mark as Complete"}</span>
                </button>
              </div>

              {/* Lesson Notes / Technical Documentation */}
              {activeLesson.notes && (
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-xl">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <span>Lesson Documentation & Notes</span>
                  </h3>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeLesson.notes}
                  </div>
                </div>
              )}

              {/* Assignment / Challenge */}
              {activeLesson.assignment && (
                <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-2 shadow-xl">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Practical Engineering Challenge
                  </span>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {activeLesson.assignment}
                  </p>
                </div>
              )}

              {/* Codebase & Resource links */}
              <div className="flex flex-wrap items-center gap-3">
                {activeLesson.githubUrl && (
                  <a
                    href={activeLesson.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-blue-400 flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    <span>View Lesson Code on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Select a lesson from the syllabus sidebar to begin.
            </div>
          )}

        </div>

        {/* Right 4 Cols: Curriculum Navigation Sidebar */}
        <div className="lg:col-span-4 bg-slate-950/80 border-l border-slate-800 p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-130px)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Course Syllabus
            </h3>
          </div>

          <div className="space-y-4">
            {course.modules?.map((mod: any, mIdx: number) => (
              <div key={mod.id} className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-violet-600/20 text-violet-400 text-[10px] font-bold flex items-center justify-center">
                    {mIdx + 1}
                  </span>
                  <span className="truncate">{mod.title}</span>
                </div>

                <div className="pl-4 space-y-1">
                  {mod.lessons?.map((less: any, lIdx: number) => {
                    const isCurrent = activeLesson?.id === less.id;
                    const isDone = completedLessonIds.includes(less.id);

                    return (
                      <button
                        key={less.id}
                        onClick={() => setActiveLesson(less)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between ${
                          isCurrent
                            ? "bg-violet-600/20 border border-violet-500/40 text-white font-bold"
                            : "hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <PlayCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          )}
                          <span className="truncate">
                            {lIdx + 1}. {less.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
