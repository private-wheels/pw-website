"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthError, setPassword } from "@/lib/store/auth";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Where a password reset link lands. The link has already signed them in
 * (via /auth/confirm), so they just choose a new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await setPassword(password);
      toast.success("Password changed. You're signed in.");
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No session: the link expired, was already used, or was opened elsewhere.
  if (!user || user.isAnonymous) {
    return (
      <AuthSplitLayout
        title="This link has expired"
        subtitle="Password reset links work once, for a limited time"
        footer={
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Ask for a new link and use it straight away.</p>
          <Button
            size="lg"
            className="rounded-full bg-primary hover:bg-primary/90"
            render={<Link href="/login/forgot-password">Send a new link</Link>}
          />
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Choose a new password"
      subtitle={`For ${user.email}`}
      footer={
        <Link href="/dashboard" className="font-semibold text-primary hover:underline">
          Skip for now
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={busy} className="mt-2 rounded-full bg-primary hover:bg-primary/90">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Save new password
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
