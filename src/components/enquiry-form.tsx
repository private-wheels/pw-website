"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { sendEnquiry } from "@/app/actions/enquiry";
import type { Vehicle } from "@/lib/types";
import { CaptchaError, useTurnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIELD = "h-11 focus-visible:border-ring focus-visible:ring-0";

/**
 * The "Enquire Now" form on a listing page. Emails the seller (who replies
 * to the buyer directly) and sends the buyer a copy.
 */
export function EnquiryForm({ listing, onSent }: { listing: Vehicle; onSent: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(`Hi, is the ${listing.year} ${listing.make} ${listing.model} still available?`);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const captcha = useTurnstile("enquiry");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const captchaToken = await captcha.getToken();
      const result = await sendEnquiry({ listingId: listing.id, name, email, phone, message, captchaToken, website });
      if (result.ok) {
        onSent();
        return;
      }
      setError(result.error);
      captcha.reset();
    } catch (err) {
      setError(err instanceof CaptchaError ? err.message : "We couldn't send your message. Please try again.");
    }
    setSending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-name">Your Name</Label>
        <Input id="enquiry-name" required autoComplete="name" placeholder="Jane Doe" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-email">Email</Label>
        <Input id="enquiry-email" type="email" required autoComplete="email" placeholder="you@example.com" className={FIELD} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-phone">
          Phone <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="enquiry-phone" type="tel" autoComplete="tel" placeholder="082 123 4567" className={FIELD} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-message">Message</Label>
        <Textarea id="enquiry-message" required className="focus-visible:border-ring focus-visible:ring-0" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {captcha.widget}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={sending} className="h-12 w-full rounded-full bg-primary hover:bg-primary/90">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send Enquiry
      </Button>
      <p className="text-xs text-muted-foreground">
        We&apos;ll email your message to the seller, who&apos;ll reply to you directly. You&apos;ll get a copy too.
      </p>
    </form>
  );
}
