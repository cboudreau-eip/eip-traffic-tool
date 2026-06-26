"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewProjectButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, description }),
      });
      const project = await res.json();
      setOpen(false);
      setName(""); setUrl(""); setDescription("");
      router.push(`/projects/${project.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className={cn(className)}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-md-surface-container-low p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-md-on-surface">New Project</h2>
              <button onClick={() => setOpen(false)} className="text-md-outline hover:text-md-on-surface-variant">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-md-on-surface-variant">
                  Project Name <span className="text-md-error">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elite Insurance Partners"
                  required
                  className="w-full rounded-md border border-md-outline-variant px-3 py-2 text-sm outline-none focus:border-md-primary focus:ring-2 focus:ring-md-primary-container"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-md-on-surface-variant">Website URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-md border border-md-outline-variant px-3 py-2 text-sm outline-none focus:border-md-primary focus:ring-2 focus:ring-md-primary-container"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-md-on-surface-variant">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about this project"
                  rows={2}
                  className="w-full rounded-md border border-md-outline-variant px-3 py-2 text-sm outline-none focus:border-md-primary focus:ring-2 focus:ring-md-primary-container resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim()}>
                  {loading ? "Creating…" : "Create Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
