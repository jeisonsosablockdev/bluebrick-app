"use client";

import { useEffect, useState } from "react";

import type { PwaCapabilitySnapshot } from "@/lib/pwa/capabilities";
import { decodeVapidPublicKey, serializePushSubscription } from "@/lib/pwa/web-push-client";

type PwaAudience = "account-linking" | "wallet-profile";
type TranslateFn = (text: { en: string; es: string; pt: string }) => string;

type BootstrapResponse = {
  vapidPublicKey: string;
  items: Array<{
    endpoint: string;
    status: string;
  }>;
};

export type WebPushEnrollmentState = {
  canDisable: boolean;
  canEnable: boolean;
  errorMessage: string | null;
  hasCurrentSubscription: boolean;
  isLoading: boolean;
  statusMessage: string | null;
  subscriptionCount: number;
  disableNotifications: () => Promise<void>;
  enableNotifications: () => Promise<void>;
};

async function readBootstrap(): Promise<BootstrapResponse> {
  const response = await fetch("/api/notifications/subscriptions/bootstrap", {
    method: "GET",
    cache: "no-store"
  });
  const payload = await response.json();

  if (!response.ok || !payload?.data?.vapidPublicKey || !Array.isArray(payload?.data?.items)) {
    throw new Error(payload?.error?.message ?? "Could not load push subscription bootstrap.");
  }

  return payload.data as BootstrapResponse;
}

async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are unavailable in this browser.");
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) {
    return existing;
  }

  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none"
  });

  return navigator.serviceWorker.ready;
}

function resolveConsentSource(snapshot: PwaCapabilitySnapshot): string {
  return snapshot.isStandalone ? "protected_profile_standalone" : "protected_profile_browser";
}

export function useWebPushEnrollment({
  audience,
  snapshot,
  t
}: {
  audience: PwaAudience;
  snapshot: PwaCapabilitySnapshot;
  t: TranslateFn;
}): WebPushEnrollmentState {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [hasCurrentSubscription, setHasCurrentSubscription] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncState(): Promise<void> {
      if (
        audience !== "wallet-profile"
        || !snapshot.supportsPush
        || snapshot.notificationState === "needs-install"
        || typeof window === "undefined"
      ) {
        if (!cancelled) {
          setSubscriptionCount(0);
          setHasCurrentSubscription(false);
        }
        return;
      }

      try {
        const [bootstrap, registration] = await Promise.all([
          readBootstrap(),
          ensureServiceWorkerRegistration()
        ]);
        const currentSubscription = await registration.pushManager.getSubscription();
        const activeItems = bootstrap.items.filter((item) => item.status === "active");

        if (!cancelled) {
          setSubscriptionCount(activeItems.length);
          setHasCurrentSubscription(Boolean(currentSubscription && activeItems.some((item) => item.endpoint === currentSubscription.endpoint)));
        }
      } catch (_error) {
        if (!cancelled) {
          setSubscriptionCount(0);
          setHasCurrentSubscription(false);
        }
      }
    }

    void syncState();

    return () => {
      cancelled = true;
    };
  }, [audience, snapshot.notificationState, snapshot.supportsPush]);

  async function enableNotifications(): Promise<void> {
    if (audience !== "wallet-profile") {
      setErrorMessage(
        t({
          en: "Connect and verify a wallet session before enrolling this device for push.",
          es: "Conecta y verifica una wallet antes de inscribir este dispositivo en push.",
          pt: "Conecte e verifique uma wallet antes de inscrever este dispositivo em push."
        })
      );
      return;
    }

    if (snapshot.notificationState === "needs-install") {
      setErrorMessage(
        t({
          en: "Install BRIDS on the Home Screen first, then open it from the new icon before enabling notifications.",
          es: "Instala BRIDS en Home Screen primero y luego abre la app desde el nuevo icono antes de activar notificaciones.",
          pt: "Instale a BRIDS na Home Screen primeiro e depois abra o app pelo novo icone antes de ativar notificacoes."
        })
      );
      return;
    }

    if (!snapshot.supportsPush) {
      setErrorMessage(
        t({
          en: "This browser does not expose a push-capable path for BRIDS.",
          es: "Este navegador no expone una ruta push utilizable para BRIDS.",
          pt: "Este navegador nao expoe um caminho push utilizavel para a BRIDS."
        })
      );
      return;
    }

    if (!("Notification" in window)) {
      setErrorMessage(
        t({
          en: "Notifications API is unavailable in this browser.",
          es: "La API de notificaciones no esta disponible en este navegador.",
          pt: "A API de notificacoes nao esta disponivel neste navegador."
        })
      );
      return;
    }

    if (window.Notification.permission === "denied") {
      setErrorMessage(
        t({
          en: "Browser notifications are blocked. Re-enable them in browser settings before retrying.",
          es: "Las notificaciones estan bloqueadas. Reactivalas en la configuracion del navegador antes de reintentar.",
          pt: "As notificacoes estao bloqueadas. Reative-as nas configuracoes do navegador antes de tentar novamente."
        })
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const permission = window.Notification.permission === "granted"
        ? "granted"
        : await window.Notification.requestPermission();

      if (permission !== "granted") {
        setStatusMessage(
          t({
            en: "Notification permission was not granted.",
            es: "El permiso de notificaciones no fue concedido.",
            pt: "A permissao de notificacoes nao foi concedida."
          })
        );
        return;
      }

      const [bootstrap, registration] = await Promise.all([
        readBootstrap(),
        ensureServiceWorkerRegistration()
      ]);
      const currentSubscription =
        (await registration.pushManager.getSubscription())
        ?? (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidPublicKey(bootstrap.vapidPublicKey)
        }));

      const payload = serializePushSubscription(currentSubscription);
      const response = await fetch("/api/notifications/subscriptions", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          subscription: payload,
          platformFamily: snapshot.platform,
          appMode: snapshot.isStandalone ? "standalone" : "browser",
          consentSource: resolveConsentSource(snapshot)
        })
      });
      const responsePayload = await response.json();

      if (!response.ok) {
        throw new Error(responsePayload?.error?.message ?? "Could not register this push subscription.");
      }

      setHasCurrentSubscription(true);
      setSubscriptionCount((current) => Math.max(current, 1));
      setStatusMessage(
        t({
          en: "This device is now enrolled for BRIDS notifications.",
          es: "Este dispositivo ya quedo inscrito para notificaciones de BRIDS.",
          pt: "Este dispositivo agora esta inscrito para notificacoes da BRIDS."
        })
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  async function disableNotifications(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const registration = await ensureServiceWorkerRegistration();
      const currentSubscription = await registration.pushManager.getSubscription();

      if (!currentSubscription) {
        setHasCurrentSubscription(false);
        setSubscriptionCount(0);
        setStatusMessage(
          t({
            en: "This browser no longer has an active push subscription.",
            es: "Este navegador ya no tiene una suscripcion push activa.",
            pt: "Este navegador ja nao tem uma inscricao push ativa."
          })
        );
        return;
      }

      const response = await fetch("/api/notifications/subscriptions", {
        method: "DELETE",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          endpoint: currentSubscription.endpoint
        })
      });

      if (!response.ok && response.status !== 404) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message ?? "Could not revoke this push subscription.");
      }

      await currentSubscription.unsubscribe();

      setHasCurrentSubscription(false);
      setSubscriptionCount(0);
      setStatusMessage(
        t({
          en: "Notifications were disabled for this device.",
          es: "Las notificaciones quedaron desactivadas para este dispositivo.",
          pt: "As notificacoes foram desativadas neste dispositivo."
        })
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not disable notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    canDisable: hasCurrentSubscription,
    canEnable: audience === "wallet-profile" && snapshot.supportsPush && snapshot.notificationState === "ready" && !hasCurrentSubscription,
    errorMessage,
    hasCurrentSubscription,
    isLoading,
    statusMessage,
    subscriptionCount,
    disableNotifications,
    enableNotifications
  };
}
