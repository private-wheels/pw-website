import type { MetadataRoute } from "next";
import { isPreLaunch, siteUrl } from "@/lib/site";

/**
 * /robots.txt. Before launch every page shows the holding page, so crawlers
 * are kept out entirely; from SITE_LAUNCHED=true (after a redeploy) the
 * marketplace is open and the sitemap is advertised. Private areas — the
 * seller dashboard, sign-in callbacks, the steps after /list and the API —
 * stay out of search either way.
 */
export default function robots(): MetadataRoute.Robots {
  if (isPreLaunch()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/dashboard", "/list/", "/login/", "/preview", "/coming-soon"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
