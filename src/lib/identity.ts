/**
 * Seller identity verification (Smile ID Biometric KYC), shared by the client
 * (to show it) and the server (to enforce it). Sellers must be verified before
 * they can pay for a listing; admins don't need to be.
 */

export type IdentityStatus = "unverified" | "pending" | "review" | "verified" | "failed";

/** Smile ID's verdicts, plus our own states before one arrives. */
export type AttemptStatus = "started" | "processing" | "clear" | "attention" | "block" | "error";

/** Submitted checks per seller, whatever the outcome. Each one costs us. */
export const MAX_ATTEMPTS = 3;
/** A failed face match or ID lookup gets one retry (a bad selfie happens). */
export const MAX_BLOCKS = 2;

/**
 * Most checks finish within seconds. After this long the verify page says it's
 * taking longer than usual, and the seller gets the result by email instead.
 */
export const CHECK_SLOW_AFTER_MS = 45_000;

/**
 * Where signing in, signing up and confirming an email land by default. The
 * verify page sends verified sellers and admins straight on to the dashboard,
 * so in practice only unverified sellers see it.
 */
export const AFTER_SIGN_IN_PATH = `/list/verify?next=${encodeURIComponent("/dashboard")}`;

export const SMILE_ID_PRIVACY_URL = "https://smileidentity.com/privacy-policy";

/** What the seller sees on the verify page. */
export type VerificationState = {
  status: IdentityStatus;
  /** Whether they can start a (new) check right now. */
  canStart: boolean;
  /** The last finished check, to explain why they're retrying. */
  lastOutcome: Exclude<AttemptStatus, "started" | "processing"> | null;
  /** When the check in progress was submitted (ISO), while `pending`. */
  submittedAt: string | null;
};

/**
 * The profile status after a check finishes. `attempts` and `blocks` count
 * every submitted check including this one.
 */
export function statusAfterOutcome(
  outcome: "clear" | "attention" | "block" | "error",
  attempts: number,
  blocks: number,
): IdentityStatus {
  if (outcome === "clear") return "verified";
  if (outcome === "attention") return "review";
  if (blocks >= MAX_BLOCKS || attempts >= MAX_ATTEMPTS) return "failed";
  return "unverified";
}
