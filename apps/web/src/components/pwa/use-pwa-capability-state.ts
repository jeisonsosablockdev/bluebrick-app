"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { resolvePwaCapabilitySnapshot, type PwaCapabilitySnapshot } from "@/lib/pwa/capabilities";

type BeforeInstallPromptChoice = "accepted" | "dismissed";

type BeforeInstallPromptChoiceResult = {
  outcome: BeforeInstallPromptChoice;
  platform: string;
};

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoiceResult>;
}

export interface PwaCapabilityState {
  installPromptOutcome: BeforeInstallPromptChoice | null;
  isPromptingInstall: boolean;
  promptInstall: () => Promise<BeforeInstallPromptChoice | null>;
  snapshot: PwaCapabilitySnapshot;
}

function buildInitialSnapshot(): PwaCapabilitySnapshot {
  return resolvePwaCapabilitySnapshot({
    userAgent: null,
    maxTouchPoints: 0,
    isStandalone: false,
    hasServiceWorker: false,
    hasPushManager: false,
    hasNotificationApi: false,
    notificationPermission: null,
    hasBeforeInstallPrompt: false
  });
}

function getStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const isDisplayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return isDisplayModeStandalone || navigatorWithStandalone.standalone === true;
}

export function usePwaCapabilityState(): PwaCapabilityState {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasBeforeInstallPrompt, setHasBeforeInstallPrompt] = useState(false);
  const [installPromptOutcome, setInstallPromptOutcome] = useState<BeforeInstallPromptChoice | null>(null);
  const [isPromptingInstall, setIsPromptingInstall] = useState(false);
  const [snapshot, setSnapshot] = useState<PwaCapabilitySnapshot>(() => buildInitialSnapshot());

  const syncSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    setSnapshot(
      resolvePwaCapabilitySnapshot({
        userAgent: window.navigator.userAgent,
        maxTouchPoints: window.navigator.maxTouchPoints,
        isStandalone: getStandaloneMode(),
        hasServiceWorker: "serviceWorker" in navigator,
        hasPushManager: "PushManager" in window,
        hasNotificationApi: "Notification" in window,
        notificationPermission: "Notification" in window ? window.Notification.permission : null,
        hasBeforeInstallPrompt: hasBeforeInstallPrompt || promptRef.current !== null
      })
    );
  }, [hasBeforeInstallPrompt]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    syncSnapshot();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      promptRef.current = event as BeforeInstallPromptEvent;
      setHasBeforeInstallPrompt(true);
      syncSnapshot();
    };

    const handleAppInstalled = () => {
      promptRef.current = null;
      setHasBeforeInstallPrompt(false);
      setInstallPromptOutcome("accepted");
      syncSnapshot();
    };

    const handleVisibilityChange = () => {
      syncSnapshot();
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      syncSnapshot();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, [syncSnapshot]);

  const promptInstall = async (): Promise<BeforeInstallPromptChoice | null> => {
    if (!promptRef.current) {
      return null;
    }

    setIsPromptingInstall(true);

    try {
      await promptRef.current.prompt();
      const choice = await promptRef.current.userChoice;
      setInstallPromptOutcome(choice.outcome);

      if (choice.outcome === "accepted") {
        promptRef.current = null;
        setHasBeforeInstallPrompt(false);
      }

      return choice.outcome;
    } finally {
      setIsPromptingInstall(false);
      syncSnapshot();
    }
  };

  return {
    installPromptOutcome,
    isPromptingInstall,
    promptInstall,
    snapshot
  };
}
