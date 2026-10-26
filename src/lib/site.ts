/** Server-side site settings shared by emails, pricing and pages. */

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * True until launch day (`SITE_LAUNCHED=true`). Before launch the marketplace
 * is behind the coming-soon gate, approved listings wait for launch day, and
 * sellers pay the founding price.
 */
export function isPreLaunch(): boolean {
  return process.env.SITE_LAUNCHED !== "true";
}
