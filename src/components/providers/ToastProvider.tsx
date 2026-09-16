"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts([{ id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (msg: string) => addToast(msg, "success");
  const error = (msg: string) => addToast(msg, "error");
  const info = (msg: string) => addToast(msg, "info");

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div
        className="fixed top-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 pointer-events-none px-0 sm:top-5 sm:left-auto sm:right-5 sm:w-full sm:translate-x-0 sm:px-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              t.type === "success"
                ? "bg-slate-900/95 border-emerald-500/50 text-emerald-300"
                : t.type === "error"
                ? "bg-slate-900/95 border-rose-500/50 text-rose-300"
                : "bg-slate-900/95 border-blue-500/50 text-blue-300"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0 text-xs font-medium leading-5 text-slate-100 break-words">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
