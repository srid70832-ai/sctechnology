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
  metadataBase: new URL("https://sctech.vercel.app"),
  title: "SC TECH – Build Skills. Build Projects. Build Your Career.",
  description:
    "SC TECH is an all-in-one platform for internships, hackathons, real-world projects, online courses and career opportunities.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "SC TECH",
    title: "SC TECH – Build Skills. Build Projects. Build Your Career.",
    description:
      "SC TECH is an all-in-one platform for internships, hackathons, real-world projects, online courses and career opportunities.",
    url: "https://sctech.vercel.app/",
    images: [{ url: "/sc-tech-logo.png", alt: "SC TECH logo" }],
  },
  twitter: {
    card: "summary",
    title: "SC TECH – Build Skills. Build Projects. Build Your Career.",
    description:
      "SC TECH is an all-in-one platform for internships, hackathons, real-world projects, online courses and career opportunities.",
    images: ["/sc-tech-logo.png"],
  },
  icons: {
    icon: "/sc-tech-logo.png",
    apple: "/sc-tech-logo.png",
    shortcut: "/sc-tech-logo.png",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/png" href="/sc-tech-logo.png" />
        <link rel="apple-touch-icon" href="/sc-tech-logo.png" />
        <meta name="application-name" content="SC TECH" />
      </head>
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
