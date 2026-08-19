"use client";

import { useEffect } from "react";

import { isPwaInstallabilityEnabled } from "@/lib/notifications/rollout";

export function PwaClientRuntime() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !isPwaInstallabilityEnabled()) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });
  }, []);

  return null;
}
