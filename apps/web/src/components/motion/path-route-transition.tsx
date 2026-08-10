"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { RouteTransition } from "@/components/motion/route-transition";
import type { MotionDirection, RouteTransitionMode } from "@/lib/motion";

type PathRouteTransitionProps = {
  children: ReactNode;
  className?: string;
  direction?: MotionDirection;
  mode?: RouteTransitionMode;
};

export function PathRouteTransition({ children, className, direction = "forward", mode = "page" }: PathRouteTransitionProps) {
  const pathname = usePathname();

  return (
    <RouteTransition className={className} direction={direction} mode={mode} routeKey={pathname}>
      {children}
    </RouteTransition>
  );
}
