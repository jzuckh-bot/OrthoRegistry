"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return <Button variant="ghost" onClick={async () => { await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }}><LogOut className="size-4" />Sign out</Button>;
}
