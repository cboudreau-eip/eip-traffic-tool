"use client";

import Link from "next/link";
import { Globe } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "#0f2f61" }}
          >
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: "#0f2f61" }}>
              EIP Traffic
            </p>
            <p className="text-xs leading-tight" style={{ color: "#5d6a80" }}>
              Traffic & SEO Analytics
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: "#e8edf5", color: "#5d6a80" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Live
          </div>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "#0f2f61" }}
          >
            E
          </div>
        </div>
      </div>

      {/* Two-tone accent line */}
      <div className="flex h-0.5 w-full">
        <div className="flex-1" style={{ background: "#B22234" }} />
        <div className="flex-1" style={{ background: "#0f2f61" }} />
      </div>
    </header>
  );
}
