import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Code2, Target, Heart, Shield, Users, Trophy } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />

      <main className="flex-1 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            About SC TECH
          </h1>
          <p className="text-sm text-blue-400 font-bold">
            Build Skills. Build Projects. Build Your Career.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            SC TECH was founded to bridge the gap between academic education and industry engineering standards through hands-on project work, competitive hackathons, and transparent internship pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Our Mission</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empower every ambitious developer with production-grade engineering exposure, verifiable credentials, and authentic career pathways.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Trust & Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every certificate issued on SC TECH contains cryptographic hashes and QR codes verifiable in real-time by hiring managers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Competitive Excellence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We host high-stakes student hackathons judged independently by principal engineers and researchers across India.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
