"use client";

import type { MouseEvent as ReactMouseEvent } from "react";

export type NavigationOrigin = {
  x: number;
  y: number;
};

const MAIN_NAVIGATION_HREFS = new Set(["/", "/marketplace", "/protected", "/admin"]);

let navigationOrigin: NavigationOrigin | null = null;

function isPrimaryNavigationHref(href: string): boolean {
  return MAIN_NAVIGATION_HREFS.has(href);
}

export function getNavigationOrigin(): NavigationOrigin | null {
  return navigationOrigin;
}

export function clearNavigationOrigin(): void {
  navigationOrigin = null;
}

export function recordNavigationOriginFromClick(event: ReactMouseEvent<HTMLElement>, href: string): void {
  if (!isPrimaryNavigationHref(href)) {
    return;
  }

  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();

  navigationOrigin = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
