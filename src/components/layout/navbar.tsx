"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">EIP Traffic</span>
        </Link>
      </div>
    </header>
  );
}
