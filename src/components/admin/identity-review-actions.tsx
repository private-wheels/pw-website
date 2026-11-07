"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { decideIdentityReview } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

/** Approve or reject an identity check Smile ID flagged for review. */
export function IdentityReviewActions({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function decide(approve: boolean) {
    if (!approve && !window.confirm(`Reject the identity check for ${email}? They won't be able to list.`)) return;
    startTransition(async () => {
      const result = await decideIdentityReview(userId, approve);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(approve ? "Approved. They can pay for listings now." : "Rejected.");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => decide(true)}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => decide(false)}>
        <X className="h-3.5 w-3.5" /> Reject
      </Button>
    </div>
  );
}
