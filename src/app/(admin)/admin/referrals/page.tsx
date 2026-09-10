"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Gift, 
  Settings, 
  Users, 
  MousePointerClick, 
  CreditCard, 
  Trophy, 
  DollarSign, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Clock
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";

export default function AdminReferralManagementPage() {
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  // Form states for settings
  const [enabled, setEnabled] = useState(true);
  const [signupDiscountPercent, setSignupDiscountPercent] = useState(30);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState(35);
  const [subscriptionRewardPercent, setSubscriptionRewardPercent] = useState(40);
  const [minimumSubscriptionAmount, setMinimumSubscriptionAmount] = useState(0);
  const [maxRewardPerUser, setMaxRewardPerUser] = useState(10000);
  const [allowHackathonReferral, setAllowHackathonReferral] = useState(true);
  const [allowFreeHackathonReferral, setAllowFreeHackathonReferral] = useState(true);
  const [allowPaidHackathonReferral, setAllowPaidHackathonReferral] = useState(true);
  const [paidHackathonRewardPercent, setPaidHackathonRewardPercent] = useState(20);
  const [freeHackathonRewardAmount, setFreeHackathonRewardAmount] = useState(0);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/referrals", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.settings) {
          setEnabled(json.settings.enabled ?? true);
          setSignupDiscountPercent(json.settings.signupDiscountPercent ?? 30);
          setReferralDiscountPercent(json.settings.referralDiscountPercent ?? 35);
          setSubscriptionRewardPercent(json.settings.subscriptionRewardPercent ?? 40);
          setMinimumSubscriptionAmount(json.settings.minimumSubscriptionAmount ?? 0);
          setMaxRewardPerUser(json.settings.maxRewardPerUser ?? 10000);
          setAllowHackathonReferral(json.settings.allowHackathonReferral ?? true);
          setAllowFreeHackathonReferral(json.settings.allowFreeHackathonReferral ?? true);
          setAllowPaidHackathonReferral(json.settings.allowPaidHackathonReferral ?? true);
          setPaidHackathonRewardPercent(json.settings.paidHackathonRewardPercent ?? 20);
          setFreeHackathonRewardAmount(json.settings.freeHackathonRewardAmount ?? 0);
        }
      } else {
        toastError("Failed to fetch referral dashboard");
      }
    } catch (err) {
      console.error(err);
      toastError("Error loading referral settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          settings: {
            enabled,
            signupDiscountPercent: Number(signupDiscountPercent),
            referralDiscountPercent: Number(referralDiscountPercent),
            subscriptionRewardPercent: Number(subscriptionRewardPercent),
            minimumSubscriptionAmount: Number(minimumSubscriptionAmount),
            maxRewardPerUser: Number(maxRewardPerUser),
            allowHackathonReferral,
            allowFreeHackathonReferral,
            allowPaidHackathonReferral,
            paidHackathonRewardPercent: Number(paidHackathonRewardPercent),
            freeHackathonRewardAmount: Number(freeHackathonRewardAmount),
          },
        }),
      });

      if (res.ok) {
        success("Referral program settings updated successfully!");
        fetchAdminDashboard();
      } else {
        const errJson = await res.json();
        toastError(errJson.error || "Failed to update settings");
      }
    } catch (err) {
      console.error(err);
      toastError("Error updating referral settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-6 sm:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-1">
              <Gift className="w-3.5 h-3.5" />
              <span>Admin Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Referral & Reward System Management
            </h1>
          </div>
        </div>

        <button
          onClick={fetchAdminDashboard}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-medium uppercase tracking-wider">Loading System Analytics...</span>
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-slate-400 text-xs">Total Clicks</span>
              <div className="text-2xl font-black text-white">{data?.summary?.totalClicks || 0}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-slate-400 text-xs">Total Signups</span>
              <div className="text-2xl font-black text-indigo-400">{data?.summary?.totalSignups || 0}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-slate-400 text-xs">Conversions</span>
              <div className="text-2xl font-black text-emerald-400">{data?.summary?.totalConversions || 0}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-slate-400 text-xs">Hackathon Conversions</span>
              <div className="text-2xl font-black text-amber-400">{data?.summary?.hackathonConversions || 0}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-slate-400 text-xs">Total Rewards Paid</span>
              <div className="text-2xl font-black text-emerald-400">{formatINR(data?.summary?.totalRewardsPaid || 0)}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-slate-400 text-xs">Pending Rewards</span>
              <div className="text-2xl font-black text-amber-400">{formatINR(data?.summary?.totalPendingRewards || 0)}</div>
            </div>
          </div>

          {/* Program Settings Configuration Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <Settings className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Live Referral Program Configuration</h2>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Referral Program Master Status</h3>
                  <p className="text-xs text-slate-400">Toggle whether referrals and rewards are globally active</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Percentage inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Signup Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={signupDiscountPercent}
                    onChange={(e) => setSignupDiscountPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Referral Discount on Plans (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={referralDiscountPercent}
                    onChange={(e) => setReferralDiscountPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Subscription Referrer Reward (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={subscriptionRewardPercent}
                    onChange={(e) => setSubscriptionRewardPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Paid Hackathon Referrer Reward (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={paidHackathonRewardPercent}
                    onChange={(e) => setPaidHackathonRewardPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Free Hackathon Fixed Reward (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={freeHackathonRewardAmount}
                    onChange={(e) => setFreeHackathonRewardAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Max Lifetime Reward Per Referrer (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxRewardPerUser}
                    onChange={(e) => setMaxRewardPerUser(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Toggles for Hackathons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowHackathonReferral}
                    onChange={(e) => setAllowHackathonReferral(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Enable Hackathon Referrals</span>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPaidHackathonReferral}
                    onChange={(e) => setAllowPaidHackathonReferral(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Allow Paid Hackathon Rewards</span>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowFreeHackathonReferral}
                    onChange={(e) => setAllowFreeHackathonReferral(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300 font-semibold">Allow Free Hackathon Rewards</span>
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Program Settings</span>
                </button>
              </div>
            </form>
          </div>

          {/* Complete Referral Ledger */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">System Referral Ledger</h2>
              <p className="text-xs text-slate-400">All registered referrals and reward statuses</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Referrer</th>
                    <th className="py-3.5 px-4">Referred User</th>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Reward Amount</th>
                    <th className="py-3.5 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(data?.referrals || []).map((ref: any) => (
                    <tr key={ref.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-6 font-medium text-slate-200">
                        <div>{ref.referrerName || "Member"}</div>
                        <div className="text-[10px] text-slate-500">{ref.referrerEmail}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-200">
                        <div>{ref.referredName || "Student"}</div>
                        <div className="text-[10px] text-slate-500">{ref.referredEmail}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-blue-400">{ref.referralCode}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300">
                          {ref.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-emerald-400">
                        {ref.rewardAmount > 0 ? formatINR(ref.rewardAmount) : "-"}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{formatDate(ref.createdAt)}</td>
                    </tr>
                  ))}
                  {(!data?.referrals || data.referrals.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No referrals found in the ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
