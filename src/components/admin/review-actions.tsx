"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import { approveListing, rejectListing, requestChanges } from "@/app/actions/admin";
import type { RefundAdvice } from "@/lib/refund-policy";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Mode = "changes" | "reject" | null;

export function ReviewActions({
  listingId,
  status,
  advice,
}: {
  listingId: string;
  status: string;
  advice: RefundAdvice;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>(null);
  const [note, setNote] = useState("");
  const [refund, setRefund] = useState(advice.refund);

  const canApprove = status === "pending_review" || status === "changes_requested";
  const canRequestChanges = ["pending_review", "active", "paused"].includes(status);
  const canReject = status !== "rejected";
  const isLive = ["active", "paused", "sold"].includes(status);

  function run(action: () => Promise<{ ok: true; warning?: string } | { ok: false; error: string }>, done: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      else toast.success(done);
      setMode(null);
      setNote("");
      router.refresh();
    });
  }

  if (!canApprove && !canRequestChanges && !canReject) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canApprove && (
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          disabled={pending}
          onClick={() => run(() => approveListing(listingId), "Approved. The seller has been emailed.")}
        >
          {pending && mode === null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Approve
        </Button>
      )}
      {canRequestChanges && (
        <Button variant="outline" disabled={pending} onClick={() => setMode("changes")}>
          <MessageSquareWarning className="h-4 w-4" />
          Request changes
        </Button>
      )}
      {canReject && (
        <Button
          variant="outline"
          className="text-destructive"
          disabled={pending}
          onClick={() => {
            setRefund(advice.refund);
            setMode("reject");
          }}
        >
          <XCircle className="h-4 w-4" />
          {isLive ? "Take down" : "Reject"}
        </Button>
      )}

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "changes" ? "Request changes" : isLive ? "Take down listing" : "Reject listing"}</DialogTitle>
            <DialogDescription>
              {mode === "changes"
                ? "The listing goes back to the seller with your note. They fix it and resubmit — no extra charge."
                : "The listing is hidden for good and the seller is emailed your reason."}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder={
              mode === "changes"
                ? "e.g. Please add a clear photo of the front of the car and the odometer."
                : "e.g. We couldn't verify that you own this vehicle."
            }
          />
          <p className="-mt-2 text-xs text-muted-foreground">The seller sees this exactly as written.</p>

          {mode === "reject" && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <label className="flex items-start gap-2.5">
                <Checkbox checked={refund} onCheckedChange={(checked) => setRefund(checked === true)} className="mt-0.5" />
                <span className="text-sm font-medium">Refund the listing fee in full</span>
              </label>
              <p className="mt-1.5 pl-6.5 text-xs text-muted-foreground">
                Suggested: <strong>{advice.refund ? "refund" : "no refund"}</strong>. {advice.why}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={mode === "reject" ? "destructive" : "default"}
              disabled={pending || !note.trim()}
              onClick={() =>
                mode === "changes"
                  ? run(() => requestChanges(listingId, note), "Changes requested. The seller has been emailed.")
                  : run(
                      () => rejectListing(listingId, note, refund),
                      refund ? "Rejected and refunded. The seller has been emailed." : "Rejected. The seller has been emailed.",
                    )
              }
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "changes" ? "Send to seller" : refund ? "Reject and refund" : isLive ? "Take down" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
