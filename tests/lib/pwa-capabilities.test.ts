import { describe, expect, it } from "vitest";

import { detectPwaPlatform, resolvePwaCapabilitySnapshot } from "@/lib/pwa/capabilities";

describe("lib/pwa/capabilities", () => {
  it("detects iOS devices including iPadOS desktop-mode user agents", () => {
    expect(detectPwaPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)", 5)).toBe("ios");
    expect(detectPwaPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe("ios");
  });

  it("keeps iOS browser tabs in manual-install mode before push enrollment", () => {
    const snapshot = resolvePwaCapabilitySnapshot({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)",
      maxTouchPoints: 5,
      isStandalone: false,
      hasServiceWorker: true,
      hasPushManager: true,
      hasNotificationApi: true,
      notificationPermission: "default",
      hasBeforeInstallPrompt: false
    });

    expect(snapshot.installabilityState).toBe("manual-ios");
    expect(snapshot.notificationState).toBe("needs-install");
  });

  it("marks supported desktop browsers as prompt-ready when install prompt is available", () => {
    const snapshot = resolvePwaCapabilitySnapshot({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      maxTouchPoints: 0,
      isStandalone: false,
      hasServiceWorker: true,
      hasPushManager: true,
      hasNotificationApi: true,
      notificationPermission: "granted",
      hasBeforeInstallPrompt: true
    });

    expect(snapshot.installabilityState).toBe("prompt-ready");
    expect(snapshot.notificationState).toBe("ready");
  });

  it("fails closed when notifications are blocked", () => {
    const snapshot = resolvePwaCapabilitySnapshot({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      maxTouchPoints: 0,
      isStandalone: false,
      hasServiceWorker: true,
      hasPushManager: true,
      hasNotificationApi: true,
      notificationPermission: "denied",
      hasBeforeInstallPrompt: false
    });

    expect(snapshot.notificationState).toBe("blocked");
    expect(snapshot.installabilityState).toBe("criteria-pending");
  });
});
