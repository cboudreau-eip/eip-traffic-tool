import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Material 3 chip/label styling — tonal container + on-container color pairs.
const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium tracking-[0.045em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-md-primary-container text-md-on-primary-container",
        secondary: "bg-md-secondary-container text-md-on-secondary-container",
        destructive: "bg-md-error-container text-md-on-error-container",
        success: "bg-md-success-container text-md-on-success-container",
        outline: "border border-md-outline-variant text-md-on-surface-variant",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
