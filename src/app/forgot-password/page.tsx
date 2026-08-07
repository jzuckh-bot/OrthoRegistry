"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "http://localhost:3000/update-password",
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="surface w-full max-w-md p-6 sm:p-10">
        <span className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary text-white">
          {sent ? <MailCheck /> : <KeyRound />}
        </span>
        {sent ? (
          <>
            <p className="text-sm font-semibold text-primary">CHECK YOUR EMAIL</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Recovery link sent</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              If an account exists for <span className="font-semibold text-foreground">{email}</span>, a password recovery link is on its way.
            </p>
            <Button type="button" variant="secondary" className="mt-8 h-11 w-full" onClick={() => setSent(false)}>
              Send another link
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary">ACCOUNT RECOVERY</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Reset your password</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Enter the email associated with your OrthoRegistry account.</p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="block text-sm font-medium">
                Email
                <Input className="mt-2" type="email" autoComplete="email" required autoFocus value={email} onChange={event => setEmail(event.target.value)} />
              </label>
              {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
              <Button className="h-11 w-full" disabled={loading}>{loading ? "Sending…" : "Send recovery link"}</Button>
            </form>
          </>
        )}
        <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted transition hover:text-foreground">
          <ArrowLeft className="size-4" />Back to sign in
        </Link>
      </section>
    </main>
  );
}
