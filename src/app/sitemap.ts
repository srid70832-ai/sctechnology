import type { MetadataRoute } from "next";

const SITE_URL = "https://sctech.vercel.app";

const publicPaths = [
  "/",
  "/about",
  "/companies",
  "/contact",
  "/cookie-policy",
  "/courses",
  "/hackathons",
  "/hr-sessions",
  "/internships",
  "/leaderboard",
  "/plans",
  "/privacy",
  "/problem-statements",
  "/projects",
  "/resources",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}