/**
 * Shared config + helpers for the pre-launch "coming soon" holding page.
 *
 * The page exists to turn a car owner who lands here into a booked early seller
 * over WhatsApp — nothing about the live marketplace is wired in yet.
 */

export const COMING_SOON = {
  /**
   * WhatsApp Business number the button opens a chat with — international
   * format, digits only, no `+` and no spaces (what wa.me expects).
   * e.g. +27 82 123 4567  →  "27821234567"
   */
  whatsappNumber: "27828139950",

  /**
   * The message pre-filled in that chat. WhatsApp drops the visitor into the
   * conversation with this typed and ready — they just tap send.
   */
  whatsappMessage:
    "Hi Private Wheels,\n\nI'd like to sell my car privately and have a question about listing.",

  /** Fallback for people who won't open WhatsApp for a brand they don't know. */
  contactEmail: "hello@private-wheels.co.za",

  launchCity: "Cape Town",
} as const;

/** Build a `wa.me` deep link with a pre-filled first message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${COMING_SOON.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
