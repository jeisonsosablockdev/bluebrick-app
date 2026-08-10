export type NavigationOrigin = {
  x: number;
  y: number;
  timestamp: number;
};

let lastOrigin: NavigationOrigin | null = null;

export function setNavigationOrigin(origin: { x: number; y: number }): void {
  lastOrigin = {
    ...origin,
    timestamp: Date.now()
  };
}

export function getNavigationOrigin(maxAgeMs: number = 3000): NavigationOrigin | null {
  if (!lastOrigin) {
    return null;
  }

  const isFresh = Date.now() - lastOrigin.timestamp <= maxAgeMs;
  if (!isFresh) {
    lastOrigin = null;
    return null;
  }

  return lastOrigin;
}

export function clearNavigationOrigin(): void {
  lastOrigin = null;
}

export function recordNavigationOriginFromEvent(event: React.MouseEvent<HTMLElement> | MouseEvent): void {
  const target = event.currentTarget as HTMLElement | null;
  if (target && typeof target.getBoundingClientRect === "function") {
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setNavigationOrigin({ x: centerX, y: centerY });
    return;
  }

  setNavigationOrigin({ x: event.clientX, y: event.clientY });
}
