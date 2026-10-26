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

/**
 * Whether sellers pay the founding price (R125) instead of the full R249.
 * Follows the launch by default, so founding pricing ends on launch day.
 * FOUNDING_PRICE=on / off overrides that — e.g. to keep it running a little
 * after launch, or to see founding prices locally with SITE_LAUNCHED=true.
 */
export function isFoundingPriceActive(): boolean {
  const override = process.env.FOUNDING_PRICE?.trim().toLowerCase();
  if (override === "on") return true;
  if (override === "off") return false;
  return isPreLaunch();
}
