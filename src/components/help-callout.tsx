import { LifeBuoy } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/email";
import { cn } from "@/lib/utils";

/** "Stuck?" line for the listing flow — real people answer hello@. */
export function HelpCallout({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-sm text-muted-foreground", className)}>
      <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Stuck or something not working? Email us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-foreground underline underline-offset-2">
          {SUPPORT_EMAIL}
        </a>{" "}
        and we&apos;ll help you get listed.
      </span>
    </p>
  );
}
