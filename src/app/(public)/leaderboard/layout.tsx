import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SC TECH Leaderboard",
  description: "View public SC TECH achievements and leaderboard results from student activities.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
