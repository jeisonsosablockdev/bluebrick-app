/**
 * @file apps/web/src/components/ui/button.tsx
 * @description Layer 1: Presentation - Reusable Atomic Button Component.
 * Supports primary, secondary, and ghost visual variants with focus/hover transitions.
 */

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Props supported by the Button component.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual appearance variant */
  variant?: "primary" | "secondary" | "ghost" | "outline";
  /** Size dimension modifier */
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable UI button component with standard accessible styling.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    // Step 1: Compute base classes
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    // Step 2: Resolve variant classes
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
      secondary: "bg-gray-800 text-gray-100 hover:bg-gray-700 focus-visible:ring-gray-600",
      ghost: "hover:bg-gray-800/50 text-gray-300 hover:text-white",
      outline: "border border-gray-700 hover:bg-gray-800 text-gray-200",
    }[variant];

    // Step 3: Resolve size classes
    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
