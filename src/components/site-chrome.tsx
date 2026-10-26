"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Pages that bring their own minimal header and footer (MinimalChrome)
 * instead of the site's navigation: the pre-launch /list funnel and the
 * policy pages, which must not lead people into the (still gated)
 * marketplace.
 */
const STANDALONE_PREFIXES = ["/list", "/legal"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const standalone = STANDALONE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return standalone ? null : <>{children}</>;
}
