"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const { user, loginWithEmail, loginWithGoogle } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const resolveTarget = (role?: string, isAdmin?: boolean) => {
    const isUserAdmin = isAdmin || role === "ADMIN" || role === "SUPER_ADMIN";
    if (isUserAdmin) {
      return redirectParam && redirectParam.startsWith("/admin") ? redirectParam : "/admin";
    }
    if (role === "JUDGE") return "/judge";
    if (role === "COMPANY" || role === "HR") return "/company";
    return redirectParam && !redirectParam.startsWith("/admin") ? redirectParam : "/dashboard";
  };

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (user) {
      const target = resolveTarget(user.role);
      router.replace(target);
    }
  }, [user, router, redirectParam]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoadingEmail(true);

    try {
      const res = await loginWithEmail(email, password);
      if (res.success) {
        success("Signed in successfully!");
        if (res.onboardingRequired) {
          router.replace("/onboarding");
        } else {
          const target = resolveTarget((res as any).role, (res as any).isAdmin);
          router.replace(target);
        }
      } else {
        error(res.error || "Invalid email or password");
      }
    } catch {
      error("Login authentication error");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        success("Signed in with Google successfully!");
        if (res.onboardingRequired) {
          router.replace("/onboarding");
        } else {
          const target = resolveTarget((res as any).role, (res as any).isAdmin);
          router.replace(target);
        }
      } else if (res.error) {
        error(res.error);
      }
    } catch {
      error("Unable to sign in with Google. Please try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const isFormDisabled = loadingEmail || loadingGoogle;

  return (
    <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-email">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={isFormDisabled}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="login-password">
              Password
            </label>
            <Link href="/forgot-password" className="text-[11px] text-blue-400 hover:text-blue-300 transition">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isFormDisabled}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isFormDisabled}
          aria-label="Sign in to your account"
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 active:scale-95"
        >
          {loadingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span>{loadingEmail ? "Signing in..." : "Sign In"}</span>
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-4">
        <div className="flex-1 border-t border-slate-800"></div>
        <span className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">OR</span>
        <div className="flex-1 border-t border-slate-800"></div>
      </div>

      {/* Real Firebase Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isFormDisabled}
        aria-label="Continue with Google"
        className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:shadow-lg transform active:scale-95 cursor-pointer"
      >
        {loadingGoogle ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-slate-400 pt-2">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 border border-slate-700/60 bg-black group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="SC TECH Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="text-2xl font-black text-white">
            SC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">TECH</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to your account</h2>
        <p className="text-xs text-slate-400">
          Build Skills. Build Projects. Build Your Career.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
