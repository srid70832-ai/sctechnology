import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-slate-400 text-xs">Last updated: September 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, complete your student profile, submit projects, register for hackathons, or contact our support team. This includes your name, email address, academic institution, technical skills, and optional external links (GitHub, LinkedIn, Portfolio).</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Use of Information</h2>
          <p>We use the information we collect to operate, maintain, and enhance the SC TECH platform; process transactions and deliver digital certificates; enable project evaluation and internship matching; and communicate important updates regarding events and platform services.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Data Protection & Security</h2>
          <p>We implement industry-standard cryptographic encryption, secure authentication tokens, and access control policies to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
