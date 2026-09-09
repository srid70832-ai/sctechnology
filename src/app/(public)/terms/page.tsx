import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-slate-400 text-xs">Last updated: September 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using the SC TECH platform, websites, and associated services, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use our services.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Code of Conduct & Submissions</h2>
          <p>All participants in SC TECH hackathons and projects must submit original engineering work. Plagiarism, unauthorized distribution of proprietary code, or disruptive behavior will result in account suspension and certificate revocation.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Intellectual Property</h2>
          <p>Participants retain all ownership and intellectual property rights in original hackathon projects and submissions made to the platform, subject to evaluation rights granted to SC TECH and authorized judges.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
