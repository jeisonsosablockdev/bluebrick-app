"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { RouteTransition } from "@/components/motion/route-transition";
import type { MotionDirection } from "@/lib/motion";

type PathRouteTransitionProps = {
  children: ReactNode;
  className?: string;
  direction?: MotionDirection;
};

export function PathRouteTransition({ children, className, direction = "forward" }: PathRouteTransitionProps) {
  const pathname = usePathname();

  return (
    <RouteTransition className={className} direction={direction} routeKey={pathname}>
      {children}
    </RouteTransition>
  );
}
