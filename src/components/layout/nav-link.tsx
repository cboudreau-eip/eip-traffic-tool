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
        "flex items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-xs transition-colors whitespace-nowrap",
        active
          ? "border-[var(--clr-primary)] font-semibold"
          : "border-transparent font-medium hover:border-[var(--clr-border)]"
      )}
      style={{
        color: active ? "var(--clr-primary)" : "var(--clr-secondary)",
      }}
    >
      {children}
      {label}
    </Link>
  );
}
