"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Zap, 
  AlertTriangle, 
  Loader2,
  Lock,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProjectData } from "@/lib/projects-data";
import { ProjectDurationOption } from "@/lib/project-lifecycle-service";
import { DEFAULT_PLANS, PlanData } from "@/lib/plans";
import { DualPaymentModal } from "@/components/payments/DualPaymentModal";

interface ProjectActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  onActivated?: () => void;
}

export function ProjectActivationModal({
  isOpen,
  onClose,
  project,
  onActivated,
}: ProjectActivationModalProps) {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();

  const [selectedDuration, setSelectedDuration] = useState<ProjectDurationOption>("2_MONTHS");
  const [loading, setLoading] = useState(false);
  const [activeProjectError, setActiveProjectError] = useState<string | null>(null);
  const [isNextProject, setIsNextProject] = useState(false);
  const [checkingActive, setCheckingActive] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData>(DEFAULT_PLANS.find((plan) => plan.code === "PLUS") || DEFAULT_PLANS[2]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<{ planName: string; amount: number; startedAt: string; expiresAt: string } | null>(null);

  const [directCheckoutPrice, setDirectCheckoutPrice] = useState<number>(project?.price || 299);

  useEffect(() => {
    async function checkStatus() {
      if (!isOpen || (!user && !firebaseUser)) {
        setCheckingActive(false);
        return;
      }

      setCheckingActive(true);
      setActiveProjectError(null);
      setSubscriptionRequired(false);

      try {
        const uid = user?.userId || firebaseUser?.uid;
        const targetProjId = project?.id || project?.slug || "";
        const res = await fetch(`/api/projects/enrollment/active?userId=${uid}&projectId=${targetProjId}`);
        if (res.status === 401) {
          router.push(`/login?redirect=/projects/${project?.slug || project?.id || ""}`);
          return;
        }
        if (res.status === 403) {
          setSubscriptionRequired(true);
          return;
        }
        if (res.ok) {
          const json = await res.json();
          if (json.activeEnrollment) {
            if (json.activeEnrollment.projectId !== targetProjId && json.activeEnrollment.projectSlug !== targetProjId) {
              setActiveProjectError(
                `You already have an active project: "${json.activeEnrollment.projectTitle}". SC TECH limits students to 1 active project at a time. Please complete or close your active project before activating another.`
              );
            }
          } else if (json.hasPreviousProjects) {
            setIsNextProject(true);
          }
        }
      } catch (err) {
        console.error("Error checking active project status:", err);
      } finally {
        setCheckingActive(false);
      }
    }
    checkStatus();
  }, [isOpen, user, firebaseUser, router, project]);

  const [dualPaymentConfig, setDualPaymentConfig] = useState<{
    isOpen: boolean;
    productType: "PROJECT_PURCHASE" | "SUBSCRIPTION";
    productId: string;
    productTitle: string;
    amount: number;
    billingCycle?: "MONTHLY" | "YEARLY";
    duration?: string;
  } | null>(null);

  const handleOpenDirectProjectPayment = () => {
    const currentUser = firebaseUser || user;
    if (!currentUser || !project) {
      router.push("/login?redirect=/projects/" + (project?.slug || project?.id || ""));
      return;
    }
    setDualPaymentConfig({
      isOpen: true,
      productType: "PROJECT_PURCHASE",
      productId: project.id,
      productTitle: `${project.title} — Real-World Project Unlock`,
      amount: project.price || 299,
      duration: selectedDuration,
    });
  };

  const handleOpenSubscriptionPayment = () => {
    const currentUser = firebaseUser || user;
    if (!currentUser) {
      router.push("/login?redirect=/projects/" + (project?.slug || project?.id || ""));
      return;
    }
    setDualPaymentConfig({
      isOpen: true,
      productType: "SUBSCRIPTION",
      productId: selectedPlan.code,
      productTitle: `${selectedPlan.name} Monthly Subscription`,
      amount: selectedPlan.priceMonthly,
      billingCycle: "MONTHLY",
    });
  };

  if (!isOpen || !project) return null;

  const getProjectedDeadline = (dur: ProjectDurationOption) => {
    const d = new Date();
    if (dur === "1_MONTH") d.setMonth(d.getMonth() + 1);
    else if (dur === "2_MONTHS") d.setMonth(d.getMonth() + 2);
    else if (dur === "3_MONTHS") d.setMonth(d.getMonth() + 3);
    else if (dur === "4_MONTHS") d.setMonth(d.getMonth() + 4);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleActivate = async () => {
    if (!user && !firebaseUser) {
      router.push("/login?redirect=/projects/" + (project.slug || project.id));
      return;
    }

    setLoading(true);
    try {
      const uid = user?.userId || firebaseUser?.uid;
      const res = await fetch("/api/projects/enrollment/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: uid,
          studentName: user?.name || "Verified Student",
          studentEmail: user?.email || "",
          projectId: project.id,
          projectSlug: project.slug || project.id,
          projectTitle: project.title,
          projectCategory: project.category,
          projectDifficulty: project.difficulty,
          duration: selectedDuration,
          isNextProjectActivation: isNextProject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to activate project");
      }

      alert(`🎉 Project "${project.title}" activated successfully!\nAssigned Duration: ${selectedDuration.replace(/_/g, " ")}\nDeadline: ${getProjectedDeadline(selectedDuration)}`);
      onClose();
      if (onActivated) onActivated();
      router.push(`/my-projects/${project.slug || project.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to activate project");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionCheckout = async () => {
    const currentUser = firebaseUser;
    if (!currentUser || selectedPlan.priceMonthly < 399) return;

    setPaymentLoading(true);
    try {
      const token = await currentUser.getIdToken(true);
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: selectedPlan.code, billingCycle: "MONTHLY" }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.error || "Unable to create subscription order");
      if (!(window as any).Razorpay) throw new Error("Razorpay Checkout is unavailable. Please try again.");

      const razorpay = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SC TECH",
        description: `${selectedPlan.name} Monthly Subscription`,
        image: "/logo.png",
        order_id: order.orderId,
        prefill: { name: user?.name || currentUser.displayName || "", email: user?.email || currentUser.email || "" },
        theme: { color: "#2563EB" },
        handler: async (response: any) => {
          try {
            const verifyToken = await currentUser.getIdToken(true);
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${verifyToken}` },
              body: JSON.stringify({
                orderId: response.razorpay_order_id || order.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            const verified = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(verified.error || "Payment verification failed");
            setSubscriptionSuccess({
              planName: verified.subscription?.planName || selectedPlan.name,
              amount: verified.subscription?.amount || selectedPlan.priceMonthly,
              startedAt: verified.subscription?.startedAt || new Date().toISOString(),
              expiresAt: verified.subscription?.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
            });
            setSubscriptionRequired(false);
            setCheckingActive(false);
          } catch (err: any) {
            setActiveProjectError(err.message || "Payment verification failed");
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      });
      razorpay.on("payment.failed", (response: any) => {
        setPaymentLoading(false);
        setActiveProjectError(response.error?.description || "Payment was not completed.");
      });
      razorpay.open();
    } catch (err: any) {
      setPaymentLoading(false);
      setActiveProjectError(err.message || "Unable to start subscription checkout");
    }
  };

  const DURATION_OPTIONS: { id: ProjectDurationOption; label: string; months: number; desc: string }[] = [
    { id: "1_MONTH", label: "1 Month (Fast Track)", months: 1, desc: "Intensive 30-day sprint for experienced engineers" },
    { id: "2_MONTHS", label: "2 Months (Standard)", months: 2, desc: "Balanced 60-day pace with weekly milestones (Recommended)" },
    { id: "3_MONTHS", label: "3 Months (In-Depth)", months: 3, desc: "Comprehensive 90-day learning and full capstone build" },
    { id: "4_MONTHS", label: "4 Months (Max Duration)", months: 4, desc: "Deep multi-stage engineering cycle (Maximum limit)" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>PROJECT ACTIVATION WORKFLOW</span>
            </div>
            <h3 className="text-xl font-black text-white">{project.title}</h3>
            <p className="text-xs text-slate-400">
              {project.category} • Difficulty: <strong className="text-amber-400">{project.difficulty}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {checkingActive ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs font-semibold">Verifying active project quota & plan authorization...</span>
          </div>
        ) : subscriptionSuccess ? (
          <div className="space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto"><CheckCircle2 className="w-6 h-6" /></div>
            <h4 className="text-lg font-black text-white">Subscription activated successfully.</h4>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-left space-y-1.5">
              <p>Plan: <strong>{subscriptionSuccess.planName}</strong></p>
              <p>Amount: ₹{subscriptionSuccess.amount}</p>
              <p>Start: {new Date(subscriptionSuccess.startedAt).toLocaleDateString("en-IN")}</p>
              <p>Expiry: {new Date(subscriptionSuccess.expiresAt).toLocaleDateString("en-IN")}</p>
              <p className="font-bold text-emerald-300">Real-World Projects: Unlocked</p>
            </div>
            <button type="button" onClick={() => setSubscriptionSuccess(null)} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold">Continue to Project Activation</button>
          </div>
        ) : subscriptionRequired ? (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto"><Lock className="w-6 h-6" /></div>
              <h4 className="text-lg font-black text-white">Unlock Real-World Project</h4>
              <p className="text-xs text-slate-300">Purchase access for this single project or subscribe to access all 25+ real-world projects.</p>
            </div>

            {/* Option 1: Direct Single Project Unlock */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-950/60 to-slate-950 border border-blue-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white block">Unlock This Single Project</span>
                  <span className="text-[11px] text-slate-400">{project.title} • Includes 8 Milestones, Evaluation & Certificate</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400">₹{project.price || 299}</span>
                  <span className="text-[10px] text-slate-400 block">One-time fee</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenDirectProjectPayment}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Pay ₹{project.price || 299} & Unlock ONLY This Project 🔓</span>
              </button>
            </div>

            {/* Option 2: Full Subscription Plan */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">Or Choose an Unlimited Subscription Plan</span>
              <div className="grid gap-2">
                {DEFAULT_PLANS.filter((plan) => ["PLUS", "PRO", "CAREER"].includes(plan.code)).map((plan) => {
                  const eligible = plan.priceMonthly >= 399;
                  const selected = selectedPlan.code === plan.code;
                  return (
                    <button key={plan.code} type="button" onClick={() => eligible && setSelectedPlan(plan)} className={`text-left p-3 rounded-xl border transition ${selected ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-950"} ${!eligible ? "opacity-70" : ""}`}>
                      <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">{plan.name} — ₹{plan.priceMonthly}/month</span><span className={`text-[11px] font-bold ${eligible ? "text-emerald-400" : "text-slate-500"}`}>All 25+ Projects Access</span></div>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={handleOpenSubscriptionPayment} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700">
                Subscribe to {selectedPlan.name} – ₹{selectedPlan.priceMonthly}/month
              </button>
            </div>
          </div>
        ) : activeProjectError ? (
          /* BLOCKED: ACTIVE PROJECT ALREADY EXISTS */
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-base font-bold text-white">Active Project Limit Reached</h4>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                {activeProjectError}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/my-projects");
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Go to Active Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVATION SELECTION FORM */
          <div className="space-y-6">
            
            {/* Duration Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Select Project Duration (Max 4 Months):</span>
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  Deadline: <strong className="text-cyan-400">{getProjectedDeadline(selectedDuration)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = selectedDuration === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedDuration(opt.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? "bg-gradient-to-b from-blue-950/60 to-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/50"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business Rules & Pricing Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Activation Policy:</span>
                </span>
                <span className="font-black text-emerald-400 text-sm">
                  {isNextProject ? "₹99 Next-Project Fee" : "Included in Active Plan"}
                </span>
              </div>

              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>You can work on <strong>ONE active project at a time</strong>.</li>
                <li>When your {selectedDuration.replace(/_/g, " ")} duration expires, the project will <strong>automatically lock</strong>.</li>
                <li>Complete 6/8 tasks to earn ₹1,200 stipend or 8/8 tasks for ₹5,000 stipend.</li>
                {isNextProject && (
                  <li className="text-blue-300 font-medium">
                    This is your next project cycle. Nominal ₹99 activation fee applies.
                  </li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleActivate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Project...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>{isNextProject ? "Pay ₹99 & Start Project" : "Start Project Workspace"}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>

      {dualPaymentConfig && (
        <DualPaymentModal
          isOpen={dualPaymentConfig.isOpen}
          onClose={() => setDualPaymentConfig(null)}
          productType={dualPaymentConfig.productType}
          productId={dualPaymentConfig.productId}
          productTitle={dualPaymentConfig.productTitle}
          amount={dualPaymentConfig.amount}
          billingCycle={dualPaymentConfig.billingCycle}
          duration={dualPaymentConfig.duration}
          onSuccess={() => {
            setDualPaymentConfig(null);
            onClose();
            if (onActivated) onActivated();
            if (dualPaymentConfig.productType === "PROJECT_PURCHASE") {
              router.push(`/my-projects/${project.slug || project.id}`);
            } else {
              setSubscriptionRequired(false);
            }
          }}
        />
      )}
    </div>
  );
}
