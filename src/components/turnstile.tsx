"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile — the bot check Supabase Auth verifies on sign-up,
 * sign-in and anonymous starts once CAPTCHA protection is switched on in the
 * Supabase dashboard. "interaction-only" keeps it invisible for almost
 * everyone; a checkbox appears only when Cloudflare isn't sure.
 *
 * Without NEXT_PUBLIC_TURNSTILE_SITE_KEY it renders nothing and reports
 * "ready" straight away, so local dev works without a key.
 */

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function Widget({ onToken, action }: { onToken: (token: string | null) => void; action: string }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  });

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: SITE_KEY,
          action,
          appearance: "interaction-only",
          "refresh-expired": "auto",
          callback: (token: string) => callback.current(token),
          "expired-callback": () => callback.current(null),
          "error-callback": () => callback.current(null),
        });
      })
      .catch(() => callback.current(null));
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [action]);

  return <div ref={container} className="flex justify-center empty:hidden" />;
}

/**
 * `token` to pass as Supabase's `captchaToken`; `ready` once there is one (or
 * Turnstile is off). Tokens are single-use — call `reset()` after a failed
 * attempt to get a fresh one.
 */
export function useTurnstile(action: string) {
  const [token, setToken] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const reset = useCallback(() => {
    setToken(null);
    setGeneration((g) => g + 1);
  }, []);

  const widget = SITE_KEY ? <Widget key={generation} action={action} onToken={setToken} /> : null;
  return {
    widget,
    token: token ?? undefined,
    ready: !SITE_KEY || token !== null,
    reset,
  };
}
