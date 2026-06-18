"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadedFile {
  name: string;
  size: number;
  status: UploadStatus;
  error?: string;
  id?: string;
}

const ACCEPTED = [".xlsx", ".xls", ".csv", ".xml", ".tsv"];

export function DropZone() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const processFiles = useCallback(
    async (incoming: File[]) => {
      const valid = incoming.filter((f) => {
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        return ACCEPTED.includes(ext);
      });

      const newEntries: UploadedFile[] = valid.map((f) => ({
        name: f.name,
        size: f.size,
        status: "uploading",
      }));

      setFiles((prev) => [...prev, ...newEntries]);

      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const idx = files.length + i;

        try {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: form });
          const json = await res.json();

          setFiles((prev) =>
            prev.map((f, j) =>
              j === idx
                ? { ...f, status: res.ok ? "success" : "error", error: json.error, id: json.id }
                : f
            )
          );
        } catch {
          setFiles((prev) =>
            prev.map((f, j) => (j === idx ? { ...f, status: "error", error: "Upload failed" } : f))
          );
        }
      }

      router.refresh();
    },
    [files.length, router]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(Array.from(e.target.files));
    },
    [processFiles]
  );

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors",
          dragging
            ? "border-orange-400 bg-orange-50"
            : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Upload className="h-6 w-6 text-orange-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Drop files here or click to upload</p>
          <p className="mt-1 text-xs text-gray-500">
            Supports GSC exports, GA4 exports, sitemaps, and spreadsheets
          </p>
          <p className="mt-1 text-xs text-gray-400">{ACCEPTED.join(", ")}</p>
        </div>
        <Button size="sm" variant="outline">Browse files</Button>
        <input
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={onInputChange}
        />
      </label>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              {f.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
              {f.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {f.status === "error" && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{f.error}</span>
                </div>
              )}
              <button
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
