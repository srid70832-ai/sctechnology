"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { saveStudentProfile } from "@/lib/firestore";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  GraduationCap, 
  Code2, 
  Compass, 
  Briefcase, 
  Zap, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, firebaseUser, studentProfile, refresh } = useAuth();
  const { success, error } = useToast();

  const cleanEmail = user?.email?.toLowerCase().trim() || firebaseUser?.email?.toLowerCase().trim() || "";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || cleanEmail === "srics2425@gmail.com" || cleanEmail === "admin@sctech.com";

  // Never ask onboard questions to Admin or Super Admin - redirect directly to /admin
  useEffect(() => {
    if (isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, router]);

  const [step, setStep] = useState(0); // 0 = Welcome, 1..6 = Questions, 7 = Completion
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [careerGoals, setCareerGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [internshipModes, setInternshipModes] = useState<string[]>([]);
  const [preferredDomains, setPreferredDomains] = useState<string[]>([]);

  // Load existing profile if resuming
  useEffect(() => {
    if (isAdmin) return;
    if (studentProfile) {
      if (studentProfile.onboardingCompleted) {
        router.push("/dashboard");
        return;
      }
      if (studentProfile.fullName) setFullName(studentProfile.fullName);
      else if (firebaseUser?.displayName) setFullName(firebaseUser.displayName);

      if (studentProfile.department) setDepartment(studentProfile.department);
      if (studentProfile.year) setYear(studentProfile.year);
      if (studentProfile.skills) setSkills(studentProfile.skills);
      if (studentProfile.careerGoals) setCareerGoals(studentProfile.careerGoals);
      if (studentProfile.experienceLevel) setExperienceLevel(studentProfile.experienceLevel);
      if (studentProfile.internshipPreferences) setInternshipModes(studentProfile.internshipPreferences);
      if (studentProfile.preferredDomains) setPreferredDomains(studentProfile.preferredDomains);
      if (studentProfile.onboardingStep && studentProfile.onboardingStep > 0 && studentProfile.onboardingStep <= 6) {
        setStep(studentProfile.onboardingStep);
      }
    } else if (firebaseUser?.displayName) {
      setFullName(firebaseUser.displayName);
    }
  }, [studentProfile, firebaseUser, router, isAdmin]);

  const saveProgress = async (nextStep: number, completed = false) => {
    const targetUid = firebaseUser?.uid || user?.userId || (user as any)?.uid || (user as any)?.id;
    if (!targetUid) return;
    const payload = {
      uid: targetUid,
      fullName: fullName.trim() || firebaseUser?.displayName || user?.name || "Student",
      email: firebaseUser?.email || user?.email || "",
      photoURL: firebaseUser?.photoURL || null,
      department: department || "",
      year: year || "",
      skills: Array.isArray(skills) ? skills : [],
      technicalSkills: Array.isArray(skills) ? skills : [],
      careerGoals: Array.isArray(careerGoals) ? careerGoals : [],
      experienceLevel: experienceLevel || "Beginner",
      internshipPreferences: Array.isArray(internshipModes) ? internshipModes : [],
      preferredDomains: Array.isArray(preferredDomains) ? preferredDomains : [],
      onboardingStep: nextStep,
      onboardingCompleted: completed,
      profileCompleted: completed,
    };
    try {
      await Promise.race([
        saveStudentProfile(targetUid, payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
      ]);
    } catch (saveErr) {
      console.warn("Progress save notice:", saveErr);
    }
  };

  const handleNext = async () => {
    setDirection(1);
    const nextStep = step + 1;
    setStep(nextStep);
    await saveProgress(nextStep);
  };

  const handleSkipStep = async () => {
    setDirection(1);
    if (step >= 6) {
      await handleSkipOnboarding();
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      await saveProgress(nextStep);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkipOnboarding = async () => {
    setSaving(true);
    try {
      const targetUid = firebaseUser?.uid || user?.userId || (user as any)?.uid || (user as any)?.id;
      if (targetUid) {
        try {
          await Promise.race([
            saveStudentProfile(targetUid, {
              uid: targetUid,
              fullName: fullName.trim() || firebaseUser?.displayName || user?.name || "Student",
              email: firebaseUser?.email || user?.email || "",
              onboardingStep: 7,
              onboardingCompleted: true,
              profileCompleted: true,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500)),
          ]);
        } catch (saveErr) {
          console.warn("Skip save notice:", saveErr);
        }
        try {
          await refresh();
        } catch {}
      }
      success("Onboarding skipped. Redirecting to Dashboard...");
    } finally {
      window.location.href = "/dashboard";
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const targetUid = firebaseUser?.uid || user?.userId || (user as any)?.uid || (user as any)?.id;
      if (targetUid) {
        try {
          await Promise.race([
            saveProgress(7, true),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 1500)),
          ]);
        } catch (saveErr) {
          console.warn("Finish save notice:", saveErr);
        }
        try {
          await refresh();
        } catch {}
      }
      success("Onboarding completed! Redirecting to Dashboard...");
    } finally {
      window.location.href = "/dashboard";
    }
  };

  // Toggle multi-select helper
  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xs text-slate-400">Redirecting to Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Top Header & Progress */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between z-10 pt-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-700/60 bg-black">
            <Image src="/logo.png" alt="SC TECH Logo" fill className="object-cover" priority />
          </div>
          <span className="text-xl font-black text-white">
            SC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">TECH</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {step >= 1 && step <= 6 && (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
              Step {step} of 6
            </span>
          )}
          {step < 7 && (
            <button
              type="button"
              onClick={handleSkipOnboarding}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700/70 bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span>Skip for now</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </header>

      {/* Progress Bar (Visible on Steps 1 to 6) */}
      {step >= 1 && step <= 6 && (
        <div className="max-w-2xl mx-auto w-full my-2 z-10">
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              initial={{ width: `${((step - 1) / 6) * 100}%` }}
              animate={{ width: `${(step / 6) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Main Form Center */}
      <main className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center my-6 z-10">
        <AnimatePresence mode="wait" custom={direction}>
          
          {/* STEP 0: WELCOME SCREEN */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="text-center space-y-6 bg-slate-900/90 border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                <Sparkles className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Welcome to SC TECH 👋
                </h1>
                <p className="text-base text-slate-300 font-medium">
                  Let&apos;s personalize your experience.
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto pt-1">
                  Answer a few quick questions so we can show you relevant internship openings, hackathons, and real-world project repositories.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Let&apos;s Start</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSkipOnboarding}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 font-semibold text-sm transition inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Skip Onboarding</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: WHAT SHOULD WE CALL YOU */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 1 • Identity</span>
                <h2 className="text-2xl font-black text-white">What should we call you?</h2>
                <p className="text-xs text-slate-400">This name will be displayed on your portfolio, certificates, and applications.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSkipStep}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Skip this step
                </button>
                <button
                  onClick={handleNext}
                  disabled={!fullName.trim()}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: WHAT ARE YOU CURRENTLY STUDYING */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 2 • Education</span>
                <h2 className="text-2xl font-black text-white">What are you currently studying?</h2>
                <p className="text-xs text-slate-400">Select your primary department and graduation year.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Field of Study</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      "Computer Science",
                      "Information Technology",
                      "Electronics",
                      "Mechanical",
                      "Civil",
                      "AI / Data Science",
                      "Other",
                    ].map((dept) => {
                      const isSelected = department === dept;
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setDepartment(dept)}
                          className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <span>{dept}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Which year are you in?</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Other"].map((yr) => {
                      const isSelected = year === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setYear(yr)}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-semibold text-center transition ${
                            isSelected
                              ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!department || !year}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: WHAT SKILLS ARE YOU INTERESTED IN */}
          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 3 • Technical Interests</span>
                <h2 className="text-2xl font-black text-white">What skills are you interested in?</h2>
                <p className="text-xs text-slate-400">Select all skills you want to practice and build projects with.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {[
                  "Java",
                  "Python",
                  "JavaScript",
                  "React",
                  "Node.js",
                  "HTML/CSS",
                  "SQL",
                  "UI/UX",
                  "AI/ML",
                  "Data Science",
                  "Cybersecurity",
                  "Cloud",
                  "Mobile Development",
                ].map((sk) => {
                  const isSelected = skills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleArrayItem(skills, sk, setSkills)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span>{sk}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={skills.length === 0}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: WHAT ARE YOU LOOKING FOR AT SC TECH */}
          {step === 4 && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 4 • Goals</span>
                <h2 className="text-2xl font-black text-white">What are you looking for at SC TECH?</h2>
                <p className="text-xs text-slate-400">Select all features and opportunities you are seeking.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "💼 Internships", val: "Internships" },
                  { label: "🏆 Hackathons", val: "Hackathons" },
                  { label: "💻 Real-world Projects", val: "Real-world Projects" },
                  { label: "🧑‍💼 HR Interaction", val: "HR Interaction" },
                  { label: "📜 Certificates", val: "Certificates" },
                  { label: "🚀 Career Opportunities", val: "Career Opportunities" },
                  { label: "📚 Skill Development", val: "Skill Development" },
                ].map((item) => {
                  const isSelected = careerGoals.includes(item.val);
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => toggleArrayItem(careerGoals, item.val, setCareerGoals)}
                      className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={careerGoals.length === 0}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: EXPERIENCE LEVEL */}
          {step === 5 && (
            <motion.div
              key="step-5"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 5 • Proficiency</span>
                <h2 className="text-2xl font-black text-white">What&apos;s your current experience level?</h2>
                <p className="text-xs text-slate-400">Choose the level that best describes you.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { level: "Beginner", icon: "🌱", desc: "Learning fundamentals and building first projects" },
                  { level: "Intermediate", icon: "⚡", desc: "Comfortable with frameworks & databases" },
                  { level: "Advanced", icon: "🔥", desc: "Experienced with full-stack architecture & deployment" },
                ].map((item) => {
                  const isSelected = experienceLevel === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setExperienceLevel(item.level as any)}
                      className={`p-5 rounded-2xl border text-left transition flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-xl shadow-blue-500/20 scale-[1.02]"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-2xl">{item.icon}</div>
                      <div>
                        <div className="text-sm font-bold text-white mb-1">{item.level}</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: INTERNSHIP PREFERENCES */}
          {step === 6 && (
            <motion.div
              key="step-6"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 6 • Preferences</span>
                <h2 className="text-2xl font-black text-white">What type of internship interests you?</h2>
                <p className="text-xs text-slate-400">Select work modes and preferred technical domains.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Work Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Remote", "On-site", "Hybrid"].map((mode) => {
                      const isSelected = internshipModes.includes(mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => toggleArrayItem(internshipModes, mode, setInternshipModes)}
                          className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                            isSelected
                              ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Domains of Interest</label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {[
                      "Frontend",
                      "Backend",
                      "Full Stack",
                      "Mobile",
                      "AI/ML",
                      "Data",
                      "Cloud",
                      "Cybersecurity",
                      "Other",
                    ].map((dom) => {
                      const isSelected = preferredDomains.includes(dom);
                      return (
                        <button
                          key={dom}
                          type="button"
                          onClick={() => toggleArrayItem(preferredDomains, dom, setPreferredDomains)}
                          className={`p-2.5 rounded-xl border text-[11px] font-semibold text-left transition flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <span>{dom}</span>
                          {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipOnboarding}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition"
                  >
                    Skip & Finish
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Complete Onboarding</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 7: COMPLETION SCREEN */}
          {step === 7 && (
            <motion.div
              key="step-7"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="text-center space-y-6 bg-slate-900/90 border border-slate-800 p-8 sm:p-12 rounded-3xl shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  You&apos;re all set! 🎉
                </h1>
                <p className="text-base text-slate-300 font-medium">
                  Your SC TECH experience is ready.
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto pt-1">
                  We&apos;ve customized your dashboard with opportunities matching your department, skills, and career preferences.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving preferences...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter SC TECH</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 z-10 pb-2">
        Developed by SC TECH ❤️ • &copy; 2026 SC TECH. All rights reserved.
      </footer>
    </div>
  );
}
