"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

/**
 * Cloudflare Turnstile — the bot check Supabase Auth verifies on sign-up,
 * sign-in and anonymous starts once CAPTCHA protection is switched on in the
 * Supabase dashboard. "interaction-only" keeps it invisible for almost
 * everyone; a checkbox appears only when Cloudflare isn't sure.
 *
 * Forms never wait on it up front: their submit button stays enabled, and
 * `getToken()` waits for the check to finish when they submit (showing what's
 * happening), so pressing the button always does something. Failed checks
 * retry on their own, then offer a "Try again" button instead of a refresh.
 *
 * Without NEXT_PUBLIC_TURNSTILE_SITE_KEY it renders nothing and `getToken()`
 * resolves straight away, so local dev works without a key.
 */

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** How long a submit waits for a token before giving up. */
const TOKEN_WAIT_MS = 20_000;
/** Errors Turnstile may retry on its own before we offer "Try again". */
const MAX_SILENT_ERRORS = 2;

type Status =
  /** Working in the background (most people only ever see this). */
  | "checking"
  /** Has a fresh token. */
  | "ready"
  /** Cloudflare wants the visitor to tick the box. */
  | "interactive"
  /** Couldn't complete; the visitor can try again. */
  | "failed";

export class CaptchaError extends Error {}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      script.remove();
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type WidgetEvents = {
  onToken: (token: string) => void;
  onExpired: () => void;
  onInteractive: () => void;
  onError: () => void;
};

function Widget({ action, events }: { action: string; events: WidgetEvents }) {
  const container = useRef<HTMLDivElement>(null);
  const handlers = useRef(events);
  useEffect(() => {
    handlers.current = events;
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
          theme: "light",
          size: "flexible",
          retry: "auto",
          "refresh-expired": "auto",
          callback: (token: string) => handlers.current.onToken(token),
          "expired-callback": () => handlers.current.onExpired(),
          "before-interactive-callback": () => handlers.current.onInteractive(),
          "timeout-callback": () => handlers.current.onError(),
          "unsupported-callback": () => handlers.current.onError(),
          "error-callback": () => {
            handlers.current.onError();
            // Handled: let Turnstile retry rather than throw.
            return true;
          },
        });
      })
      .catch(() => handlers.current.onError());
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [action]);

  return <div ref={container} className="w-full empty:hidden" />;
}

/**
 * `widget` goes inside the form (it also shows the check's status); call
 * `getToken()` on submit and pass the result as Supabase's `captchaToken`.
 * Tokens are single-use: call `reset()` after a failed attempt.
 */
export function useTurnstile(action: string) {
  const [status, setStatusState] = useState<Status>("checking");
  const statusRef = useRef<Status>("checking");
  const setStatus = useCallback((next: Status) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);
  const [generation, setGeneration] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const token = useRef<string | null>(null);
  const errors = useRef(0);
  const waiters = useRef(new Set<(token: string | null) => void>());

  const settle = useCallback((value: string | null) => {
    waiters.current.forEach((resolve) => resolve(value));
    waiters.current.clear();
  }, []);

  const reset = useCallback(() => {
    token.current = null;
    errors.current = 0;
    setStatus("checking");
    setGeneration((g) => g + 1);
  }, [setStatus]);

  const events: WidgetEvents = {
    onToken: (value) => {
      token.current = value;
      errors.current = 0;
      setStatus("ready");
      settle(value);
    },
    onExpired: () => {
      token.current = null;
      setStatus("checking");
    },
    onInteractive: () => setStatus("interactive"),
    onError: () => {
      token.current = null;
      errors.current += 1;
      if (errors.current > MAX_SILENT_ERRORS) {
        setStatus("failed");
        settle(null);
      } else {
        setStatus("checking");
      }
    },
  };

  /**
   * The current token, or waits (up to 20 s) for the check to finish.
   * Throws a CaptchaError with a message to show if it doesn't.
   */
  const getToken = useCallback(async (): Promise<string | undefined> => {
    if (!SITE_KEY) return undefined;
    if (token.current) return token.current;
    // Already gave up: start a fresh check rather than wait on a dead one.
    if (statusRef.current === "failed") reset();

    setWaiting(true);
    let timer: number | undefined;
    const result = await new Promise<string | null>((resolve) => {
      waiters.current.add(resolve);
      timer = window.setTimeout(() => {
        waiters.current.delete(resolve);
        resolve(null);
      }, TOKEN_WAIT_MS);
    });
    window.clearTimeout(timer);
    setWaiting(false);

    if (result) return result;
    // Still waiting on them to tick the box: leave it there for them. The
    // widget already says so, so there's no extra message (empty).
    if (statusRef.current === "interactive") throw new CaptchaError("");
    setStatus("failed");
    throw new CaptchaError("Press “Try again” above, then press the button again.");
  }, [reset, setStatus]);

  useEffect(() => () => settle(null), [settle]);

  const widget = SITE_KEY ? (
    <div className="flex flex-col items-center gap-2">
      <Widget key={generation} action={action} events={events} />
      {status === "interactive" && (
        <p className="text-center text-xs text-muted-foreground">
          Please tick the box above to confirm you&apos;re human{waiting ? "" : ", then press the button again"}.
        </p>
      )}
      {status !== "interactive" && status !== "failed" && waiting && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running a quick security check…
        </p>
      )}
      {status === "failed" && (
        <div className="flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
          <p>The security check didn&apos;t load. Check your connection (and any ad blocker), then try again.</p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2"
          >
            <RotateCcw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}
    </div>
  ) : null;

  return { widget, getToken, reset, waiting };
}
