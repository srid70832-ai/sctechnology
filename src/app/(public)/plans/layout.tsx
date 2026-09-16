import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SC TECH Plans",
  description: "Compare SC TECH plans for learning resources, projects, certificates and career support.",
  alternates: { canonical: "/plans" },
};

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return children;
}
