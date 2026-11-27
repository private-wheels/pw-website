import type { MetadataRoute } from "next";
import { getActiveListings } from "@/lib/data/listings";
import { siteUrl } from "@/lib/site";

/**
 * /sitemap.xml: the public pages plus every active listing. The listings
 * query shares the listings cache, so approving or removing a listing
 * refreshes the sitemap too.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/cars`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sell`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/list`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/finance`, changeFrequency: "monthly", priority: 0.6 },
    ...["privacy", "terms", "refunds", "paia"].map((p) => ({
      url: `${base}/legal/${p}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];

  const listings = (await getActiveListings()).map((v) => ({
    url: `${base}/cars/${v.id}`,
    lastModified: v.createdAt ? new Date(v.createdAt) : undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...pages, ...listings];
}
