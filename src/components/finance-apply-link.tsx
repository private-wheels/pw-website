"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

/** The partner's application link, counted in analytics when clicked. */
export function FinanceApplyLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track("finance_apply_clicked")}
    >
      {children}
    </a>
  );
}
