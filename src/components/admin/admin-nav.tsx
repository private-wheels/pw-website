"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard/admin", label: "Review queue" },
  { href: "/dashboard/admin/listings", label: "All listings" },
  { href: "/dashboard/admin/payments", label: "Payments" },
  { href: "/dashboard/admin/members", label: "Members" },
  { href: "/dashboard/admin/refunds", label: "Refund guide" },
  { href: "/dashboard/admin/emails", label: "Emails" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/dashboard/admin"
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
