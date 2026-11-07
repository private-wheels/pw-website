"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/account";
import { useAuth } from "@/context/auth-context";
import { SUPPORT_EMAIL } from "@/lib/email";
import type { Vehicle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CONFIRM_WORD = "DELETE";

/** Paid for, so the fee question applies. */
const UNPAID = new Set<Vehicle["status"]>(["pending_payment", "draft"]);

/**
 * "Delete account" for sellers, with a confirmation that spells out what goes:
 * listings (and how many are live), their identity verification, and that
 * paid fees aren't refunded automatically.
 */
export function DeleteAccountSection({ listings, verified }: { listings: Vehicle[]; verified: boolean }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const live = listings.filter((l) => l.status === "active").length;
  const paid = listings.some((l) => !UNPAID.has(l.status));

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAccount();
    if (!result.ok) {
      toast.error(result.error);
      setDeleting(false);
      return;
    }
    await logout().catch(() => {});
    toast.success("Your account has been deleted.");
    router.replace("/");
  }

  return (
    <section className="mt-16 rounded-2xl border border-destructive/30 p-5">
      <h2 className="font-semibold">Delete account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account, your listings and your identity verification.
      </p>
      <Button
        variant="outline"
        className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          setTyped("");
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" /> Delete my account
      </Button>

      <Dialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>This can&apos;t be undone. Here&apos;s what will happen:</DialogDescription>
          </DialogHeader>

          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            {listings.length > 0 ? (
              <li>
                <strong>
                  Your {listings.length === 1 ? "listing" : `${listings.length} listings`}
                  {live > 0 ? ` (${live} live)` : ""} will be removed
                </strong>
                , including photos. {live > 0 ? "Buyers won't be able to see or contact you about them anymore." : ""}
              </li>
            ) : null}
            {verified && (
              <li>
                <strong>Your identity verification will be removed.</strong> If you create a new account later,
                you&apos;ll need to verify again.
              </li>
            )}
            {paid && (
              <li>
                Listing fees you&apos;ve paid <strong>aren&apos;t refunded automatically</strong>. If you think
                you&apos;re due a refund, email{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">
                  {SUPPORT_EMAIL}
                </a>{" "}
                before deleting.
              </li>
            )}
            <li>Your account, profile and contact details are deleted straight away.</li>
            <li className="text-muted-foreground">
              We keep payment records for 5 years because tax law requires it, but they&apos;re no longer linked to
              you.
            </li>
          </ul>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={deleting}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting || typed.trim().toUpperCase() !== CONFIRM_WORD}
              onClick={() => void handleDelete()}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
