import Link from "next/link";
import { ArrowUp, Mail, MessageCircle, ShieldCheck, Tag } from "lucide-react";
import { SiteContainer } from "@/components/site-container";
import { BrandLogo } from "@/components/brand-mark";
import { COMING_SOON } from "@/lib/coming-soon";
import { LEGAL_LINKS } from "@/lib/legal";

const FOOTER_COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Buy a Car", href: "/cars" },
      { label: "Sell Your Car", href: "/sell" },
      { label: "Finance Calculator", href: "/finance" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "My Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Private Wheels",
    links: [
      { label: "South Africa", href: "#" },
      { label: "hello@private-wheels.co.za", href: "#" },
    ],
  },
];

const TRUST = [
  { icon: ShieldCheck, label: "Verified private sellers" },
  { icon: Tag, label: "No dealer mark-up" },
  { icon: MessageCircle, label: "Talk to the owner directly" },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-foreground text-background">
      <SiteContainer className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <Link href="/" className="flex items-center">
                <BrandLogo className="h-5 w-auto text-primary" />
              </Link>
              <p className="mt-3 max-w-md text-sm opacity-70">
                South Africa&apos;s trusted private vehicle marketplace. Buy and sell with
                confidence, backed by verified listings.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`https://wa.me/${COMING_SOON.whatsappNumber}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-background/15"
              >
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                WhatsApp us
              </Link>
              <Link
                href={`mailto:${COMING_SOON.contactEmail}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-background/15"
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                Email us
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-background/15 pt-6 text-sm opacity-80">
            {TRUST.map((t) => (
              <span key={t.label} className="flex items-center gap-1.5">
                <t.icon className="h-4 w-4 text-primary" />
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm opacity-70 transition-opacity hover:opacity-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </SiteContainer>

      <div className="border-t border-background/15">
        <SiteContainer className="flex flex-col items-center justify-between gap-4 py-6 text-sm opacity-70 sm:flex-row">
          <p>© {new Date().getFullYear()} Private Wheels (Pty) Ltd. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:opacity-100 hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
          <a
            href="#"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-background/10"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Top
          </a>
        </SiteContainer>
      </div>
    </footer>
  );
}
