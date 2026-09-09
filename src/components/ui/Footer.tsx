import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-[#05080F] border-t border-slate-800/80 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border border-slate-700/60 bg-black flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="SC TECH Logo"
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xl font-black tracking-tight text-white">SC</span>
                  <span className="text-xl font-black tracking-tight text-blue-500">TECH</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 tracking-normal mt-0.5">
                  Build Skills. Build Careers.
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your all-in-one platform for internships, hackathons, real-world projects, online courses and career opportunities.
            </p>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/internships" className="hover:text-blue-400 transition">Internships</Link></li>
              <li><Link href="/hackathons" className="hover:text-blue-400 transition">Hackathons</Link></li>
              <li><Link href="/projects" className="hover:text-blue-400 transition">Real-World Projects</Link></li>
              <li><Link href="/idea-link" className="hover:text-amber-400 transition text-amber-400/90 font-medium">SC Idea Link (AI)</Link></li>
              <li><Link href="/plans" className="hover:text-blue-400 transition">Subscription Plans</Link></li>
              <li><Link href="/courses" className="hover:text-blue-400 transition">Featured Courses</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="hover:text-blue-400 transition">About SC TECH</Link></li>
              <li><Link href="/companies" className="hover:text-blue-400 transition">Top Companies</Link></li>
              <li><Link href="/problem-statements" className="hover:text-blue-400 transition">Problem Statements</Link></li>
              <li><Link href="/hr-sessions" className="hover:text-blue-400 transition">HR & Industry Sessions</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Verification & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Verification & Support</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/verify/SCT-HACK-2026-000123" className="hover:text-blue-400 transition">Verify Certificate</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-blue-400 transition">Cookie Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-blue-400 transition">Refund Policy</Link></li>
              <li><span className="text-emerald-400 font-medium flex items-center gap-1.5 mt-2">● Systems Operational</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <span>Developed by SC TECH</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse-heart inline-block" />
          </div>
          <div className="text-slate-500">
            &copy; 2026 SC TECH. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
