import { SiteContainer } from "@/components/site-container";
import { LegalNav } from "@/components/legal/legal-nav";

/**
 * Shared layout for the policy pages. These stay reachable while the site is
 * gated (see `src/proxy.ts`), because the coming-soon page and lead form link
 * to them.
 */
export default function LegalLayout({ children }: LayoutProps<"/legal">) {
  return (
    <SiteContainer className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <LegalNav />
        <div className="mt-8">{children}</div>
      </div>
    </SiteContainer>
  );
}
