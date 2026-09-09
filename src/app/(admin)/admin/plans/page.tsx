"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, doc, setDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { 
  PlanData, 
  getPlansFromFirestore, 
  DEFAULT_PLANS, 
  LimitedOfferConfig, 
  DEFAULT_OFFER_CONFIG, 
  getOfferFromFirestore, 
  saveOfferToFirestore,
  isOfferActive,
  calculatePlanPrice
} from "@/lib/plans";
import { formatINR } from "@/lib/utils";
import { 
  CreditCard, 
  ArrowLeft, 
  Edit3, 
  CheckCircle2, 
  Save, 
  Plus, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  X,
  Flame,
  Clock,
  Zap,
  Check,
  Percent,
  Calendar,
  Layers
} from "lucide-react";

export default function AdminPlansPage() {
  const { user, firebaseUser } = useAuth();
  const { success, error } = useToast();

  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);
  const [saving, setSaving] = useState(false);

  // Limited Time Offer State
  const [offer, setOffer] = useState<LimitedOfferConfig>(DEFAULT_OFFER_CONFIG);
  const [savingOffer, setSavingOffer] = useState(false);

  const fetchPlansAndOffer = async () => {
    setLoading(true);
    try {
      const [list, offerData] = await Promise.all([
        getPlansFromFirestore(),
        getOfferFromFirestore(),
      ]);
      setPlans(list);
      if (offerData) {
        setOffer(offerData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      error("Failed to load plans or offer settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndOffer();
  }, []);

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOffer(true);
    try {
      await saveOfferToFirestore(offer);
      success("Limited-time offer settings saved successfully! 🚀");
    } catch (err: any) {
      console.error("Error saving offer:", err);
      error("Failed to save offer settings: " + (err?.message || "Unknown error"));
    } finally {
      setSavingOffer(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan?.id && !editingPlan?.code) return;

    setSaving(true);
    try {
      if (editingPlan.id) {
        const planRef = doc(db, "plans", editingPlan.id);
        await updateDoc(planRef, {
          name: editingPlan.name,
          positioning: editingPlan.positioning,
          tagline: editingPlan.tagline,
          priceMonthly: Number(editingPlan.priceMonthly),
          priceYearly: Number(editingPlan.priceYearly),
          features: editingPlan.features,
          isPopular: editingPlan.isPopular || false,
          active: editingPlan.active ?? true,
          updatedAt: new Date(),
        });
      }

      success(`Plan "${editingPlan.name}" updated successfully!`);
      setEditingPlan(null);
      await fetchPlansAndOffer();
    } catch (err) {
      console.error("Error saving plan:", err);
      error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Panel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-blue-400" />
            <span>Student Plans & Pricing Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure live monthly & annual pricing, plan features, and popular badges in Cloud Firestore.
          </p>
        </div>
      </div>

      {/* 1. LIMITED-TIME OFFER CONTROL CENTER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0e1629] to-[#0a1020] border border-amber-500/30 shadow-2xl shadow-amber-500/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">Limited-Time Offer System</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                  isOfferActive(offer) 
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  {isOfferActive(offer) ? "● ACTIVE & LIVE" : "○ INACTIVE / EXPIRED"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure dynamic percentage discounts, animated banners, and countdown timers across all student plans.
              </p>
            </div>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl">
            <span className="text-xs font-bold text-slate-300">Offer Status:</span>
            <button
              type="button"
              onClick={() => setOffer((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                offer.enabled ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  offer.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs font-bold text-white min-w-[50px]">
              {offer.enabled ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* Offer Form */}
        <form onSubmit={handleSaveOffer} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Offer Heading / Label</span>
              </label>
              <input
                type="text"
                value={offer.title}
                onChange={(e) => setOffer({ ...offer, title: e.target.value })}
                placeholder="🔥 LIMITED-TIME OFFER"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Banner Message */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Banner Message
              </label>
              <input
                type="text"
                value={offer.bannerMessage}
                onChange={(e) => setOffer({ ...offer, bannerMessage: e.target.value })}
                placeholder="Get 30% OFF on all plans"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Discount % */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Discount Percentage (%)</span>
                <span className="text-amber-400 font-extrabold">{offer.discountPercentage}% OFF</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={offer.discountPercentage}
                  onChange={(e) => setOffer({ ...offer, discountPercentage: Number(e.target.value) || 0 })}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 text-center font-bold"
                  required
                />
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={offer.discountPercentage}
                  onChange={(e) => setOffer({ ...offer, discountPercentage: Number(e.target.value) })}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Badge Text */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Plan Card Badge Text
              </label>
              <input
                type="text"
                value={offer.badgeText}
                onChange={(e) => setOffer({ ...offer, badgeText: e.target.value })}
                placeholder="🔥 30% OFF"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Start Date (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Start Date & Time (Optional)</span>
              </label>
              <input
                type="datetime-local"
                value={offer.startDate ? offer.startDate.slice(0, 16) : ""}
                onChange={(e) => setOffer({ ...offer, startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* End Date (Optional Countdown) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Expiry Date & Time (Enables Countdown)</span>
              </label>
              <input
                type="datetime-local"
                value={offer.endDate ? offer.endDate.slice(0, 16) : ""}
                onChange={(e) => setOffer({ ...offer, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Eligible Plans Multi-Select */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Eligible Plans for Discount:</span>
            </label>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {[
                { id: "ALL", label: "All Paid Plans" },
                { id: "STARTER", label: "Starter Plan" },
                { id: "PRO", label: "Pro Plan (Popular)" },
                { id: "CAREER", label: "Career Plan" },
              ].map((p) => {
                const isSelected = offer.eligiblePlans.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id === "ALL") {
                        setOffer({ ...offer, eligiblePlans: isSelected ? ["PRO"] : ["ALL"] });
                      } else {
                        let newPlans = offer.eligiblePlans.filter((x) => x !== "ALL");
                        if (isSelected) {
                          newPlans = newPlans.filter((x) => x !== p.id);
                        } else {
                          newPlans.push(p.id);
                        }
                        if (newPlans.length === 0) newPlans = ["ALL"];
                        setOffer({ ...offer, eligiblePlans: newPlans });
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                      isSelected ? "bg-amber-500 text-slate-950 font-black" : "border border-slate-600"
                    }`}>
                      {isSelected && "✓"}
                    </div>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Discount Calculation Preview */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Dynamic Pricing Simulation ({offer.discountPercentage}% Discount)</span>
              </span>
              <span className="text-[11px] text-slate-400">Updated in real-time</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                { name: "Starter", code: "STARTER", monthly: 299, yearly: 2999 },
                { name: "Pro", code: "PRO", monthly: 499, yearly: 4999 },
                { name: "Career", code: "CAREER", monthly: 599, yearly: 5999 },
              ].map((p) => {
                const isEligible = offer.enabled && (offer.eligiblePlans.includes("ALL") || offer.eligiblePlans.includes(p.code));
                const resMonthly = calculatePlanPrice(p.monthly, p.code, offer);
                const resYearly = calculatePlanPrice(p.yearly, p.code, offer);

                return (
                  <div key={p.code} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{p.name} Plan</span>
                      {isEligible ? (
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                          {offer.badgeText || `${offer.discountPercentage}% OFF`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Standard</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 pt-1">
                      <span>Monthly: </span>
                      {isEligible ? (
                        <>
                          <span className="line-through text-slate-500 mr-1.5">₹{p.monthly}</span>
                          <span className="font-extrabold text-emerald-400">₹{resMonthly.finalPrice}</span>
                        </>
                      ) : (
                        <span className="font-bold text-slate-300">₹{p.monthly}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <span>Annual: </span>
                      {isEligible ? (
                        <>
                          <span className="line-through text-slate-500 mr-1.5">₹{p.yearly}</span>
                          <span className="font-extrabold text-emerald-400">₹{resYearly.finalPrice}</span>
                        </>
                      ) : (
                        <span className="font-bold text-slate-300">₹{p.yearly}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>All changes automatically sync to Firestore & active payment gateways.</span>
            </div>

            <button
              type="submit"
              disabled={savingOffer}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingOffer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Saving Offer Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Save Offer Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. PLANS & FEATURE CONFIGURATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white tracking-tight">Standard Plan Tiers</h2>
          <span className="text-xs text-slate-400">{plans.length} tiers active</span>
        </div>

        {/* Plans List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading plans from Firestore...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`p-6 rounded-3xl bg-slate-900/90 border flex flex-col justify-between space-y-6 shadow-xl ${
                plan.isPopular ? "border-blue-500 shadow-blue-500/10" : "border-slate-800"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-bold">
                      POPULAR
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">{plan.positioning}</p>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Price:</span>
                    <span className="font-bold text-white">
                      {plan.priceMonthly === 0 ? "₹0 Free" : formatINR(plan.priceMonthly)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Annual Price:</span>
                    <span className="font-bold text-emerald-400">
                      {plan.priceYearly === 0 ? "₹0 Free" : formatINR(plan.priceYearly)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Key Features:</span>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {plan.features?.slice(0, 4).map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPlan(plan)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Plan</span>
              </button>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl text-slate-100 space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Edit Plan: {editingPlan.name}</h3>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Positioning Text</label>
                  <input
                    type="text"
                    value={editingPlan.positioning}
                    onChange={(e) => setEditingPlan({ ...editingPlan, positioning: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Monthly Price (₹)</label>
                    <input
                      type="number"
                      value={editingPlan.priceMonthly}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Annual Price (₹)</label>
                    <input
                      type="number"
                      value={editingPlan.priceYearly}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={editingPlan.isPopular || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="isPopular" className="text-slate-300 font-semibold cursor-pointer">
                    Highlight as &quot;Most Popular&quot; Hero Plan
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
