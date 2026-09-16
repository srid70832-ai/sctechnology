import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real-World Technology Projects",
  description: "Explore real-world technology projects and practical engineering work on SC TECH.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
