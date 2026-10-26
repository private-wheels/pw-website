import Link from "next/link";
import { BrandLogo } from "@/components/brand-mark";
import { SUPPORT_EMAIL } from "@/lib/email";

/**
 * The /list funnel's own chrome: just the logo and the essentials, no site
 * navigation (the root layout's header and footer are hidden here — see
 * SiteChrome).
 */
export default function ListLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/list" aria-label="Private Wheels — list your car">
            <BrandLogo className="h-7 w-auto text-primary" />
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} PRIVATEWHEELS (PTY) LTD</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/legal/terms" className="hover:text-foreground">Terms of Use</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/legal/refunds" className="hover:text-foreground">Refund Policy</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">{SUPPORT_EMAIL}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
