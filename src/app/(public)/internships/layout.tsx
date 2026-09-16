import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Internships",
  description: "Find practical internship opportunities and real-world experience through SC TECH.",
  alternates: { canonical: "/internships" },
};

export default function InternshipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
