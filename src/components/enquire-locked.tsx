"use client";

import { Popover } from "@base-ui/react/popover";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * "Enquire Now" for a seller who hasn't confirmed their email address yet:
 * enquiries are emailed to the seller, so there's nowhere to send one. The
 * button is disabled; hovering (or tapping, on phones) explains why.
 */
export function EnquireLocked({ sellerFirstName }: { sellerFirstName: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={100}
        nativeButton={false}
        render={<span tabIndex={0} />}
        aria-label="Why can't I send an enquiry?"
        className="block rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Button variant="outline" className="pointer-events-none h-12 w-full rounded-full" disabled tabIndex={-1}>
          <Lock className="h-4 w-4" />
          Enquire Now
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} collisionPadding={12} className="isolate z-50">
          <Popover.Popup className="max-w-64 origin-(--transform-origin) rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-md duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0">
            {sellerFirstName} hasn&apos;t confirmed their email address yet, so we can&apos;t pass on messages. Call
            them using the number above instead.
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
