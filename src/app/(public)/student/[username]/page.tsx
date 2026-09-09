import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { prisma } from "@/lib/prisma";
import { 
  User, 
  Github, 
  Linkedin, 
  Globe, 
  FileText, 
  Download, 
  Award, 
  Trophy, 
  Briefcase, 
  CheckCircle2,
  GraduationCap
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicStudentPortfolioPage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await prisma.studentProfile.findFirst({
    where: {
      username: params.username,
      isPublic: true,
    },
    include: {
      user: {
        include: {
          certificates: true,
          hackathonRegistrations: {
            include: { hackathon: true, submission: true },
          },
          internshipApplications: {
            where: { status: "SELECTED" },
            include: { internship: { include: { company: true } } },
          },
        },
      },
    },
  });

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0B0F19]">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Portfolio Not Found</h2>
          <p className="text-xs text-slate-400">This user profile is private or does not exist.</p>
          <Link href="/" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
            Back to Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const skills = JSON.parse(profile.skills || "[]");

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        
        {/* Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <UserAvatar user={profile.user} size={80} className="rounded-2xl shrink-0 border-2 border-blue-500/30 shadow-lg" />

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white">{profile.user.name}</h1>
              <p className="text-xs text-blue-400 font-medium">
                {profile.college} {profile.department ? `• ${profile.department}` : ""}
              </p>
              <p className="text-xs text-slate-300 max-w-md pt-1 leading-relaxed">
                {profile.bio || "Student engineer passionate about modern software development."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Resume</span>
              </a>
            )}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-blue-300 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verified Certificates */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Award className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Verified Certificates ({profile.user.certificates.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.user.certificates.map((c) => (
              <Link
                key={c.id}
                href={`/verify/${c.certificateNo}`}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition flex justify-between items-center text-xs group"
              >
                <div>
                  <h4 className="font-bold text-white group-hover:text-amber-400 transition">{c.eventName}</h4>
                  <p className="text-[10px] text-slate-400">{c.title} • {formatDate(c.issueDate)}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {c.certificateNo}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Hackathon Participations */}
        {profile.user.hackathonRegistrations.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Trophy className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Hackathons & Competitions
              </h3>
            </div>

            <div className="space-y-3">
              {profile.user.hackathonRegistrations.map((h) => (
                <div key={h.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{h.hackathon.title}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {h.status}
                    </span>
                  </div>
                  {h.submission && (
                    <p className="text-xs text-slate-400">
                      Project: <strong className="text-blue-400">{h.submission.projectName}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
