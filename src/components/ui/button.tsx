import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Material 3 buttons: pill-shaped, label-large type, state-layer hover, tonal elevation.
const buttonVariants = cva(
  "md-state-primary inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-[0.0089em] transition-[box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 focus-visible:ring-offset-md-surface disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Filled — high emphasis
        default: "bg-md-primary text-md-on-primary hover:shadow-md",
        // Filled tonal
        secondary: "bg-md-secondary-container text-md-on-secondary-container hover:shadow-md",
        // Error / destructive
        destructive: "bg-md-error text-md-on-error hover:shadow-md",
        // Outlined
        outline: "border border-md-outline-variant bg-transparent text-md-primary",
        // Text
        ghost: "bg-transparent text-md-primary",
        link: "bg-transparent text-md-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
