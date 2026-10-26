"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Undo2 } from "lucide-react";
import { refundPaymentAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Refund one payment in full, outside of rejecting its listing. */
export function RefundButton({ paymentId, amount }: { paymentId: string; amount: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Undo2 className="h-3.5 w-3.5" /> Refund
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refund {amount}?</DialogTitle>
            <DialogDescription>
              Refunds the full amount through Paystack. It can&apos;t be undone. The listing itself isn&apos;t
              changed. To take it down as well, reject it from its review page instead.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason, e.g. Charged twice / Seller cancelled before launch"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending || !note.trim()}
              onClick={() =>
                startTransition(async () => {
                  const result = await refundPaymentAction(paymentId, note);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Refund started. It usually lands within 5–10 working days.");
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Refund {amount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
