"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { saveStudentProfile } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User, Phone, GraduationCap, Code2, Github, Linkedin, FileText, ArrowRight, Loader2, UploadCloud, CheckCircle2, ExternalLink } from "lucide-react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, firebaseUser, refresh } = useAuth();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("3rd Year");
  const [skills, setSkills] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeStoragePath, setResumeStoragePath] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uid = firebaseUser?.uid || user?.userId;
    if (!uid) {
      error("You must be logged in to upload your resume.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error("Please upload a PDF, DOC, or DOCX file under 10 MB.");
      e.target.value = "";
      return;
    }

    const validExtensions = [".pdf", ".doc", ".docx"];
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (!validExtensions.includes(ext) && file.type !== "application/pdf") {
      error("Please upload a valid PDF, DOC, or DOCX resume.");
      e.target.value = "";
      return;
    }

    setUploadingResume(true);
    try {
      const sanitizedExt = ext.replace(".", "") || "pdf";
      const storagePath = `resumes/${uid}/resume-${Date.now()}.${sanitizedExt}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || "application/pdf",
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);
      setResumeUrl(downloadUrl);
      setResumeFileName(file.name);
      setResumeStoragePath(storagePath);
      success("✓ Resume uploaded successfully.");
    } catch (err) {
      console.error("Setup resume upload error:", err);
      error("Failed to upload resume. Please try again.");
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (user) {
      const cleanEmail = user.email?.toLowerCase().trim() || "";
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || cleanEmail === "srics2425@gmail.com" || cleanEmail === "admin@sctech.com") {
        router.replace("/admin");
        return;
      }
      setFullName(user.name || "");
      if (user.studentProfile) {
        setMobile(user.studentProfile.mobile || "");
        setCollege(user.studentProfile.college || "");
        setDepartment(user.studentProfile.department || "");
        setYear(user.studentProfile.year || "3rd Year");
        setGithub(user.studentProfile.github || "");
        setLinkedin(user.studentProfile.linkedin || "");
        setResumeUrl(user.studentProfile.resumeUrl || "");
        if (user.studentProfile.skills) {
          const s = Array.isArray(user.studentProfile.skills)
            ? user.studentProfile.skills.join(", ")
            : user.studentProfile.skills;
          setSkills(s);
        }
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const skillsArr = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const uid = firebaseUser?.uid || user?.userId;
      if (uid) {
        await saveStudentProfile(uid, {
          fullName: fullName.trim() || "",
          mobileNumber: mobile.trim() || "",
          college: college.trim() || "",
          department: department.trim() || "",
          yearOfStudy: year || "",
          technicalSkills: skillsArr,
          skills: skillsArr,
          githubUrl: github.trim() || "",
          linkedinUrl: linkedin.trim() || "",
          resumeUrl: resumeUrl || "",
          resumeFileName: resumeFileName || "",
          resumeStoragePath: resumeStoragePath || "",
          onboardingCompleted: true,
          profileCompleted: true,
        });
      }

      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          mobile,
          college,
          department,
          year,
          skills: skillsArr,
          github,
          linkedin,
          resumeUrl,
        }),
      });

      success("✓ Profile setup complete! Welcome to SC TECH.");
      try {
        await refresh();
      } catch {}
      window.location.href = "/dashboard";
    } catch {
      window.location.href = "/dashboard";
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3 z-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 border border-slate-700/60 bg-black">
            <Image src="/logo.png" alt="SC TECH Logo" fill className="object-cover" priority />
          </div>
          <span className="text-2xl font-black text-white">
            SC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">TECH</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-tight">Complete Student Profile</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please provide your real academic details to personalize internship recommendations, hackathon registrations, and digital certificates.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="setup-name">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="setup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="setup-mobile">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="setup-mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="setup-college">
                  College / University *
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="setup-college"
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter your college or university"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="setup-department">
                  Department / Branch
                </label>
                <input
                  id="setup-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Eng"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="setup-skills">
                Key Skills (comma-separated)
              </label>
              <div className="relative">
                <Code2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="setup-skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Next.js, Python, TypeScript, Tailwind CSS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="setup-github">
                  GitHub Profile URL
                </label>
                <div className="relative">
                  <Github className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="setup-github"
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="setup-linkedin">
                  LinkedIn Profile URL
                </label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="setup-linkedin"
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Resume (PDF, DOC, DOCX up to 10MB)
                </label>
                {resumeUrl && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  uploadingResume
                    ? "bg-blue-600/20 border border-blue-500/40 text-blue-300 cursor-not-allowed"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                }`}>
                  {uploadingResume ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                  )}
                  <span>{uploadingResume ? "Uploading Resume..." : resumeUrl ? "Replace Resume File" : "Choose Resume File"}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    onChange={handleResumeUpload}
                    disabled={uploadingResume}
                    className="hidden"
                  />
                </label>

                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/20 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Resume</span>
                  </a>
                )}
              </div>
              {resumeFileName && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>File: <strong className="text-slate-300 font-medium">{resumeFileName}</strong></span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{saving ? "Saving Profile..." : "Save Profile & Continue to Dashboard"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
