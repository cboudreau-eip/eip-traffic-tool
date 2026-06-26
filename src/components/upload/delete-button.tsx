"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteUploadButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this upload and all its data?")) return;
    await fetch("/api/uploads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="ml-1 rounded p-1 text-md-outline hover:bg-md-error-container hover:text-md-error transition-colors"
      title="Delete upload"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
