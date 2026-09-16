"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { getStudentProfile, saveStudentProfile, cleanStringOrNull, removeUndefinedValues, StudentProfileData } from "@/lib/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { 
  User, 
  Phone, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Code2, 
  FileText, 
  Github, 
  Linkedin, 
  Globe, 
  UploadCloud, 
  Check, 
  X, 
  Plus, 
  Save, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

const POPULAR_SKILLS = [
  "Java",
  "Python",
  "JavaScript",
  "React",
  "Node.js",
  "HTML/CSS",
  "SQL",
  "AI/ML",
  "UI/UX",
  "Cloud",
  "Cybersecurity",
  "TypeScript",
  "Next.js",
  "Tailwind CSS",
  "Docker",
  "Git & GitHub",
];

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence & Data Science",
  "Cybersecurity",
  "Other",
];

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Graduate",
  "Other",
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMandatoryMode = searchParams.get("complete") === "true";

  const { user, firebaseUser, studentProfile, refresh } = useAuth();
  const { success, error } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [bio, setBio] = useState("");

  // Optional Fields
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeStoragePath, setResumeStoragePath] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);

  // Photo Upload State
  const [photoURL, setPhotoURL] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  // Validation Errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Populate actual data from Firestore after Auth is resolved
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const studentRef = doc(db, "students", currentUser.uid);
        const snapshot = await getDoc(studentRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setFullName(data.fullName || currentUser.displayName || "");
          setPhotoURL(data.photoURL || currentUser.photoURL || "");
          setMobileNumber(data.mobileNumber || "");
          setCollege(data.college || "");
          if (data.department) {
            if (DEPARTMENTS.includes(data.department)) {
              setDepartment(data.department);
            } else {
              setDepartment("Other");
              setCustomDepartment(data.department);
            }
          }
          setYearOfStudy(data.yearOfStudy || data.year || "");
          
          if (data.technicalSkills && Array.isArray(data.technicalSkills)) {
            setTechnicalSkills(data.technicalSkills);
          } else if (data.skills && Array.isArray(data.skills)) {
            setTechnicalSkills(data.skills);
          }

          setBio(data.bio || "");
          setGithubUrl(data.githubUrl || "");
          setLinkedinUrl(data.linkedinUrl || "");
          setPortfolioUrl(data.portfolioUrl || "");
          setResumeUrl(data.resumeUrl || "");
          setResumeFileName(data.resumeFileName || "");
          setResumeStoragePath(data.resumeStoragePath || "");
        } else {
          // New student: use real Google/Firebase displayName if available
          if (currentUser.displayName) {
            setFullName(currentUser.displayName);
          }
          if (currentUser.photoURL) {
            setPhotoURL(currentUser.photoURL);
          }
        }
      } catch (err) {
        console.error("Error fetching student profile from Firestore:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real Profile Completion Calculation based on 7 mandatory fields
  const completionStats = useMemo(() => {
    const activeDept = department === "Other" ? customDepartment.trim() : department.trim();
    const checks = [
      fullName.trim().length >= 2,
      mobileNumber.trim().length >= 10,
      college.trim().length >= 2,
      activeDept.length > 0,
      yearOfStudy.length > 0,
      technicalSkills.length > 0,
      bio.trim().length >= 10,
    ];
    const completedCount = checks.filter(Boolean).length;
    const percentage = Math.round((completedCount / 7) * 100);
    return {
      completedCount,
      totalCount: 7,
      percentage,
      isFullyComplete: completedCount === 7,
    };
  }, [fullName, mobileNumber, college, department, customDepartment, yearOfStudy, technicalSkills, bio]);

  // Skill management
  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !technicalSkills.includes(trimmed)) {
      setTechnicalSkills([...technicalSkills, trimmed]);
      setCustomSkillInput("");
    }
  };

  const handleTogglePopularSkill = (skill: string) => {
    if (technicalSkills.includes(skill)) {
      setTechnicalSkills(technicalSkills.filter((s) => s !== skill));
    } else {
      setTechnicalSkills([...technicalSkills, skill]);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setTechnicalSkills(technicalSkills.filter((s) => s !== skill));
  };

  // Profile Photo Upload (Firebase Storage & Prisma Sync)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uid = firebaseUser?.uid || user?.userId;
    if (!uid) {
      error("You must be signed in to upload your profile photo.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error("Please upload an image file under 5 MB.");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      error("Please upload a valid image (PNG, JPG, JPEG, WebP).");
      e.target.value = "";
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `avatars/${uid}/avatar-${Date.now()}.${ext}`;
      const storageRef = ref(storage, storagePath);

      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || "image/jpeg",
        customMetadata: { uploadedBy: uid },
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Save to Firestore students/{uid}
      await saveStudentProfile(uid, {
        photoURL: downloadUrl,
      });

      // Sync to Prisma User.avatarUrl
      await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: downloadUrl }),
      });

      setPhotoURL(downloadUrl);
      await refresh();
      success("✓ Profile photo updated successfully!");
    } catch (err: any) {
      console.warn("Storage photo upload attempt:", err);
      // Fallback to base64 Data URL
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          if (uid && base64) {
            await saveStudentProfile(uid, { photoURL: base64 });
            await fetch("/api/student/profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatarUrl: base64 }),
            });
            setPhotoURL(base64);
            await refresh();
            success("✓ Profile photo updated!");
          }
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        error("Failed to upload profile photo. Please try again.");
      }
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  // Remove Profile Photo and Restore Default SC TECH Avatar
  const handleRemovePhoto = async () => {
    const uid = firebaseUser?.uid || user?.userId;
    if (!uid) return;

    setDeletingPhoto(true);
    try {
      await saveStudentProfile(uid, {
        photoURL: null,
      });

      await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });

      setPhotoURL("");
      await refresh();
      success("Profile photo removed. Restored official SC TECH default avatar.");
    } catch (err) {
      console.error("Error removing photo:", err);
      error("Failed to remove photo. Please try again.");
    } finally {
      setDeletingPhoto(false);
    }
  };

  // Direct Firebase Storage Resume Upload
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!firebaseUser?.uid) {
      error("You must be logged in with Firebase to upload your resume.");
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
    const validMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
    ];

    if (!validExtensions.includes(ext) && !validMimes.includes(file.type)) {
      error("Please upload a valid PDF, DOC, or DOCX resume.");
      e.target.value = "";
      return;
    }

    setUploadingResume(true);
    const oldStoragePath = resumeStoragePath;

    try {
      const sanitizedExt = ext.replace(".", "") || "pdf";
      const storagePath = `resumes/${firebaseUser.uid}/resume-${Date.now()}.${sanitizedExt}`;
      const storageRef = ref(storage, storagePath);

      // Upload directly to Firebase Storage with authenticated user UID
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || "application/pdf",
        customMetadata: {
          originalName: file.name,
          uploadedBy: firebaseUser.uid,
        },
      });

      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Save metadata directly to Firestore students/{uid}
      await saveStudentProfile(firebaseUser.uid, {
        resumeUrl: downloadUrl,
        resumeStoragePath: storagePath,
        resumeFileName: file.name,
        resumeUploadedAt: new Date().toISOString(),
      });

      setResumeUrl(downloadUrl);
      setResumeFileName(file.name);
      setResumeStoragePath(storagePath);
      await refresh();

      success("✓ Resume uploaded successfully.");

      // Clean up previous storage file if replacing
      if (oldStoragePath && oldStoragePath !== storagePath) {
        try {
          const oldRef = ref(storage, oldStoragePath);
          await deleteObject(oldRef);
        } catch (cleanupErr) {
          console.warn("Previous storage resume cleanup:", cleanupErr);
        }
      }
    } catch (err: any) {
      console.error("Firebase Storage resume upload error:", err);
      if (err?.code === "storage/unauthorized") {
        error("Your account does not have permission to upload files to storage.");
      } else if (err?.code === "storage/canceled") {
        error("Resume upload was cancelled.");
      } else {
        error("Resume upload failed. Please try again.");
      }
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  };

  // Remove Resume from Firebase Storage and Firestore
  const handleRemoveResume = async () => {
    if (!firebaseUser?.uid) return;
    const currentPath = resumeStoragePath;

    setDeletingResume(true);
    try {
      // Clear Firestore fields
      await saveStudentProfile(firebaseUser.uid, {
        resumeUrl: "",
        resumeFileName: "",
        resumeStoragePath: "",
      });

      setResumeUrl("");
      setResumeFileName("");
      setResumeStoragePath("");
      await refresh();

      // Delete binary file from Firebase Storage
      if (currentPath) {
        try {
          const fileRef = ref(storage, currentPath);
          await deleteObject(fileRef);
        } catch (delErr) {
          console.warn("Storage delete:", delErr);
        }
      }

      success("Resume removed successfully.");
    } catch (err) {
      console.error("Error removing resume:", err);
      error("Failed to remove resume. Please try again.");
    } finally {
      setDeletingResume(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Please enter your full name (minimum 2 characters).";
    }

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      errors.mobileNumber = "Please enter a valid 10-digit mobile number.";
    }

    if (!college.trim() || college.trim().length < 2) {
      errors.college = "Please enter your college / university name.";
    }

    const activeDept = department === "Other" ? customDepartment.trim() : department.trim();
    if (!activeDept) {
      errors.department = "Please select or specify your department.";
    }

    if (!yearOfStudy) {
      errors.yearOfStudy = "Please select your year of study.";
    }

    if (technicalSkills.length === 0) {
      errors.technicalSkills = "Please select or add at least one technical skill.";
    }

    if (!bio.trim() || bio.trim().length < 10) {
      errors.bio = "Please enter your bio / summary (minimum 10 characters).";
    }

    // Optional URL validations (only validate syntax if user provided a non-empty string)
    if (githubUrl.trim() && !githubUrl.startsWith("http")) {
      errors.githubUrl = "Please enter a valid URL (e.g. https://github.com/...)";
    }
    if (linkedinUrl.trim() && !linkedinUrl.startsWith("http")) {
      errors.linkedinUrl = "Please enter a valid URL (e.g. https://linkedin.com/in/...)";
    }
    if (portfolioUrl.trim() && !portfolioUrl.startsWith("http")) {
      errors.portfolioUrl = "Please enter a valid URL (e.g. https://...)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      error("Please fill in all mandatory fields marked with *");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      error("Please sign in again.");
      return;
    }

    const uid = user.uid;
    setSaving(true);
    try {
      const activeDept = department === "Other" ? customDepartment.trim() : department.trim();

      const clean = (value: any) => {
        if (value === undefined || value === null) return null;
        if (typeof value === "string") {
          const v = value.trim();
          return v === "" ? null : v;
        }
        return value;
      };

      const profileData = {
        uid: uid,
        email: user.email ?? null,
        displayName: user.displayName ?? clean(fullName) ?? "Student",
        photoURL: user.photoURL ?? null,

        fullName: clean(fullName) || "Student",
        mobileNumber: clean(mobileNumber) || "",
        college: clean(college) || "",
        department: clean(activeDept) || "",
        yearOfStudy: clean(yearOfStudy) || "",

        technicalSkills: Array.isArray(technicalSkills)
          ? technicalSkills.filter(Boolean)
          : [],

        githubUrl: clean(githubUrl),
        linkedinUrl: clean(linkedinUrl),
        portfolioUrl: clean(portfolioUrl),
        resumeUrl: clean(resumeUrl),
        resumeFileName: clean(resumeFileName),
        resumeStoragePath: clean(resumeStoragePath),

        bio: clean(bio) || "",

        profileCompleted: completionStats.isFullyComplete,
        profileCompletionPercentage: completionStats.percentage,

        updatedAt: serverTimestamp(),
      };

      const sanitizedData = removeUndefinedValues(profileData);
      const studentRef = doc(db, "students", uid);
      await setDoc(studentRef, sanitizedData, { merge: true });

      try {
        await refresh();
      } catch {}

      success("Profile saved successfully! Redirecting to Dashboard...");

      const redirectParam = searchParams?.get("redirect");
      const targetUrl = redirectParam && !redirectParam.startsWith("/profile") ? redirectParam : "/dashboard";
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 700);
    } catch (err: any) {
      console.error("Profile save error:", err);
      if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
        error("Your account does not have permission to update this profile.");
      } else {
        error("Unable to save your profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex">
      {/* Sidebar */}
      <DashboardSidebar
        unreadCount={0}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl">
          
          {/* Header Title Banner */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <span>{isMandatoryMode || !studentProfile?.profileCompleted ? "Complete Your Profile" : "Student Profile Settings"}</span>
              <Sparkles className="w-5 h-5 text-blue-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {isMandatoryMode || !studentProfile?.profileCompleted
                ? "Complete the required information to unlock your full SC TECH experience."
                : "Update your personal details, academic background, and technical skillset."}
            </p>
          </div>

          {/* Real Profile Completion Card with Animated Progress */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile Completion</span>
                <p className="text-[11px] text-slate-500">
                  {completionStats.completedCount} of {completionStats.totalCount} mandatory fields completed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">{completionStats.percentage}%</span>
                {completionStats.isFullyComplete && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/40"
                initial={{ width: 0 }}
                animate={{ width: `${completionStats.percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Main Form Area */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span>Loading your profile details...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* 0. PROFILE PHOTO / AVATAR */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0B1220] border border-blue-500/20 shadow-md">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative group">
                      <UserAvatar user={{ avatarUrl: photoURL || user?.avatarUrl, name: fullName }} size={84} className="border-2 border-blue-500/40 shadow-xl" />
                      <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-[10px] font-semibold">
                        <Camera className="w-5 h-5 mb-0.5 text-blue-400" />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto || deletingPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1.5">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h4 className="text-sm font-bold text-white">Profile Photo</h4>
                        {photoURL || user?.avatarUrl ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                            Custom Photo Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-semibold border border-blue-500/30">
                            Default SC TECH Avatar
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 max-w-md">
                        {photoURL || user?.avatarUrl
                          ? "Your custom photo is displayed across your personal profile and dashboard."
                          : "The official SC TECH logo is used as your default avatar. You can upload your own photo anytime."}
                      </p>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 cursor-pointer transition active:scale-95">
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>{photoURL || user?.avatarUrl ? "Upload New Photo" : "Upload Photo"}</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto || deletingPhoto}
                            className="hidden"
                          />
                        </label>

                        {(photoURL || user?.avatarUrl) && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={uploadingPhoto || deletingPhoto}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition active:scale-95"
                          >
                            {deletingPhoto ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>Remove & Restore Default</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. PERSONAL INFORMATION */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Personal Information</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition ${
                            fieldErrors.fullName ? "border-rose-500/80" : "border-slate-800"
                          }`}
                        />
                      </div>
                      {fieldErrors.fullName && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.fullName}</span>
                        </p>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Mobile Number <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition ${
                            fieldErrors.mobileNumber ? "border-rose-500/80" : "border-slate-800"
                          }`}
                        />
                      </div>
                      {fieldErrors.mobileNumber && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.mobileNumber}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. EDUCATION */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>Education & Academics</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* College / University */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        College / University <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="Enter your college/university"
                        className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition ${
                          fieldErrors.college ? "border-rose-500/80" : "border-slate-800"
                        }`}
                      />
                      {fieldErrors.college && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.college}</span>
                        </p>
                      )}
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Department <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                          fieldErrors.department ? "border-rose-500/80" : "border-slate-800"
                        }`}
                      >
                        <option value="">Select your department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      {department === "Other" && (
                        <input
                          type="text"
                          value={customDepartment}
                          onChange={(e) => setCustomDepartment(e.target.value)}
                          placeholder="Specify your department"
                          className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      )}
                      {fieldErrors.department && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.department}</span>
                        </p>
                      )}
                    </div>

                    {/* Year of Study */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Year of Study <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                          fieldErrors.yearOfStudy ? "border-rose-500/80" : "border-slate-800"
                        }`}
                      >
                        <option value="">Select your year</option>
                        {YEARS.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.yearOfStudy && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors.yearOfStudy}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. TECHNICAL SKILLS UI */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-violet-400" />
                      <span>Technical Skills <span className="text-rose-400">*</span></span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {technicalSkills.length} selected
                    </span>
                  </div>

                  {/* Selected Skills Chips */}
                  {technicalSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                      {technicalSkills.map((sk) => (
                        <span
                          key={sk}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-semibold shadow-sm"
                        >
                          <span>{sk}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(sk)}
                            className="text-blue-400 hover:text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Custom Skill Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      placeholder="Type a skill and click Add..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Skill</span>
                    </button>
                  </div>

                  {/* Popular Skills Quick-Pick */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2">Popular Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SKILLS.map((sk) => {
                        const isSelected = technicalSkills.includes(sk);
                        return (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => handleTogglePopularSkill(sk)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-medium border transition ${
                              isSelected
                                ? "bg-blue-600/30 border-blue-500 text-blue-200"
                                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            {sk} {isSelected ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {fieldErrors.technicalSkills && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.technicalSkills}</span>
                    </p>
                  )}
                </div>

                {/* 4. BIO / SUMMARY */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Bio / Summary <span className="text-rose-400">*</span></span>
                    </h3>
                    <span className={`text-[11px] font-semibold ${bio.length > 500 ? "text-rose-400" : "text-slate-400"}`}>
                      {bio.length} / 500
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself, your technical interests, and career ambitions..."
                    className={`w-full bg-slate-950 border rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none ${
                      fieldErrors.bio ? "border-rose-500/80" : "border-slate-800"
                    }`}
                  />
                  {fieldErrors.bio && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.bio}</span>
                    </p>
                  )}
                </div>

                {/* 5. SOCIAL LINKS & RESUME (OPTIONAL) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>Social Links & Resume (Optional)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* GitHub */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub Profile URL</label>
                      <div className="relative">
                        <Github className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/yourhandle"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {fieldErrors.githubUrl && (
                        <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.githubUrl}</p>
                      )}
                    </div>

                    {/* LinkedIn */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">LinkedIn Profile URL</label>
                      <div className="relative">
                        <Linkedin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {fieldErrors.linkedinUrl && (
                        <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.linkedinUrl}</p>
                      )}
                    </div>

                    {/* Portfolio */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Personal Portfolio URL</label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://yourportfolio.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      {fieldErrors.portfolioUrl && (
                        <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.portfolioUrl}</p>
                      )}
                    </div>
                  </div>

                  {/* Resume Upload & Management Section */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-300">
                        Upload Resume <span className="text-slate-500 font-normal">(PDF, DOC, DOCX up to 10MB)</span>
                      </label>
                      {resumeUrl && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {resumeUrl ? (
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                              <span className="text-xs text-slate-200 font-medium truncate">
                                {resumeFileName || "Student_Resume.pdf"}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                              Active
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                            {/* View Resume */}
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/20 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Resume</span>
                            </a>

                            {/* Replace Resume */}
                            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                              uploadingResume
                                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 cursor-not-allowed"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            }`}>
                              {uploadingResume ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                              )}
                              <span>{uploadingResume ? "Uploading..." : "Replace Resume"}</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,application/pdf"
                                onChange={handleResumeUpload}
                                disabled={uploadingResume || deletingResume}
                                className="hidden"
                              />
                            </label>

                            {/* Remove Resume */}
                            <button
                              type="button"
                              onClick={handleRemoveResume}
                              disabled={deletingResume || uploadingResume}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition disabled:opacity-50"
                            >
                              {deletingResume ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>{deletingResume ? "Removing..." : "Remove"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            uploadingResume 
                              ? "bg-blue-600/20 border border-blue-500/40 text-blue-300 cursor-not-allowed" 
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm"
                          }`}>
                            {uploadingResume ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            ) : (
                              <UploadCloud className="w-4 h-4 text-blue-400" />
                            )}
                            <span>{uploadingResume ? "Uploading resume..." : "Choose Resume File"}</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf"
                              onChange={handleResumeUpload}
                              disabled={uploadingResume}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-slate-400">
                    Fields marked with <span className="text-rose-400 font-bold">*</span> are required.
                  </span>

                  <button
                    type="submit"
                    disabled={saving || uploadingResume}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving to Firestore...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isMandatoryMode || !studentProfile?.profileCompleted ? "Save & Continue →" : "Save Changes"}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </main>
      </div>

      {/* Success Modal after completing mandatory profile */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6 text-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Profile completed! 🎉</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your student profile has been verified and saved to SC TECH. You&apos;re now ready to explore internships, hackathons, and projects.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-slate-400">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
