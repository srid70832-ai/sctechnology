import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1 py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-white">Refund & Cancellation Policy</h1>
        <p className="text-slate-400 text-xs">Last updated: September 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Subscription Plans</h2>
          <p>Subscription plans (Starter, Plus, PRO, Career) can be cancelled at any time through the student dashboard. Cancellations will take effect at the end of the current billing cycle, with active benefits retained until expiration.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Refund Requests</h2>
          <p>If you experience technical issues preventing access to your purchased benefits, you may request a refund within 7 days of transaction by submitting a support ticket with your transaction ID.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Hackathon Entry Fees</h2>
          <p>Hackathon entry fees cover administrative evaluation and cryptographic certificate processing. Refund requests submitted prior to the official problem release date are eligible for full reimbursement.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
