"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { RouteTransition } from "./route-transition";
import type { MotionDirection, RouteTransitionMode } from "./variants";

type PathRouteTransitionProps = {
  children: ReactNode;
  className?: string;
  direction?: MotionDirection;
  mode?: RouteTransitionMode;
};

export function PathRouteTransition({
  children,
  className,
  direction = "forward",
  mode = "page"
}: PathRouteTransitionProps) {
  const pathname = usePathname();

  return (
    <RouteTransition
      routeKey={pathname || "/"}
      className={className}
      direction={direction}
      mode={mode}
    >
      {children}
    </RouteTransition>
  );
}
