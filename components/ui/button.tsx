"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  const base = "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all";

  const variants = {
    primary: "bg-gradientPrimary text-white shadow-glow hover:opacity-95",
    ghost: "bg-white/5 text-white hover:bg-white/10",
    outline: "border border-white/25 text-white hover:bg-white/10"
  };

  return (
    <motion.button
      className={cn(base, variants[variant], className)}
      type={type}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={MOTION_FAST_OPACITY_TRANSITION}
      {...props}
    />
  );
}
