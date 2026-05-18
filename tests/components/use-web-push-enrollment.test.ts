// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PwaCapabilitySnapshot } from "@/lib/pwa/capabilities";
import { useWebPushEnrollment } from "@/components/pwa/use-web-push-enrollment";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

const readySnapshot: PwaCapabilitySnapshot = {
  platform: "android",
  isStandalone: true,
  supportsPush: true,
  installPromptAvailable: false,
  installabilityState: "standalone",
  notificationState: "ready",
  notificationPermission: "default"
};

function EnrollmentHarness({
  snapshot = readySnapshot
}: {
  snapshot?: PwaCapabilitySnapshot;
}) {
  const state = useWebPushEnrollment({
    audience: "wallet-profile",
    snapshot,
    t: (text) => text.es
  });

  return createElement(
    "div",
    null,
    createElement(
      "button",
      {
        onClick: () => void state.enableNotifications(),
        type: "button"
      },
      "enable"
    ),
    createElement(
      "button",
      {
        onClick: () => void state.disableNotifications(),
        type: "button"
      },
      "disable"
    ),
    createElement("span", { "data-testid": "status" }, state.statusMessage ?? ""),
    createElement("span", { "data-testid": "error" }, state.errorMessage ?? ""),
    createElement("span", { "data-testid": "count" }, String(state.subscriptionCount)),
    createElement("span", { "data-testid": "current" }, String(state.hasCurrentSubscription))
  );
}

function renderHarness(snapshot?: PwaCapabilitySnapshot): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(EnrollmentHarness, { snapshot }));
  });

  return { container, root };
}

describe("components/pwa/use-web-push-enrollment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const subscription = {
      endpoint: "https://push.example.com/subscriptions/abc",
      toJSON: () => ({
        endpoint: "https://push.example.com/subscriptions/abc",
        keys: {
          p256dh: "p256dh_abc",
          auth: "auth_abc"
        }
      }),
      unsubscribe: vi.fn().mockResolvedValue(true)
    };

    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue(subscription)
    };

    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("granted")
      }
    });

    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {}
    });

    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager
        }),
        register: vi.fn().mockResolvedValue({
          pushManager
        }),
        ready: Promise.resolve({
          pushManager
        })
      }
    });

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "/api/notifications/subscriptions/bootstrap") {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              vapidPublicKey: "BEl6P4M5x7s8z9q0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4",
              items: []
            }
          }),
          { status: 200 }
        );
      }

      if (url === "/api/notifications/subscriptions" && init?.method === "POST") {
        return new Response(JSON.stringify({ ok: true, data: { id: "sub_123" } }), { status: 201 });
      }

      if (url === "/api/notifications/subscriptions" && init?.method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: false, error: { message: "Unhandled test request." } }), { status: 500 });
    }) as typeof fetch;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("requests permission, subscribes, and persists the current device enrollment", async () => {
    const { container, root } = renderHarness();
    const enableButton = container.querySelector("button");

    await act(async () => {
      enableButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notifications/subscriptions",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(container.querySelector('[data-testid="current"]')?.textContent).toBe("true");
    expect(container.querySelector('[data-testid="status"]')?.textContent).toContain("inscrito");

    act(() => {
      root.unmount();
    });
  });

  it("revokes and unsubscribes the current device enrollment", async () => {
    const subscription = {
      endpoint: "https://push.example.com/subscriptions/abc",
      toJSON: () => ({
        endpoint: "https://push.example.com/subscriptions/abc",
        keys: {
          p256dh: "p256dh_abc",
          auth: "auth_abc"
        }
      }),
      unsubscribe: vi.fn().mockResolvedValue(true)
    };
    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(subscription),
      subscribe: vi.fn().mockResolvedValue(subscription)
    };

    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager
        }),
        register: vi.fn().mockResolvedValue({
          pushManager
        }),
        ready: Promise.resolve({
          pushManager
        })
      }
    });
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "/api/notifications/subscriptions/bootstrap") {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              vapidPublicKey: "BEl6P4M5x7s8z9q0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4",
              items: [
                {
                  endpoint: subscription.endpoint,
                  status: "active"
                }
              ]
            }
          }),
          { status: 200 }
        );
      }

      if (url === "/api/notifications/subscriptions" && init?.method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const { container, root } = renderHarness({
      ...readySnapshot,
      notificationPermission: "granted"
    });
    const disableButton = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "disable");

    await act(async () => {
      disableButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/notifications/subscriptions",
      expect.objectContaining({
        method: "DELETE"
      })
    );
    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
