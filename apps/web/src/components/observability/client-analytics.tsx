"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type AnalyticsPayload = {
  eventType: "page_view" | "route_change" | "scroll_depth" | "cta_click" | "client_error";
  path?: string;
  fromPath?: string;
  scrollDepth?: number;
  ctaId?: string;
  ctaLabel?: string;
  message?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  occurredAt?: string;
};

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

function getCurrentPath(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

function sanitizeLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 96);
}

function sendAnalytics(payload: AnalyticsPayload): void {
  try {
    const body = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/analytics/events", blob);
      if (sent) {
        return;
      }
    }

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body,
      keepalive: true,
      cache: "no-store"
    }).catch(() => undefined);
  } catch {
    // Never block UI interaction if telemetry fails.
  }
}

export function ClientAnalytics(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);
  const sentScrollThresholdsRef = useRef<Set<number>>(new Set());

  const search = searchParams.toString();
  const currentPath = getCurrentPath(pathname, search);

  useEffect(() => {
    const nowIso = new Date().toISOString();

    sendAnalytics({
      eventType: "page_view",
      path: currentPath,
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
      viewportHeight: typeof window !== "undefined" ? window.innerHeight : undefined,
      occurredAt: nowIso
    });

    if (previousPathRef.current && previousPathRef.current !== currentPath) {
      sendAnalytics({
        eventType: "route_change",
        path: currentPath,
        fromPath: previousPathRef.current,
        viewportWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
        viewportHeight: typeof window !== "undefined" ? window.innerHeight : undefined,
        occurredAt: nowIso
      });
    }

    previousPathRef.current = currentPath;
    sentScrollThresholdsRef.current = new Set();
  }, [currentPath]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScroll = () => {
      const documentElement = document.documentElement;
      const maxScrollable = documentElement.scrollHeight - window.innerHeight;
      if (maxScrollable <= 0) {
        return;
      }

      const depth = Math.round((window.scrollY / maxScrollable) * 100);
      for (const threshold of SCROLL_THRESHOLDS) {
        if (depth >= threshold && !sentScrollThresholdsRef.current.has(threshold)) {
          sentScrollThresholdsRef.current.add(threshold);
          sendAnalytics({
            eventType: "scroll_depth",
            path: currentPath,
            scrollDepth: threshold,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            occurredAt: new Date().toISOString()
          });
        }
      }
    };

    const throttled = () => {
      window.requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", throttled, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttled);
    };
  }, [currentPath]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const node = event.target;
      if (!(node instanceof Element)) {
        return;
      }

      const clickable = node.closest<HTMLElement>("[data-analytics-cta],a,button");
      if (!clickable) {
        return;
      }

      const rawLabel = clickable.getAttribute("data-analytics-cta")
        || clickable.getAttribute("aria-label")
        || clickable.textContent
        || clickable.getAttribute("href")
        || clickable.id;

      const ctaLabel = sanitizeLabel(rawLabel || "cta");
      if (!ctaLabel) {
        return;
      }

      sendAnalytics({
        eventType: "cta_click",
        path: currentPath,
        ctaId: clickable.id || undefined,
        ctaLabel,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        occurredAt: new Date().toISOString()
      });
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [currentPath]);

  return null;
}
