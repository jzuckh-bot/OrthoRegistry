"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeletePatientButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function remove() {
    if (!window.confirm("Delete this patient record? This action cannot be undone.")) return;
    setLoading(true);
    const { error } = await createClient().from("patients").delete().eq("id", id);
    setLoading(false);
    if (error) return window.alert(error.message);
    router.replace("/patients"); router.refresh();
  }
  return <Button variant="danger" onClick={remove} disabled={loading}><Trash2 className="size-4" />{loading ? "Deleting…" : "Delete"}</Button>;
}
