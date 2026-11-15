"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react";
import { sendLaunchEmails } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

/**
 * Launch day: tells every seller approved before launch that their listing is
 * now live. Shown on the admin overview once the site has launched and there
 * are sellers still to tell.
 */
export function LaunchEmails({ count }: { count: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function send() {
    startTransition(async () => {
      const result = await sendLaunchEmails();
      setConfirming(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.failed > 0) {
        toast.warning(`Sent ${result.sent}. ${result.failed} couldn't be sent; press the button again to retry them.`);
      } else {
        toast.success(`Sent ${result.sent} "we're live" email${result.sent === 1 ? "" : "s"}.`);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center">
      <Rocket className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="font-semibold">Tell your founding sellers they&apos;re live</p>
        <p className="text-sm text-muted-foreground">
          {count} seller{count === 1 ? " was" : "s were"} approved before launch and told their car would go live on
          launch day. Send each of them a &quot;we&apos;re live&quot; email with a link to their listing. Each one is only
          sent once.
        </p>
      </div>
      {confirming ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
            Cancel
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={send} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send {count} email{count === 1 ? "" : "s"}
          </Button>
        </div>
      ) : (
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setConfirming(true)}>
          Send launch emails
        </Button>
      )}
    </div>
  );
}
