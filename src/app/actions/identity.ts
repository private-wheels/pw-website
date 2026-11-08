"use server";

import { MAX_ATTEMPTS, MAX_BLOCKS, type IdentityStatus, type VerificationState } from "@/lib/identity";
import { siteUrl } from "@/lib/site";
import { createSessionToken, smileConfig, syncAttempt, type SmileEnvironment } from "@/lib/smileid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The seller side of identity verification. Reads go through the user's own
 * session (RLS); writes use the secret key, since sellers can't change their
 * own verification state. See lib/smileid.ts for the whole flow.
 */

const ATTEMPT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Where the seller stands, and whether they may start another check. */
async function loadState(userId: string): Promise<VerificationState> {
  const db = createAdminClient();
  const [{ data: profile }, { data: attempts }] = await Promise.all([
    db.from("profiles").select("identity_status").eq("id", userId).maybeSingle(),
    db
      .from("identity_verifications")
      .select("status, submitted_at")
      .eq("user_id", userId)
      .neq("status", "started")
      .order("created_at", { ascending: false }),
  ]);
  const status = (profile?.identity_status ?? "unverified") as IdentityStatus;
  const finished = (attempts ?? []).filter((a) => a.status !== "processing");
  const blocks = finished.filter((a) => a.status === "block").length;
  const last = finished[0]?.status as VerificationState["lastOutcome"] | undefined;

  return {
    status,
    canStart: status === "unverified" && finished.length < MAX_ATTEMPTS && blocks < MAX_BLOCKS,
    lastOutcome: last ?? null,
    submittedAt: status === "pending" ? (attempts?.find((a) => a.status === "processing")?.submitted_at ?? null) : null,
  };
}

/**
 * The seller's verification state. While a check is in progress it also asks
 * Smile ID for the verdict, so the page doesn't depend on the webhook.
 */
export async function getVerificationState(): Promise<VerificationState | null> {
  const { user } = await currentUser();
  if (!user) return null;

  const state = await loadState(user.id);
  if (state.status !== "pending" || !smileConfig().configured) return state;

  const { data: processing } = await createAdminClient()
    .from("identity_verifications")
    .select("id, user_id, job_id, status")
    .eq("user_id", user.id)
    .eq("status", "processing");
  for (const attempt of processing ?? []) {
    await syncAttempt(attempt).catch((err) => console.error("[smileid] sync", err));
  }
  return loadState(user.id);
}

export type VerificationSession = {
  attemptId: string;
  token: string;
  partnerId: string;
  environment: SmileEnvironment;
  callbackUrl: string;
  logoUrl: string;
  policyUrl: string;
};

/** Opens a Smile ID session for the signed-in seller's next check. */
export async function startVerification(): Promise<VerificationSession | { error: string }> {
  const { user } = await currentUser();
  // Anonymous /list sellers have added an email by now (pending confirmation).
  if (!user || !(user.email || user.new_email)) return { error: "Please sign in first." };

  const config = smileConfig();
  if (!config.configured || !config.partnerId) {
    return { error: "Identity verification isn't available right now. Please try again later." };
  }

  const state = await loadState(user.id);
  if (state.status === "verified") return { error: "You're already verified." };
  if (!state.canStart) return { error: "You can't start another check. Please contact us for help." };

  const db = createAdminClient();
  const { data: attempt, error } = await db
    .from("identity_verifications")
    .insert({ user_id: user.id })
    .select("id")
    .single();
  if (error) {
    console.error("[smileid] couldn't record attempt:", error.message);
    return { error: "We couldn't start the check. Please try again." };
  }

  try {
    const token = await createSessionToken(user.id);
    return {
      attemptId: attempt.id,
      token,
      partnerId: config.partnerId,
      environment: config.environment,
      callbackUrl: config.callbackUrl,
      logoUrl: `${siteUrl()}/private-wheels-logo.svg`,
      policyUrl: `${siteUrl()}/legal/privacy`,
    };
  } catch (err) {
    console.error("[smileid]", err);
    await db.from("identity_verifications").delete().eq("id", attempt.id);
    return { error: "We couldn't reach our verification partner. Please try again." };
  }
}

/**
 * The Web SDK submitted the check: remember Smile ID's job ID and wait for
 * the verdict. The job ID isn't trusted on its own; every status lookup
 * checks the job belongs to this user.
 */
export async function verificationSubmitted(attemptId: string, jobId: string): Promise<{ ok: boolean }> {
  if (!ATTEMPT_ID.test(attemptId) || !/^[\w-]{1,100}$/.test(jobId)) return { ok: false };
  const { user } = await currentUser();
  if (!user) return { ok: false };

  const db = createAdminClient();
  const { data: updated, error } = await db
    .from("identity_verifications")
    .update({ job_id: jobId, status: "processing", submitted_at: new Date().toISOString() })
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .eq("status", "started")
    .select("id");
  if (error) {
    console.error("[smileid] couldn't record submission:", error.message);
    return { ok: false };
  }
  if (updated.length > 0) {
    await db
      .from("profiles")
      .update({ identity_status: "pending" })
      .eq("id", user.id)
      .eq("identity_status", "unverified");
  }
  return { ok: true };
}
