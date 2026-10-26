/**
 * Business details and shared constants for the legal pages
 * (`/legal/privacy`, `/legal/terms`, `/legal/refunds`).
 *
 * Anything in [SQUARE BRACKETS] is a placeholder that must be filled in, and
 * the drafts reviewed by an attorney, before launch.
 */

/** Shown at the top of every policy. Bump it whenever any policy changes. */
export const LEGAL_LAST_UPDATED = "[EFFECTIVE DATE]";

export const BUSINESS = {
  legalName: "PRIVATEWHEELS (PTY) LTD",
  tradingName: "Private Wheels",
  registrationNumber: "2025/889931/07",
  vatNumber: "[VAT NUMBER, IF REGISTERED]",
  directors: "Wilhelm Johannes Stoltz",
  address: "18 Peter Rd, Ruimsig, Roodepoort, 1724, Gauteng, South Africa",
  email: "hello@private-wheels.co.za",
  phone: "+27 82 813 9950",
  website: "https://www.private-wheels.co.za",
  informationOfficer: "Wilhelm Stoltz (Director)",
  informationOfficerEmail: "hello@private-wheels.co.za",
} as const;

export const LISTING_FEE = {
  standard: "R249",
  founding: "R124.50",
} as const;

/** Confirm these against inforegulator.org.za before launch; they do change. */
export const INFORMATION_REGULATOR = {
  name: "Information Regulator (South Africa)",
  address: "Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191",
  email: "enquiries@inforegulator.org.za",
  phone: "010 023 5200",
  website: "https://inforegulator.org.za",
} as const;

export const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Use", href: "/legal/terms" },
  { label: "Refund Policy", href: "/legal/refunds" },
] as const;
