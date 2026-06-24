"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 w-full shadow-sm"
      style={{ background: "var(--clr-surface)", borderBottom: "1px solid var(--clr-border)" }}
    >
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "var(--clr-primary)" }}
          >
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: "var(--clr-primary)" }}>
              EIP Traffic
            </p>
            <p className="text-xs leading-tight" style={{ color: "var(--clr-secondary)" }}>
              Traffic &amp; SEO Analytics
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: "var(--clr-border)", color: "var(--clr-secondary)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Live
          </div>

          <ThemeToggle />

          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--clr-primary)" }}
          >
            E
          </div>
        </div>
      </div>

      {/* Two-tone accent line */}
      <div className="flex h-0.5 w-full">
        <div className="flex-1" style={{ background: "#B22234" }} />
        <div className="flex-1" style={{ background: "var(--clr-primary)" }} />
      </div>
    </header>
  );
}
