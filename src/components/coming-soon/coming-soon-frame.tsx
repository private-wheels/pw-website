import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal";

/**
 * Full-bleed shell for the pre-launch holding page. It sits `fixed inset-0` so
 * it covers the site header/footer that the root layout renders around it.
 *
 * No nav bar: the "Private wheels ・ Coming soon" lockup sits inside the centred
 * column as a quiet brand anchor. Plain text — deliberately not the logo.
 */
export function ComingSoonFrame({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      {/* Soft coral halo behind the centred content — a quieter nod to the
          main site's hero banner. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[920px] max-w-[130vw] -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_7%,transparent),transparent)]"
      />

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="mb-6 flex items-center gap-2 text-sm font-medium text-primary">
          <span>Private wheels</span>
          <span aria-hidden="true">・</span>
          <span>Coming soon</span>
        </p>
        {children}
      </main>

      <footer className="relative px-6 pb-6">
        <nav
          aria-label="Legal"
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
        >
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
