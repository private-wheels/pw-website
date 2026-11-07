import { adminNotifyRecipients, sendEmail } from "@/lib/email";
import {
  adminIdentityReviewEmail,
  identityFailedEmail,
  identityInReviewEmail,
  identityRetryEmail,
  identityVerifiedEmail,
} from "@/lib/email-templates";
import { CHECK_SLOW_AFTER_MS, statusAfterOutcome, type IdentityStatus } from "@/lib/identity";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IdentityVerificationRow } from "@/lib/supabase/database.types";

/**
 * Smile ID (https://docs.usesmileid.com, API v3) — server only. Sellers verify
 * with Biometric KYC: their SA ID number and a selfie, compared with the photo
 * Home Affairs holds for that ID.
 *
 *   1. startVerification (server action) records a `started` attempt and mints
 *      a short-lived session token with `createSessionToken`.
 *   2. The browser runs Smile ID's hosted Web SDK, which uploads the selfie
 *      straight to Smile ID (we never see it) and hands back a job ID, which
 *      we store on the attempt (`processing`).
 *   3. The verdict comes from Smile ID's webhook (/api/smileid/webhook) or from
 *      the verify page polling `syncAttempt`. Either way we ask Smile ID for
 *      the job's status ourselves and only trust that answer, so a forged
 *      webhook can't verify anyone. Recording an outcome twice is harmless.
 *
 * Env: SMILE_ID_PARTNER_ID, SMILE_ID_API_KEY, SMILE_ID_ENV (sandbox |
 * production, default sandbox) and optionally SMILE_ID_CALLBACK_URL (defaults
 * to <site>/api/smileid/webhook; set it to a tunnel URL when testing locally).
 */

export type SmileEnvironment = "sandbox" | "production";

export function smileConfig() {
  const partnerId = process.env.SMILE_ID_PARTNER_ID?.trim();
  const apiKey = process.env.SMILE_ID_API_KEY?.trim();
  const environment: SmileEnvironment =
    process.env.SMILE_ID_ENV?.trim().toLowerCase() === "production" ? "production" : "sandbox";
  return {
    partnerId,
    apiKey,
    environment,
    configured: Boolean(partnerId && apiKey),
    baseUrl:
      environment === "production" ? "https://api.smileidentity.com" : "https://testapi.smileidentity.com",
    callbackUrl: process.env.SMILE_ID_CALLBACK_URL?.trim() || `${siteUrl()}/api/smileid/webhook`,
  };
}

function credentials() {
  const config = smileConfig();
  if (!config.partnerId || !config.apiKey) {
    throw new Error("SMILE_ID_PARTNER_ID and SMILE_ID_API_KEY must be set.");
  }
  return { ...config, partnerId: config.partnerId, apiKey: config.apiKey };
}

/**
 * Mints a v3 token (valid 15 minutes). With a product it's the Web SDK's
 * session token for that user; without one it authorises our own API calls.
 */
async function mintToken(params: { product?: "biometric_kyc"; userId?: string } = {}): Promise<string> {
  const { baseUrl, partnerId, apiKey } = credentials();
  const form = new FormData();
  if (params.product) form.append("product", params.product);
  if (params.userId) form.append("user_id", params.userId);

  const res = await fetch(`${baseUrl}/v3/token`, {
    method: "POST",
    headers: { "smileid-partner-id": partnerId, "smileid-api-key": apiKey },
    body: form,
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as { token?: string; message?: string } | null;
  if (!res.ok || !body?.token) {
    throw new Error(`Smile ID token failed: ${res.status} ${body?.message ?? ""}`.trim());
  }
  return body.token;
}

/** The Web SDK token for one seller's Biometric KYC check. */
export function createSessionToken(userId: string): Promise<string> {
  return mintToken({ product: "biometric_kyc", userId });
}

// Our own API token, reused until shortly before it expires.
let apiToken: { value: string; expires: number } | null = null;

async function serverToken(): Promise<string> {
  if (apiToken && apiToken.expires > Date.now()) return apiToken.value;
  const value = await mintToken();
  apiToken = { value, expires: Date.now() + 12 * 60 * 1000 };
  return value;
}

type JobStatus = {
  status: "clear" | "block" | "attention" | "error" | "processing" | "not_found";
  job_id: string;
  user_id: string;
  message?: string;
};

/** Asks Smile ID for a job's current status (GET /v3/status/{jobId}). */
async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  const { baseUrl, partnerId } = credentials();
  const res = await fetch(`${baseUrl}/v3/status/${encodeURIComponent(jobId)}`, {
    headers: { "SmileID-Partner-ID": partnerId, "SmileID-Token": await serverToken() },
    cache: "no-store",
  });
  if (res.status === 404) return { status: "not_found", job_id: jobId, user_id: "" };
  if (res.status === 401) apiToken = null;
  const body = (await res.json().catch(() => null)) as JobStatus | null;
  if (!res.ok || !body?.status) {
    throw new Error(`Smile ID status for ${jobId} failed: ${res.status}`);
  }
  return body;
}

/**
 * Checks an attempt's job with Smile ID and records the verdict if there is
 * one. `jobId` is only needed when the attempt doesn't have one yet (the
 * webhook arrived before the browser reported it); Smile ID's answer must
 * belong to the attempt's user either way.
 */
export async function syncAttempt(
  attempt: Pick<IdentityVerificationRow, "id" | "user_id" | "job_id" | "status">,
  opts: { jobId?: string; reason?: string | null } = {},
): Promise<void> {
  if (attempt.status !== "started" && attempt.status !== "processing") return;
  const jobId = attempt.job_id ?? opts.jobId;
  if (!jobId) return;

  const job = await fetchJobStatus(jobId);
  if (job.status === "processing" || job.status === "not_found") return;
  if (!attempt.user_id || job.user_id !== attempt.user_id) {
    console.error(`[smileid] job ${jobId} belongs to another user; ignored for attempt ${attempt.id}`);
    return;
  }
  await recordOutcome(attempt.id, jobId, job.status, opts.reason ?? null);
}

/**
 * Stores a finished check and moves the seller's profile on. Only the first
 * call for an attempt does anything, so the webhook and the polling page
 * can't double-count it.
 */
async function recordOutcome(
  attemptId: string,
  jobId: string,
  outcome: "clear" | "attention" | "block" | "error",
  reason: string | null,
): Promise<void> {
  const db = createAdminClient();
  const now = new Date();

  const { data: updated, error } = await db
    .from("identity_verifications")
    .update({
      job_id: jobId,
      status: outcome,
      reason: outcome === "clear" ? null : (reason?.slice(0, 100) ?? null),
      completed_at: now.toISOString(),
    })
    .eq("id", attemptId)
    .in("status", ["started", "processing"])
    .select("user_id, submitted_at");
  if (error) throw new Error(error.message);
  const attempt = updated[0];
  // Gone already, or the seller deleted their account mid-check.
  if (!attempt?.user_id) return;

  const { data: attempts, error: countError } = await db
    .from("identity_verifications")
    .select("status")
    .eq("user_id", attempt.user_id)
    .not("status", "in", "(started,processing)");
  if (countError) throw new Error(countError.message);
  const blocks = attempts.filter((a) => a.status === "block").length;
  const status = statusAfterOutcome(outcome, attempts.length, blocks);

  const { error: profileError } = await db
    .from("profiles")
    .update({
      identity_status: status,
      ...(status === "verified" ? { identity_verified_at: now.toISOString() } : {}),
    })
    .eq("id", attempt.user_id)
    .neq("identity_status", "verified");
  if (profileError) throw new Error(profileError.message);

  // The verify page shows quick results itself; slow ones get an email.
  const slow =
    !attempt.submitted_at || now.getTime() - new Date(attempt.submitted_at).getTime() > CHECK_SLOW_AFTER_MS;
  await notifyIdentity(attempt.user_id, status, { toSeller: slow || status === "review" });
}

/**
 * An admin's decision on a check Smile ID flagged for review (`attention`).
 * Returns false if there was nothing awaiting review for that user.
 */
export async function decideReview(userId: string, approve: boolean, adminId: string): Promise<boolean> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data: reviewed, error } = await db
    .from("identity_verifications")
    .update({ review_decision: approve ? "approved" : "rejected", reviewed_by: adminId, reviewed_at: now })
    .eq("user_id", userId)
    .eq("status", "attention")
    .is("review_decision", null)
    .select("id");
  if (error) throw new Error(error.message);
  if (reviewed.length === 0) return false;

  const status: IdentityStatus = approve ? "verified" : "failed";
  const { error: profileError } = await db
    .from("profiles")
    .update({ identity_status: status, ...(approve ? { identity_verified_at: now } : {}) })
    .eq("id", userId)
    .eq("identity_status", "review");
  if (profileError) throw new Error(profileError.message);

  await notifyIdentity(userId, status, { toSeller: true });
  return true;
}

/** Best-effort emails about a seller's verification. Never throws. */
async function notifyIdentity(
  userId: string,
  status: IdentityStatus,
  opts: { toSeller: boolean },
): Promise<void> {
  try {
    const db = createAdminClient();
    const [{ data: account }, { data: profile }] = await Promise.all([
      db.auth.admin.getUserById(userId),
      db.from("profiles").select("first_name, display_name").eq("id", userId).maybeSingle(),
    ]);
    const to = account.user?.email || account.user?.new_email;
    const name = profile?.first_name || profile?.display_name || "";

    if (status === "review") {
      await sendEmail(adminNotifyRecipients(), adminIdentityReviewEmail({ email: to ?? userId }));
    }
    if (!opts.toSeller || !to) return;

    const email =
      status === "verified"
        ? identityVerifiedEmail({ name })
        : status === "review"
          ? identityInReviewEmail({ name })
          : status === "failed"
            ? identityFailedEmail({ name })
            : status === "unverified"
              ? identityRetryEmail({ name })
              : null;
    if (email) await sendEmail(to, email);
  } catch (err) {
    console.error("[identity email]", err);
  }
}
