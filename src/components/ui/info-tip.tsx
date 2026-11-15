"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small (i) next to a label that explains it. Opens on hover with a mouse
 * and on tap on phones (a plain tooltip never opens on touch screens).
 */
export function InfoTip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={100}
        aria-label={`What is ${label}?`}
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={6} collisionPadding={12} className="isolate z-50">
          <Popover.Popup className="max-w-64 origin-(--transform-origin) rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-md duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
