import type { ReactNode } from "react";
import { BUSINESS, LEGAL_LAST_UPDATED } from "@/lib/legal";

/**
 * The readable shell every policy page shares: a title, the "last updated"
 * line, a short plain-language summary, then numbered sections.
 *
 * Body copy is styled with descendant selectors so the pages themselves can
 * stay plain JSX (`<p>`, `<ul>`, `<a>`, `<table>`).
 */
export function LegalDocument({
  title,
  summary,
  children,
}: {
  title: string;
  summary: ReactNode;
  children: ReactNode;
}) {
  return (
    <article>
      <header className="border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>
        <div className="mt-6 rounded-2xl bg-muted/60 p-5 text-sm leading-relaxed">
          <p className="font-semibold">In short</p>
          <div className="mt-2 text-muted-foreground">{summary}</div>
        </div>
      </header>

      <div className="mt-8 text-[15px] leading-relaxed text-foreground/90 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mt-1.5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_table]:mt-4 [&_table]:w-full [&_table]:text-left [&_table]:text-sm [&_td]:border-t [&_td]:py-2.5 [&_td]:pr-4 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-4 [&_th]:font-semibold [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

/** A numbered, linkable section of a policy. */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-8 first:pt-0">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/** Wide tables scroll sideways on phones instead of breaking the layout. */
export function LegalTable({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="min-w-[560px]">{children}</table>
    </div>
  );
}

/** Who we are and how to reach us — repeated at the end of each policy. */
export function BusinessContact() {
  return (
    <ul>
      <li>
        <strong>{BUSINESS.legalName}</strong>, trading as {BUSINESS.tradingName}
        <br />
        Company registration number: {BUSINESS.registrationNumber}
      </li>
      <li>Address: {BUSINESS.address}</li>
      <li>
        Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
      </li>
      <li>Phone and WhatsApp: {BUSINESS.phone}</li>
      <li>
        Website: <a href={BUSINESS.website}>{BUSINESS.website.replace("https://", "")}</a>
      </li>
    </ul>
  );
}
