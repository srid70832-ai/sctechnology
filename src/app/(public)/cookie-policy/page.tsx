import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-white">Cookie Policy</h1>
        <p className="text-slate-400 text-xs">Last updated: September 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. What Are Cookies</h2>
          <p>Cookies are small text files stored on your computer or mobile device when you visit websites. We use essential session cookies to maintain your login state, remember your role preferences, and protect your account against cross-site attacks.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Essential Cookies We Use</h2>
          <p>Our platform uses secure, HTTP-only authentication tokens (`sctech_session_token`) necessary for role-based access control and dashboard navigation.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
