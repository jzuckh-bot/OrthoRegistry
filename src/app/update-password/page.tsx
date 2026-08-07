"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function establishRecoverySession() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && active) {
          setError("This recovery link is invalid or has expired. Request a new link.");
          setReady(true);
          return;
        }
        window.history.replaceState({}, "", "/update-password");
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) setError("This recovery link is invalid or has expired. Request a new link.");
      setReady(true);
    }

    void establishRecoverySession();
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must contain at least 8 characters.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    setUpdated(true);
  }

  if (!ready) {
    return <main className="grid min-h-screen place-items-center p-4"><p className="text-sm text-muted">Validating recovery link…</p></main>;
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="surface w-full max-w-md p-6 sm:p-10">
        <span className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary text-white">
          {updated ? <CheckCircle2 /> : <KeyRound />}
        </span>
        {updated ? (
          <>
            <p className="text-sm font-semibold text-primary">PASSWORD UPDATED</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">You’re all set</h1>
            <p className="mt-3 text-sm leading-6 text-muted">Your new password is active. Continue to your registry dashboard.</p>
            <Button className="mt-8 h-11 w-full" onClick={() => { router.replace("/dashboard"); router.refresh(); }}>
              Continue to dashboard
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary">ACCOUNT RECOVERY</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Choose a new password</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Use at least 8 characters for your new password.</p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="block text-sm font-medium">
                New password
                <Input className="mt-2" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Confirm new password
                <Input className="mt-2" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
              </label>
              {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
              <Button className="h-11 w-full" disabled={loading || Boolean(error && !password)}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
