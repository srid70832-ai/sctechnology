"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SearchModal } from "@/components/ui/SearchModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { 
  Menu, 
  X, 
  User, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Briefcase,
  Bell,
  Search,
  Lightbulb,
  Gift
} from "lucide-react";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Listen for Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Companies", href: "/companies" },
    { name: "Courses", href: "/courses" },
    { name: "Hackathons", href: "/hackathons" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Projects", href: "/projects" },
    { name: "Idea Link", href: "/idea-link" },
    { name: "Refer & Earn", href: "/referrals" },
    { name: "Plans", href: "/plans" },
    { name: "About Us", href: "/about" },
  ];

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return "/admin";
    if (user.role === "JUDGE") return "/judge";
    if (user.role === "COMPANY" || user.role === "HR") return "/company";
    return "/dashboard";
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo matching reference */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 border border-slate-700/60 bg-black flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="SC TECH Logo"
                fill
                sizes="40px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black tracking-tight text-white">SC</span>
                <span className="text-xl font-black tracking-tight text-blue-500">TECH</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-normal mt-0.5 whitespace-nowrap">
                Build Skills. Build Careers.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  prefetch={true}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 ${
                    isActive
                      ? "text-white bg-[#132240] border border-blue-500/30 font-semibold shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls: Search + Notification Bell + User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search Bar matching Reference with Ctrl K shortcut */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center justify-between gap-3 px-3.5 py-1.5 w-48 xl:w-56 rounded-full bg-[#0D1527] border border-slate-800 hover:border-blue-500/40 text-xs text-slate-400 hover:text-slate-200 transition group shadow-inner"
            >
              <span className="truncate">Search opportunities...</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded">
                Ctrl K
              </kbd>
            </button>

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#070B14] animate-pulse" />
              )}
            </Link>

            {/* User Profile Pill matching Reference */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full bg-[#0D1527]/90 hover:bg-[#132240] border border-blue-500/20 hover:border-blue-400/50 text-slate-200 transition shadow-sm hover:shadow-blue-500/10"
                >
                  <UserAvatar user={user} size={28} />
                  <span className="text-xs font-semibold max-w-[100px] truncate text-slate-200">
                    {user.name || "User"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/25 border border-blue-500/40 text-blue-300 font-bold uppercase tracking-wider">
                    {user.role || "STUDENT"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0C162E]/95 border border-blue-500/30 shadow-2xl backdrop-blur-xl py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800 text-xs text-slate-400">
                      Signed in as <span className="text-slate-200 font-medium block truncate">{user.email}</span>
                    </div>
                    
                    <Link
                      href={getDashboardLink()}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-400" />
                      Dashboard
                    </Link>

                    {user.role === "STUDENT" && (
                      <>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <User className="w-4 h-4 text-emerald-400" />
                          My Profile
                        </Link>
                        <Link
                          href="/my-plan"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          My Subscription
                        </Link>
                        <Link
                          href="/idea-link"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-amber-300 hover:text-white hover:bg-slate-800 transition"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          SC Idea Link
                        </Link>
                        <Link
                          href="/referrals"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-purple-300 hover:text-white hover:bg-slate-800 transition"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Gift className="w-4 h-4 text-purple-400" />
                          Refer & Earn Rewards
                        </Link>
                      </>
                    )}

                    {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                      <>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          Admin Control Panel
                        </Link>
                        <Link
                          href="/admin/idea-link"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-amber-300 hover:text-white hover:bg-slate-800 transition"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          SC Idea Link Hub
                        </Link>
                        <Link
                          href="/admin/referrals"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-purple-300 hover:text-white hover:bg-slate-800 transition"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Gift className="w-4 h-4 text-purple-400" />
                          Referral Management
                        </Link>
                      </>
                    )}

                    {(user.role === "COMPANY" || user.role === "HR") && (
                      <Link
                        href="/company"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Briefcase className="w-4 h-4 text-violet-400" />
                        Company Portal
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 transition border-t border-slate-800/80 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full shadow-md shadow-blue-500/25 transition active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-[#070B14] px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-[#132240] text-blue-400 font-semibold"
                    : "text-slate-200 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md"
                  >
                    Go to Dashboard ({user.role})
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-center py-2.5 rounded-xl bg-slate-800 text-rose-400 text-xs font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};
