import type { MetadataRoute } from "next";

const SITE_URL = "https://sctech.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sc-tech-logo.png"],
      disallow: [
        "/admin",
        "/admin/",
        "/dashboard",
        "/dashboard/",
        "/student",
        "/student/",
        "/company",
        "/company/",
        "/judge",
        "/judge/",
        "/login",
        "/login/",
        "/profile",
        "/profile/",
        "/onboarding",
        "/onboarding/",
        "/payments",
        "/payments/",
        "/receipts",
        "/receipts/",
        "/api",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}