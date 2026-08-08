"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DeletePatientButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function remove() {
    const confirmed = window.confirm(
      "Permanently delete this patient and all linked surgery records? This action cannot be undone.",
    );
    if (!confirmed) return;

    const confirmedAgain = window.confirm(
      "Second confirmation: permanently delete this patient and all linked surgery records?",
    );
    if (!confirmedAgain) return;

    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error: surgeryError } = await supabase
      .from("surgeries")
      .delete()
      .eq("patient_id", id);

    if (surgeryError) {
      setLoading(false);
      setErrorMessage(`Patient was not deleted because linked surgery deletion failed: ${surgeryError.message}`);
      return;
    }

    const { error: patientError } = await supabase.from("patients").delete().eq("id", id);
    setLoading(false);

    if (patientError) {
      setErrorMessage(`Linked surgeries were deleted, but the patient could not be deleted: ${patientError.message}`);
      return;
    }

    window.alert("Patient and all linked surgery records were permanently deleted.");
    router.replace("/patients");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="danger" onClick={remove} disabled={loading}>
        <Trash2 className="size-4" />
        {loading ? "Deleting…" : "Delete"}
      </Button>
      {errorMessage && (
        <p role="alert" className="max-w-sm text-right text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
