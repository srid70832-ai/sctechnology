"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { MessageSquare, Star, X, CheckCircle2, Loader2, Send } from "lucide-react";

export const FeedbackWidget = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("UI/UX");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hide on auth pages or onboarding
  if (pathname.includes("/login") || pathname.includes("/register") || pathname.includes("/onboarding") || pathname.includes("/forgot-password")) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        userId: anonymous ? "ANONYMOUS" : (user?.userId || "GUEST"),
        userName: anonymous ? "Anonymous Student" : (user?.name || "Guest"),
        userEmail: anonymous ? "" : (user?.email || ""),
        rating,
        category,
        message,
        pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
        anonymous,
        }),
      });

      const result = await response.json().catch(() => null);
      const feedbackId = response.ok ? result?.id : null;

      if (feedbackId) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setMessage("");
          setRating(5);
        }, 2200);
      } else {
        setSubmitError("Couldn't submit your feedback. Please try again.");
      }
    } catch {
      setSubmitError("Couldn't submit your feedback. Please check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Help us improve SC TECH"
          className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs shadow-2xl shadow-blue-600/40 border border-blue-400/30 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">Feedback</span>

          {/* Desktop Hover Tooltip */}
          <span className="hidden sm:block absolute -top-10 right-0 bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-normal px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Help us improve SC TECH
          </span>
        </motion.button>
      </div>

      {/* Animated Feedback Dialog Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 sm:hidden backdrop-blur-xs"
            />

            {/* Panel on Desktop (Bottom-Right) / Bottom-Sheet on Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 space-y-4"
            >
              {submitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Thank you! 🎉</h3>
                  <p className="text-xs text-slate-300">
                    Your feedback has been submitted to the SC TECH product team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white">How&apos;s your experience?</h3>
                      <p className="text-[11px] text-slate-400">Your feedback helps us improve SC TECH.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 5-Star Interactive Rating */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-amber-400 hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= (hoverRating || rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-2">
                        {rating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="UI/UX">UI/UX & Design</option>
                      <option value="Internships">Internship Listings</option>
                      <option value="Hackathons">Hackathon System</option>
                      <option value="Projects">Project Repositories</option>
                      <option value="Payments">Payments & Billing</option>
                      <option value="Performance">Performance & Speed</option>
                      <option value="Authentication">Authentication / Google</option>
                      <option value="Other">Other Suggestion</option>
                    </select>
                  </div>

                  {/* Feedback Message */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Your Feedback</label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you think or what we can improve..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                      required
                    />
                  </div>

                  {submitError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Feedback</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
