"use client";

import { resetConsent } from "@/lib/consent";
import { Button } from "@/components/ui/button";

/** Lets visitors change their analytics cookie choice (shows the banner again). */
export function CookieSettingsButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={() => {
        resetConsent();
        // Turning analytics off fully needs a reload to unload the tag.
        window.location.reload();
      }}
    >
      Change my cookie choice
    </Button>
  );
}
