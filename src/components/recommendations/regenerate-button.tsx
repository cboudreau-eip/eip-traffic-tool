"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RegenerateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    router.refresh();
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing…" : "Regenerate"}
    </Button>
  );
}
