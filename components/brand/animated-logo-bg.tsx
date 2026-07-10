"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedLogoBgProps {
  className?: string;
  pathLength: MotionValue<number>;
}

export function AnimatedLogoBg({ className, pathLength }: AnimatedLogoBgProps) {
  return (
    <div className={cn("pointer-events-none select-none", className)}>
      <svg
        viewBox="-2 -5 24 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="brids-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00b0f9" />
            <stop offset="50%" stopColor="#37a4f9" />
            <stop offset="100%" stopColor="#cf84f9" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 2 21 L 2 4 L 10.5 -0.9 L 10.5 21.1 L 2 26 L 10.5 30.9 L 19 26 L 19 14 L 14.75 11.55"
          stroke="url(#brids-gradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ pathLength }}
        />
      </svg>
    </div>
  );
}
