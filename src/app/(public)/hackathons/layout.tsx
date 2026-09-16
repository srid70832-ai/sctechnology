import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Hackathons",
  description: "Discover SC TECH hackathons where students can compete, collaborate and build projects.",
  alternates: { canonical: "/hackathons" },
};

export default function HackathonsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
