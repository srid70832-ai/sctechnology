"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  QrCode, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone,
  Send,
  Printer,
  ArrowRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface DualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType: "SUBSCRIPTION" | "PROJECT_PURCHASE" | "HACKATHON_REGISTRATION";
  productId?: string;
  productTitle: string;
  amount: number;
  billingCycle?: "MONTHLY" | "YEARLY";
  duration?: string;
  onSuccess?: (paymentResult: any) => void;
}

export const DualPaymentModal: React.FC<DualPaymentModalProps> = ({
  isOpen,
  onClose,
  productType,
  productId,
  productTitle,
  amount,
  billingCycle = "MONTHLY",
  duration,
  onSuccess,
}) => {
  const { user, firebaseUser } = useAuth();
  const { success, error, toast } = useToast();

  const [method, setMethod] = useState<"CHOICE" | "RAZORPAY" | "UPI_QR">("CHOICE");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submittingUtr, setSubmittingUtr] = useState(false);

  // QR State
  const [qrData, setQrData] = useState<any | null>(null);
  const [qrStatus, setQrStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "MANUAL_REVIEW" | "PENDING">("IDLE");
  const [utrInput, setUtrInput] = useState("");
  const [showUtrField, setShowUtrField] = useState(false);
  const [verifiedPaymentRecord, setVerifiedPaymentRecord] = useState<any | null>(null);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setMethod("CHOICE");
      setQrData(null);
      setQrStatus("IDLE");
      setUtrInput("");
      setShowUtrField(false);
      setVerifiedPaymentRecord(null);
    }
  }, [isOpen]);

  // Realtime Firestore Listener for Admin QR Updates
  useEffect(() => {
    if (!isOpen || method !== "UPI_QR") return;
    try {
      const unsub = onSnapshot(doc(db, "siteSettings", "payment"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.paymentQrImageUrl && d.isActive !== false) {
            setQrData((prev: any) => prev ? { ...prev, customQrImageUrl: d.paymentQrImageUrl } : prev);
          } else if (d.paymentQrImageUrl === null || d.isActive === false) {
            setQrData((prev: any) => prev ? { ...prev, customQrImageUrl: null } : prev);
          }
        }
      });
      return () => unsub();
    } catch {
      // Non-blocking
    }
  }, [isOpen, method]);

  if (!isOpen) return null;

  // 1. Pay with Razorpay Official Checkout
  const handleRazorpayCheckout = async () => {
    const currentUser = firebaseUser || auth.currentUser;
    if (!currentUser) {
      error("Please log in to continue.");
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setLoading(true);
    try {
      const token = await currentUser.getIdToken(true);
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: productType === "SUBSCRIPTION" ? productId : undefined,
          projectId: productType === "PROJECT_PURCHASE" ? productId : undefined,
          hackathonId: productType === "HACKATHON_REGISTRATION" ? productId : undefined,
          billingCycle,
          duration,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initialize Razorpay checkout");
      }

      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "SC TECH",
          description: productTitle,
          image: "/logo.png",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            setLoading(true);
            try {
              const freshToken = await currentUser.getIdToken(true);
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${freshToken}`,
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id || orderData.orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  projectId: productType === "PROJECT_PURCHASE" ? productId : undefined,
                  duration,
                  planId: productType === "SUBSCRIPTION" ? productId : undefined,
                  billingCycle,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                success(`Payment verified! ${productTitle} is now unlocked. 🚀`);
                if (onSuccess) onSuccess(verifyData);
                onClose();
              } else {
                error(verifyData.error || "Payment signature verification failed.");
              }
            } catch {
              error("Payment verification network error.");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
          prefill: {
            name: user?.name || currentUser.displayName || "",
            email: user?.email || currentUser.email || "",
          },
          theme: { color: "#2563EB" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          setLoading(false);
          error(resp.error?.description || "Payment was not completed.");
        });
        rzp.open();
      } else {
        throw new Error("Razorpay script not loaded. Please try again.");
      }
    } catch (err: any) {
      console.error("Razorpay initiation error:", err);
      error(err.message || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  // 2. Open UPI QR Payment Mode
  const handleOpenQr = async () => {
    const currentUser = firebaseUser || auth.currentUser;
    if (!currentUser) {
      error("Please log in to continue.");
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setMethod("UPI_QR");
    setLoading(true);
    setQrStatus("IDLE");

    try {
      const token = await currentUser.getIdToken(true);
      const res = await fetch("/api/payments/create-qr-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: productType === "SUBSCRIPTION" ? productId : undefined,
          projectId: productType === "PROJECT_PURCHASE" ? productId : undefined,
          hackathonId: productType === "HACKATHON_REGISTRATION" ? productId : undefined,
          billingCycle,
          duration,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQrData(data);
      } else {
        error(data.error || "Failed to generate dynamic payment QR.");
        setMethod("CHOICE");
      }
    } catch {
      error("Network error creating QR payment order.");
      setMethod("CHOICE");
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify QR Status (Never trust button click alone)
  const handleVerifyQrStatus = async () => {
    if (!qrData) return;
    const currentUser = firebaseUser || auth.currentUser;
    if (!currentUser) return;

    setVerifying(true);
    try {
      const token = await currentUser.getIdToken(true);
      const res = await fetch("/api/payments/verify-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: qrData.paymentId,
          orderId: qrData.orderId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.paymentStatus === "PAID") {
        setQrStatus("SUCCESS");
        setVerifiedPaymentRecord(data.payment);
        success("Payment verified! Access is now unlocked. 🚀");
        if (onSuccess) onSuccess(data);
      } else if (data.paymentStatus === "MANUAL_REVIEW") {
        setQrStatus("MANUAL_REVIEW");
        toast(data.message || "Payment under admin review.", "info");
      } else {
        setQrStatus("PENDING");
        toast(data.message || "Payment not yet received. Please complete UPI scan or submit UTR.", "info");
        setShowUtrField(true);
      }
    } catch {
      error("Network error checking payment status.");
    } finally {
      setVerifying(false);
    }
  };

  // 4. Submit UTR for Admin Verification Queue
  const handleSubmitUtr = async () => {
    if (!utrInput.trim()) {
      error("Please enter your 12-digit UPI UTR or Transaction reference.");
      return;
    }
    const currentUser = firebaseUser || auth.currentUser;
    if (!currentUser || !qrData) return;

    setSubmittingUtr(true);
    try {
      const token = await currentUser.getIdToken(true);
      const res = await fetch("/api/payments/submit-utr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: qrData.paymentId,
          orderId: qrData.orderId,
          utrNumber: utrInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQrStatus("MANUAL_REVIEW");
        success("UTR reference submitted for admin verification! Access will unlock once verified.");
      } else {
        error(data.error || "Failed to submit UTR.");
      }
    } catch {
      error("Network error submitting UTR.");
    } finally {
      setSubmittingUtr(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#090E1A] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              {method === "UPI_QR" ? <QrCode className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {method === "UPI_QR" ? "SC TECH UPI Payment" : "Select Payment Method"}
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {qrData?.referenceId || qrData?.orderId || "SC TECH SECURE CHECKOUT"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Price Summary Banner */}
        <div className="p-4 rounded-2xl bg-[#060A14] border border-slate-800 text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            {productType === "PROJECT_PURCHASE" ? "PROJECT ACCESS" : productType === "HACKATHON_REGISTRATION" ? "HACKATHON ENTRY" : "SUBSCRIPTION PLAN"}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {formatINR(amount)}
          </div>
          <div className="text-xs text-slate-300 font-semibold">{productTitle}</div>
        </div>

        {/* VIEW A: METHOD SELECTION */}
        {method === "CHOICE" && (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-400">
              Choose your preferred verified payment method to complete purchase:
            </p>

            <div className="space-y-3">
              {/* Option 1: Razorpay Official Checkout */}
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={loading}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Pay with Razorpay</div>
                    <div className="text-[10px] text-blue-200">Cards, NetBanking, Instant UPI</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option 2: Admin-Managed UPI QR */}
              <button
                type="button"
                onClick={handleOpenQr}
                disabled={loading}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Pay with UPI QR</div>
                    <div className="text-[10px] text-emerald-200">Google Pay, PhonePe, Paytm, BHIM</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real server-side verification • Zero fake activation</span>
            </div>
          </div>
        )}

        {/* VIEW B: UPI QR PAYMENT */}
        {method === "UPI_QR" && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-400">Generating secure payment reference & QR...</p>
              </div>
            ) : qrStatus === "SUCCESS" ? (
              <div className="py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    PAYMENT CAPTURED ✓
                  </span>
                  <h4 className="text-base font-bold text-white pt-1">Access Unlocked Successfully!</h4>
                  <p className="text-xs text-slate-300">
                    Receipt Ref: <span className="font-mono text-white">{verifiedPaymentRecord?.receiptNumber || qrData?.orderId}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Continue
                </button>
              </div>
            ) : qrStatus === "MANUAL_REVIEW" ? (
              <div className="py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    PENDING ADMIN VERIFICATION
                  </span>
                  <h4 className="text-base font-bold text-white pt-1">Transaction Submitted</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Your UTR reference was recorded. An administrator will verify and approve your access shortly.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* QR Code Frame */}
                <div className="relative p-3 rounded-3xl bg-white border-4 border-cyan-400 shadow-2xl max-w-[240px] mx-auto overflow-hidden">
                  <motion.div
                    key={qrData?.customQrImageUrl || qrData?.qrDataUrl || "qr-image"}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {qrData?.customQrImageUrl ? (
                      <img
                        src={qrData.customQrImageUrl}
                        alt="SC TECH Payment QR"
                        className="w-full h-auto rounded-2xl block object-contain"
                      />
                    ) : qrData?.qrDataUrl ? (
                      <img
                        src={qrData.qrDataUrl}
                        alt="SC TECH Payment QR"
                        className="w-full h-auto rounded-2xl block object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                        QR Unavailable
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Mobile Intent Direct Link (Avoid scanning same screen) */}
                {qrData?.upiString && (
                  <a
                    href={qrData.upiString}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/25 transition"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Tap to Pay on UPI App (Mobile)</span>
                  </a>
                )}

                <div className="space-y-1 text-xs text-slate-400">
                  <p className="font-semibold text-slate-200">Scan with any UPI app to pay</p>
                  <p className="text-[10px] text-slate-500 font-mono">Google Pay • PhonePe • Paytm • BHIM</p>
                </div>

                {/* Primary Action Button: Real Server Verification */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyQrStatus}
                    disabled={verifying}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying with Server...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>I&apos;ve Completed Payment</span>
                      </>
                    )}
                  </button>

                  {/* UTR Input Section for Manual Review */}
                  {showUtrField && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3.5 rounded-2xl bg-[#060A14] border border-amber-500/30 space-y-2 text-left"
                    >
                      <label className="text-[11px] font-semibold text-amber-300 block">
                        Payment taking time to verify? Enter UPI UTR / Ref No:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value)}
                          placeholder="e.g. 426189012345"
                          className="flex-1 bg-[#091021] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleSubmitUtr}
                          disabled={submittingUtr}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                        >
                          {submittingUtr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Submit</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={() => setMethod("CHOICE")}
                      className="hover:text-slate-200"
                    >
                      ← Back to Payment Methods
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="hover:text-rose-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
