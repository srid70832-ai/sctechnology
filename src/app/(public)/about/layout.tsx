import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About SC TECH",
  description: "Learn how SC TECH helps students build skills, projects, credentials and career opportunities.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
