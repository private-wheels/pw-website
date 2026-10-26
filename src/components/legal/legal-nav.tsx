"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_LINKS } from "@/lib/legal";
import { cn } from "@/lib/utils";

/** Pill tabs linking the three policies to each other. */
export function LegalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Legal" className="flex flex-wrap gap-2">
      {LEGAL_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
