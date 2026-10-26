import Link from "next/link";
import { SiteContainer } from "@/components/site-container";
import { Button } from "@/components/ui/button";

/**
 * Branded 404. Replaces Next's built-in page, whose dark-mode styles turned
 * the site header's "Sign In" link white-on-white.
 */
export default function NotFound() {
  return (
    <SiteContainer className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">We couldn&apos;t find that page</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The link may be broken, or the page may have moved. If a car listing has gone, it may have been sold.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button className="rounded-full bg-primary hover:bg-primary/90" render={<Link href="/">Go to the home page</Link>} />
        <Button variant="outline" className="rounded-full" render={<Link href="/list">List your car</Link>} />
      </div>
    </SiteContainer>
  );
}
