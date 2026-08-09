"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.replace("/dashboard"); router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="surface w-full max-w-md p-6 sm:p-10">
        <span className="mb-6 grid size-24 place-items-center overflow-hidden rounded-2xl border bg-white shadow-sm"><Image src="/orthoregistry-logo.png" alt="OrthoRegistry shoulder logo with SM VGHTPE text" width={1254} height={1254} className="size-full object-contain" priority /></span>
        <p className="text-sm font-semibold text-primary">ORTHOPEDIC REGISTRY</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Sign in to securely access patient records.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">Email<Input className="mt-2" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="block text-sm font-medium">Password<Input className="mt-2" type="password" autoComplete="current-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></label>
          {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
          <Button className="h-11 w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
        </form>
        <div className="mt-5 text-center">
          <Link href="/forgot-password" className="text-sm font-semibold text-primary transition hover:brightness-110">
            Forgot password?
          </Link>
        </div>
      </section>
    </main>
  );
}
