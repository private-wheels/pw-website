/**
 * The visitor's choice about analytics cookies (Google Analytics), kept in
 * this browser. Nothing non-essential loads until they choose "granted".
 * The privacy policy promises consent before any analytics cookies.
 */

export type AnalyticsConsent = "granted" | "denied";

const KEY = "pw-analytics-consent";
const EVENT = "pw-consent-change";

export function getConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: AnalyticsConsent): void {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  window.dispatchEvent(new CustomEvent<AnalyticsConsent>(EVENT, { detail: value }));
}

/** Calls `listener` whenever the choice changes in this tab. */
export function onConsentChange(listener: (value: AnalyticsConsent) => void): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<AnalyticsConsent>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

/** Asks again (from the privacy policy's "Cookie settings"). */
export function resetConsent(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}
