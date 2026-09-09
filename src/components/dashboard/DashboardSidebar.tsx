"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  LayoutDashboard,
  User,
  Sparkles,
  FolderGit2,
  Briefcase,
  Trophy,
  Users2,
  Award,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  X,
  FileCode2,
  FileText,
  Lightbulb,
} from "lucide-react";

interface SidebarProps {
  unreadCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({
  unreadCount = 0,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Problem Statements", href: "/problem-statements", icon: FileCode2 },
    { name: "My Plan", href: "/my-plan", icon: Sparkles },
    { name: "Projects & Tasks", href: "/my-projects", icon: FolderGit2 },
    { name: "SC Idea Link", href: "/idea-link", icon: Lightbulb },
    { name: "My Documents", href: "/my-documents", icon: FileText },
    { name: "Internships", href: "/my-internships", icon: Briefcase },
    { name: "Offer Letters", href: "/my-offer-letters", icon: FileText },
    { name: "Hackathons", href: "/my-hackathons", icon: Trophy },
    { name: "HR Sessions", href: "/hr-sessions", icon: Users2 },
    { name: "Certificates", href: "/my-certificates", icon: Award },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Notifications", href: "/notifications", icon: Bell, badge: unreadCount },
    { name: "Support", href: "/support", icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#080C16] border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border border-slate-700/60 bg-black">
                <Image
                  src="/logo.png"
                  alt="SC TECH Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                SC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">TECH</span>
              </span>
            </Link>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Bottom */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
