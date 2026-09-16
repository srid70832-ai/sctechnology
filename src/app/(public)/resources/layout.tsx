import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technology Career Resources",
  description: "Read SC TECH resources about technology skills, projects, careers and professional growth.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
