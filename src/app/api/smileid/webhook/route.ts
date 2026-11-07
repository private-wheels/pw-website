import type { NextRequest } from "next/server";
import { syncAttempt } from "@/lib/smileid";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Smile ID webhook — set this URL under Developers → Security Settings →
 * Callback URLs in the Smile ID portal (sandbox and production separately).
 *
 * The body only tells us which check to look at. We never trust its verdict:
 * `syncAttempt` asks Smile ID for the job's status and checks it belongs to
 * the attempt's user, so a forged or replayed webhook can't verify anyone.
 * (That's also why there's no signature check here: Smile ID's documented
 * signature recipe relies on a field it doesn't define.) Any non-2xx makes
 * Smile ID retry, so we only return one when recording actually failed.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    status?: string;
    reason?: string | null;
    job_id?: string;
    partner_params?: { attempt_id?: string; job_id?: string };
  } | null;

  const attemptId = body?.partner_params?.attempt_id;
  if (!attemptId || !/^[0-9a-f-]{36}$/i.test(attemptId)) {
    return new Response(null, { status: 200 });
  }

  try {
    const { data: attempt, error } = await createAdminClient()
      .from("identity_verifications")
      .select("id, user_id, job_id, status")
      .eq("id", attemptId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (attempt) {
      await syncAttempt(attempt, {
        jobId: body?.job_id ?? body?.partner_params?.job_id,
        reason: typeof body?.reason === "string" ? body.reason : null,
      });
    }
  } catch (err) {
    console.error("[smileid webhook]", err);
    return new Response("Couldn't record result", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
