"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  QrCode, 
  ArrowLeft, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Link2,
  Info
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { auth } from "@/lib/firebase";

export default function AdminPaymentQrPage() {
  const { success, error } = useToast();
  const { firebaseUser, loading: authLoading } = useAuth();

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [upiLink, setUpiLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/payments/qr", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          setUpiLink(data.settings.paymentUpiLink || "");
          setIsActive(data.settings.isActive !== false);
        }
      } else {
        error("Failed to load payment QR configuration.");
      }
    } catch {
      error("Network error loading QR configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      error("Invalid image format. Please select a PNG, JPG, or WEBP file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error("File exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadNewQr = async () => {
    if (!selectedFile) {
      error("Please select a QR image file first.");
      return;
    }

    setUploading(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const formData = new FormData();
      formData.append("qrImage", selectedFile);
      formData.append("paymentUpiLink", upiLink);
      formData.append("isActive", String(isActive));

      const res = await fetch("/api/admin/payments/qr", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("New payment QR image uploaded to AWS S3 & activated in Firestore! 🚀");
        setSettings(data.settings);
        setSelectedFile(null);
        setFilePreview(null);
      } else {
        error(data.error || "Failed to upload QR image.");
      }
    } catch {
      error("Network error while uploading QR image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTextSettings = async () => {
    setSaving(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/payments/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentUpiLink: upiLink,
          isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("Payment settings saved successfully!");
        setSettings(data.settings);
      } else {
        error(data.error || "Failed to save payment settings.");
      }
    } catch {
      error("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomQr = async () => {
    if (!confirm("Are you sure you want to remove the custom QR image? Default dynamic QR generation will be restored.")) {
      return;
    }

    setSaving(true);
    try {
      const token = (await firebaseUser?.getIdToken()) || (await auth.currentUser?.getIdToken());
      const res = await fetch("/api/admin/payments/qr", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success("Custom QR removed. Default dynamic QR generator restored.");
        loadSettings();
      } else {
        error(data.error || "Failed to remove custom QR.");
      }
    } catch {
      error("Network error while removing QR.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060A12] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading Payment QR Configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060A12] text-slate-100 p-4 sm:p-8 space-y-8 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold">
                PAYMENT GATEWAY & QR
              </span>
              {settings?.updatedAt && (
                <span className="text-[11px] text-slate-500">
                  Last updated: {new Date(settings.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
              <span>Payment QR Management</span>
              <QrCode className="w-5 h-5 text-cyan-400" />
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure the active UPI QR Code displayed in the student plan checkout modal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/plans"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Test Public Modal</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Current QR Preview & Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Live Active QR</span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                }`}
              >
                {isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            {/* QR Code Container Preview */}
            <div className="relative p-4 rounded-3xl bg-white border-4 border-cyan-400 shadow-2xl max-w-[260px] mx-auto text-center">
              {filePreview ? (
                <div className="space-y-1">
                  <img
                    src={filePreview}
                    alt="Selected QR Preview"
                    className="w-full h-auto rounded-2xl block object-contain"
                  />
                  <span className="text-[10px] font-bold text-blue-600 block pt-1">
                    NEW FILE READY TO UPLOAD
                  </span>
                </div>
              ) : settings?.paymentQrImageUrl ? (
                <img
                  src={settings.paymentQrImageUrl}
                  alt="Active Custom QR Code"
                  className="w-full h-auto rounded-2xl block object-contain"
                />
              ) : (
                <div className="p-4 space-y-2">
                  <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-800 font-mono text-xs">
                    [ Dynamic Realtime QR ]
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Automatic per-order dynamic QR active
                  </span>
                </div>
              )}
            </div>

            {/* Metadata Info Strip */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Storage Provider:</span>
                <span className="font-semibold text-cyan-400">AWS S3 (Private Bucket)</span>
              </div>
              <div className="flex justify-between">
                <span>Config Database:</span>
                <span className="font-semibold text-blue-400">Cloud Firestore</span>
              </div>
              {settings?.updatedBy && (
                <div className="flex justify-between">
                  <span>Updated By:</span>
                  <span className="font-mono text-slate-300">{settings.updatedBy}</span>
                </div>
              )}
            </div>

            {settings?.paymentQrImageUrl && (
              <button
                type="button"
                onClick={handleDeleteCustomQr}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Custom Image (Restore Dynamic Generator)</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Upload & Configuration Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Upload New Image */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Upload Custom UPI QR Image</span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload a company QR image (Google Pay, PhonePe, Paytm, or BHIM). Stored securely on AWS S3.
              </p>
            </div>

            {/* File Dropzone / Selector */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-[#070D1A] text-center cursor-pointer transition space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {selectedFile ? selectedFile.name : "Click to select a QR code image"}
                </span>
                <span className="text-[10px] text-slate-500">
                  Supported formats: PNG, JPG, WEBP (Max 5MB)
                </span>
              </div>
            </div>

            {selectedFile && (
              <button
                type="button"
                onClick={handleUploadNewQr}
                disabled={uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Upload & Activate QR Image</span>
              </button>
            )}
          </div>

          {/* Card 2: UPI Intent Link & State Configuration */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>UPI Payment Link / VPA Settings</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure the UPI string or ID used for dynamic amount calculations and QR generation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  UPI VPA or URI Intent
                </label>
                <input
                  type="text"
                  value={upiLink}
                  onChange={(e) => setUpiLink(e.target.value)}
                  placeholder="e.g. sctech.payments@razorpay or upi://pay?pa=..."
                  className="w-full bg-[#070D1A] border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition font-mono"
                />
                <span className="text-[10px] text-slate-500 block">
                  Tip: Provide either a VPA (e.g. <code>company@upi</code>) or full intent URL. The platform embeds the selected plan price dynamically.
                </span>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070D1A] border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">Enable QR Scan & Pay</div>
                  <div className="text-[10px] text-slate-400">
                    Controls visibility of the QR payment option inside the student checkout modal.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    isActive ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveTextSettings}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Payment Settings</span>
              </button>
            </div>
          </div>

          {/* Security & Verification Notice */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-blue-300 block">Cryptographic Verification & Plan Security</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Changing the displayed QR does not bypass security. When a student clicks &quot;I&apos;ve completed payment / Check Status&quot;, the server checks authentic authorization and captures the order against the selected plan price in Firestore.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
