"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-sm transition-colors whitespace-nowrap",
        active
          ? "border-[#0f2f61] font-semibold text-[#0f2f61]"
          : "border-transparent font-medium text-[#5d6a80] hover:border-[#c5d0e6] hover:text-[#0f2f61]"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </Link>
  );
}
