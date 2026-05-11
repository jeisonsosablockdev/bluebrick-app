"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  APP_SPLASH_FADE_OUT_MS,
  getAppSplashExitDelay,
  shouldWaitForAppLoad
} from "@/lib/app-splash";

type SplashPhase = "visible" | "exiting" | "hidden";

function waitForWindowLoad(): Promise<void> {
  if (!shouldWaitForAppLoad(document.readyState)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener("load", () => resolve(), { once: true });
  });
}

export function AppSplashScreen() {
  const [phase, setPhase] = useState<SplashPhase>("visible");

  useEffect(() => {
    let isMounted = true;
    const startedAt = performance.now();

    async function finishSplash() {
      await waitForWindowLoad();

      const remainingMs = getAppSplashExitDelay(performance.now() - startedAt);
      window.setTimeout(() => {
        if (!isMounted) {
          return;
        }

        setPhase("exiting");
        window.setTimeout(() => {
          if (isMounted) {
            setPhase("hidden");
          }
        }, APP_SPLASH_FADE_OUT_MS);
      }, remainingMs);
    }

    void finishSplash();

    return () => {
      isMounted = false;
    };
  }, []);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div className={`app-splash app-splash--${phase}`} aria-label="BRIDS loading screen" role="status">
      <div className="app-splash__halo" aria-hidden="true" />
      <div className="app-splash__content">
        <p className="app-splash__name">BRIDS</p>
        <div className="app-splash__mark-wrap" aria-hidden="true">
          <Image
            className="app-splash__mark"
            src="/brand/brids-mark.svg"
            alt=""
            width={76}
            height={130}
            priority
          />
        </div>
      </div>
    </div>
  );
}
