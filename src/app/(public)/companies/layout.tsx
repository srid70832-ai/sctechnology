import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Companies and Hiring Opportunities",
  description: "Explore companies and career opportunities available through SC TECH.",
  alternates: { canonical: "/companies" },
};

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
