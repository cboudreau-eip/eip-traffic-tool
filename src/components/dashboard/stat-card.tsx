import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeLabel?: string;
  positive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  positive,
  icon: Icon,
  iconColor = "var(--md-on-primary-container)",
  iconBg = "var(--md-primary-container)",
}: StatCardProps) {
  return (
    <div
      className="md-elevation-1 rounded-xl"
      style={{ background: "var(--md-surface-container-low)" }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--clr-muted)" }}
            >
              {title}
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--clr-primary)" }}>
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-lg px-1.5 py-0.5 text-xs font-semibold",
                    positive
                      ? "bg-md-success-container text-md-on-success-container"
                      : "bg-md-error-container text-md-on-error-container"
                  )}
                >
                  {positive ? "↑" : "↓"} {change}
                </span>
                {changeLabel && (
                  <span className="text-xs" style={{ color: "var(--clr-muted)" }}>
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: iconBg }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </div>
  );
}
