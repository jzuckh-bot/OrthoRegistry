"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeleteSurgeryButton({ id, patientId }: { id: string; patientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function remove() {
    if (!window.confirm("Delete this surgery record? This cannot be undone.")) return;
    setLoading(true);
    const { error } = await createClient().from("surgeries").delete().eq("id", id);
    setLoading(false);
    if (error) return window.alert(error.message);
    router.replace(`/patients/${patientId}`);
    router.refresh();
  }
  return <Button variant="danger" className="h-11" onClick={remove} disabled={loading}><Trash2 className="size-4" />{loading ? "Deleting…" : "Delete"}</Button>;
}
