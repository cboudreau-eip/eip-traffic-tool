"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children?: React.ReactNode;
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
      {children}
      {label}
    </Link>
  );
}
