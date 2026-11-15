"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Cookie } from "lucide-react";
import { type AnalyticsConsent, getConsent, onConsentChange, setConsent } from "@/lib/consent";
import { Button } from "@/components/ui/button";

const TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;

/**
 * Google Analytics (the Google tag, through the GTM container) plus the
 * cookie banner that asks for it. The tag only loads after the visitor
 * allows analytics, and only when NEXT_PUBLIC_GOOGLE_TAG_ID is set
 * (Production only, so local dev and previews don't count).
 */
export function GoogleTag() {
  // undefined: not read yet (server render); null: not chosen yet.
  const [consent, setConsentState] = useState<AnalyticsConsent | null | undefined>(undefined);

  useEffect(() => {
    // localStorage only exists in the browser, so read it after mounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsentState(getConsent());
    return onConsentChange(setConsentState);
  }, []);

  if (!TAG_ID) return null;

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(TAG_ID)}`} strategy="afterInteractive" />
          <Script id="google-tag" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
window.gtag = gtag;`}
          </Script>
        </>
      )}
      {consent === null && <CookieBanner />}
    </>
  );
}

function CookieBanner() {
  return (
    <div
      role="dialog"
      aria-label="Cookie choice"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border bg-card p-4 shadow-lg sm:flex-row sm:items-center"
    >
      <Cookie className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
      <p className="flex-1 text-sm text-muted-foreground">
        We&apos;d like to use Google Analytics cookies to see how people use Private Wheels, so we can improve it. They
        aren&apos;t used for advertising.{" "}
        <Link href="/legal/privacy#cookies" className="underline underline-offset-2">
          Cookie details
        </Link>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setConsent("denied")}>
          Only essential
        </Button>
        <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90" onClick={() => setConsent("granted")}>
          Allow analytics
        </Button>
      </div>
    </div>
  );
}
