"use client";

import { useEffect, useState } from "react";
import {
  APP_SPLASH_FADE_OUT_MS,
  getAppSplashExitDelay,
  hasSeenSplashInSession,
  markSplashSeenInSession,
  shouldWaitForAppLoad
} from "../domain/splash-state-rules";

export type SplashStatus = "mounting" | "visible" | "fading" | "dismissed";

export function useSplashScreen() {
  const [status, setStatus] = useState<SplashStatus>("mounting");

  useEffect(() => {
    if (hasSeenSplashInSession()) {
      setStatus("dismissed");
      return;
    }

    setStatus("visible");
    const startTime = Date.now();

    const checkAndScheduleExit = () => {
      if (shouldWaitForAppLoad(document.readyState)) {
        window.addEventListener("load", checkAndScheduleExit, { once: true });
        return;
      }

      const elapsed = Date.now() - startTime;
      const remainingDelay = getAppSplashExitDelay(elapsed);

      const fadeTimer = setTimeout(() => {
        setStatus("fading");
        markSplashSeenInSession();

        const dismissTimer = setTimeout(() => {
          setStatus("dismissed");
        }, APP_SPLASH_FADE_OUT_MS);

        return () => clearTimeout(dismissTimer);
      }, remainingDelay);

      return () => clearTimeout(fadeTimer);
    };

    const cleanup = checkAndScheduleExit();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return {
    status,
    isVisible: status === "visible" || status === "fading",
    isFading: status === "fading",
    isDismissed: status === "dismissed"
  };
}
