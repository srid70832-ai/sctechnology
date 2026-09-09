"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Menu, ChevronDown, User, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface HeaderProps {
  onToggleMobileMenu: () => void;
  unreadCount?: number;
}

export const DashboardHeader: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  unreadCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-20 bg-[#070B14]/85 backdrop-blur-xl border-b border-blue-500/15 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-slate-300 hidden sm:block">
          Student Career Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell with counter */}
        <Link
          href="/notifications"
          className="relative p-2.5 rounded-xl bg-[#0E1729] border border-blue-500/20 hover:border-blue-400/50 text-slate-300 hover:text-white transition shadow-sm hover:shadow-blue-500/10"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl bg-[#0E1729] border border-blue-500/20 hover:border-blue-400/50 transition shadow-sm hover:shadow-blue-500/10"
          >
            <UserAvatar user={user} size={32} />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white max-w-[120px] truncate">
                {user?.name || "Student"}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {user?.role?.toLowerCase() || "student"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/my-plan"
                className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setDropdownOpen(false)}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>My Plan</span>
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-500/10 border-t border-slate-800 mt-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
