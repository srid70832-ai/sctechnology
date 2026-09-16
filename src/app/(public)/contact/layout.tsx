import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact SC TECH",
  description: "Contact SC TECH for support and questions about internships, hackathons, projects and career programs.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
