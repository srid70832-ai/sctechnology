import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { FirebaseProvider } from "@/components/providers/FirebaseProvider";
import { FeedbackWidget } from "@/components/ui/FeedbackWidget";
import { TopProgressBar } from "@/components/ui/TopProgressBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SC TECH — Build Skills. Build Projects. Build Your Career.",
  description:
    "SC TECH is a technology and career platform providing real-world projects, verified internships, hackathons, student subscriptions, source code access, HR interaction sessions, and digital certificates.",
  keywords: [
    "SC TECH",
    "internships",
    "hackathons",
    "real world projects",
    "student portfolio",
    "tech careers",
    "coding certificates",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0B0F19] text-slate-100 min-h-screen antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <FirebaseProvider>
              <React.Suspense fallback={null}>
                <TopProgressBar />
              </React.Suspense>
              {children}
              <FeedbackWidget />
            </FirebaseProvider>
          </ToastProvider>
        </AuthProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
