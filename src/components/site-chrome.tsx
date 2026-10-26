"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Pages that bring their own minimal header and footer instead of the site's
 * navigation — the pre-launch /list flow, which is a focused funnel and must
 * not lead people into the (still gated) marketplace.
 */
const STANDALONE_PREFIXES = ["/list"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const standalone = STANDALONE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return standalone ? null : <>{children}</>;
}
