import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses and Learning Resources",
  description: "Browse learning resources and courses to build practical technology skills with SC TECH.",
  alternates: { canonical: "/courses" },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
