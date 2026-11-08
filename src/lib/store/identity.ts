"use client";

import type { VerificationSession } from "@/app/actions/identity";

/**
 * Opens Smile ID's hosted Web SDK (v12) for a Biometric KYC check. The SDK
 * runs in its own iframe: consent, ID number, selfie and liveness all happen
 * there and go straight to Smile ID. The verdict never comes from here (only
 * from Smile ID's API), we just learn the job ID or that they gave up.
 */

const SCRIPT_URL = "https://cdn.usesmileid.com/inline/v12/js/script.min.js";

type SmileResult = {
  status?: string;
  state?: string;
  value?: { job_id?: string };
  error?: { message?: string; error_code?: string };
};

declare global {
  interface Window {
    SmileIdentity?: (config: Record<string, unknown>) => void;
  }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.SmileIdentity) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load Smile ID."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type LaunchOutcome =
  | { type: "submitted"; jobId: string }
  | { type: "cancelled" }
  | { type: "failed"; message: string };

export async function launchSmileId(session: VerificationSession): Promise<LaunchOutcome> {
  await loadScript();
  if (!window.SmileIdentity) throw new Error("Couldn't load Smile ID.");

  return new Promise<LaunchOutcome>((resolve) => {
    window.SmileIdentity!({
      token: session.token,
      product: "biometric_kyc",
      callback_url: session.callbackUrl,
      environment: session.environment,
      partner_details: {
        partner_id: session.partnerId,
        name: "Private Wheels",
        logo_url: session.logoUrl,
        policy_url: session.policyUrl,
        theme_color: "#d90429",
      },
      id_selection: { ZA: ["NATIONAL_ID"] },
      // Echoed back on the webhook so we know which attempt it's about.
      partner_params: { attempt_id: session.attemptId },
      onResult: (result: SmileResult) => {
        const kind = result.status ?? result.state;
        if (result.value?.job_id) resolve({ type: "submitted", jobId: result.value.job_id });
        else if (kind === "cancelled") resolve({ type: "cancelled" });
        else resolve({ type: "failed", message: result.error?.message ?? "The check didn't go through." });
      },
    });
  });
}
