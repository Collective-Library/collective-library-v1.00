import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/auth/",
          "/onboarding",
          "/profile/edit",
          "/api/",
          "/book/add",
          "/book/import",
          "/wanted/add",
        ],
      },
    ],
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
