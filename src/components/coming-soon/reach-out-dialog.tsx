"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * "Want us to reach out instead?" — a small name + mobile form in a dialog,
 * for visitors who'd rather be contacted than start a WhatsApp chat. Posts to
 * `/api/lead`. Marketing consent is a separate, optional opt-in (POPIA s69).
 */
export function ReachOutDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setMobile("");
    setMarketingConsent(false);
    setCompany("");
    setStatus("idle");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, mobile, marketingConsent, company }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) window.setTimeout(resetForm, 150);
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Fill out our form
          </button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        {status === "done" ? (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Thanks for signing up!</DialogTitle>
              <DialogDescription>
                We&apos;ll reach out with your voucher soon.
              </DialogDescription>
            </DialogHeader>
            <DialogClose
              render={
                <Button className="h-12 rounded-full bg-primary hover:bg-primary/90" />
              }
            >
              Done
            </DialogClose>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Want us to reach out?</DialogTitle>
              <DialogDescription>
                Leave your details and we&apos;ll get in touch directly when listings
                open.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reach-name">Name</Label>
                <Input
                  id="reach-name"
                  name="name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 focus-visible:border-ring focus-visible:ring-0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reach-mobile">Mobile number</Label>
                <Input
                  id="reach-mobile"
                  name="mobile"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  placeholder="081 234 5678"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-11 focus-visible:border-ring focus-visible:ring-0"
                />
              </div>

              <label className="flex items-start gap-2.5 text-sm leading-snug">
                <Checkbox
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked)}
                  className="mt-0.5"
                />
                <span>Send me launch updates and offers from Private Wheels (optional)</span>
              </label>

              {/* Honeypot — visually hidden, ignored by real users. */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={status === "sending"}
                className="h-12 rounded-full bg-primary hover:bg-primary/90"
              >
                {status === "sending" ? "Sending…" : "Request a callback"}
              </Button>

              <p className="text-xs leading-relaxed text-muted-foreground">
                We&apos;ll only use your details to get in touch about your request, and
                won&apos;t sell them to anyone. See our{" "}
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
