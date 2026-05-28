import type { ReactNode } from "react";

import { PathRouteTransition } from "@/components/motion/path-route-transition";

type MarketplaceLayoutProps = {
  children: ReactNode;
};

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return <PathRouteTransition mode="navigation-origin">{children}</PathRouteTransition>;
}
