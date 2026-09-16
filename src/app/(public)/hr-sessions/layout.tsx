import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HR Sessions and Mentorship",
  description: "Explore HR interaction sessions and mentorship opportunities available through SC TECH.",
  alternates: { canonical: "/hr-sessions" },
};

export default function HrSessionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
