import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technology Problem Statements",
  description: "Browse technology problem statements and challenges published by SC TECH.",
  alternates: { canonical: "/problem-statements" },
};

export default function ProblemStatementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
