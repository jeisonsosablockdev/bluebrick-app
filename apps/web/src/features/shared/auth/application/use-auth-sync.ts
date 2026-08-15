"use client";

/**
 * features/shared/auth/application/use-auth-sync.ts
 *
 * Hook de la capa Application para sincronización del estado de auth entre pestañas.
 * Extraído de main-top-navigation-modal.tsx (líneas ~530-560, 781-843).
 *
 * Responsabilidades:
 * - Mantener el estado de auth sincronizado con el servidor (fetchAuthMe)
 * - Deduplicar llamadas concurrentes a refreshAuthState mediante una ref
 * - Escuchar BroadcastChannel, storage, focus y visibilitychange para refrescar
 * - Sincronizar initialAuth (SSR → CSR) en cada cambio del prop
 * - Hacer un silent refresh on mount
 * - Hacer un refresh (no-silent) cuando el modal se abre
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchAuthMe, type AuthMeResponse } from "@/lib/auth-client";
import {
  AUTH_SYNC_STORAGE_KEY,
  createAuthSyncBroadcastChannel,
  parseAuthSyncPayload,
  parseAuthSyncPayloadFromUnknown,
} from "@/lib/auth-sync";
import { areAuthMeResponsesEquivalent } from "@/lib/state/auth-state";
import { getFriendlyWalletErrorMessage } from "@/features/navigation/application/nav-modal-utils";
import type { Translate } from "@/features/navigation/domain/nav-modal-types";

type UseAuthSyncParams = {
  initialAuth: AuthMeResponse;
  isOpen: boolean;
  t: Translate;
};

type UseAuthSyncResult = {
  authState: AuthMeResponse;
  setAuthState: React.Dispatch<React.SetStateAction<AuthMeResponse>>;
  refreshAuthState: (options?: { silent?: boolean }) => Promise<void>;
  lastError: string | null;
  setLastError: (error: string | null) => void;
};

export function useAuthSync({ initialAuth, isOpen, t }: UseAuthSyncParams): UseAuthSyncResult {
  const [authState, setAuthState] = useState<AuthMeResponse>(initialAuth);
  const [lastError, setLastError] = useState<string | null>(null);
  const authRefreshPromiseRef = useRef<Promise<void> | null>(null);

  const refreshAuthState = useCallback(
    async (options?: { silent?: boolean }): Promise<void> => {
      if (authRefreshPromiseRef.current) {
        return authRefreshPromiseRef.current;
      }

      const silent = Boolean(options?.silent);
      const refreshPromise = (async () => {
        try {
          const currentAuth = await fetchAuthMe();
          setAuthState((previous) =>
            areAuthMeResponsesEquivalent(previous, currentAuth) ? previous : currentAuth
          );

          if (!silent) {
            setLastError(null);
          }
        } catch (error) {
          if (!silent) {
            setLastError(getFriendlyWalletErrorMessage(error, t));
          }
        }
      })();

      authRefreshPromiseRef.current = refreshPromise.finally(() => {
        authRefreshPromiseRef.current = null;
      });

      return authRefreshPromiseRef.current;
    },
    [t]
  );

  // SSR → CSR sync: whenever initialAuth prop changes, update local state
  useEffect(() => {
    setAuthState(initialAuth);
  }, [initialAuth]);

  // Silent refresh on mount
  useEffect(() => {
    void refreshAuthState({ silent: true });
  }, [refreshAuthState]);

  // Refresh (non-silent) when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void refreshAuthState();
  }, [isOpen, refreshAuthState]);

  // Listen to cross-tab events: BroadcastChannel, storage, focus, visibilitychange
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleFocus = (): void => {
      void refreshAuthState({ silent: true });
    };

    const handleVisibilityChange = (): void => {
      if (!document.hidden) {
        void refreshAuthState({ silent: true });
      }
    };

    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== AUTH_SYNC_STORAGE_KEY) {
        return;
      }
      if (!parseAuthSyncPayload(event.newValue)) {
        return;
      }
      void refreshAuthState({ silent: true });
    };

    const channel = createAuthSyncBroadcastChannel();
    const handleChannelMessage = (event: MessageEvent<unknown>): void => {
      if (!parseAuthSyncPayloadFromUnknown(event.data)) {
        return;
      }
      void refreshAuthState({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);
    channel?.addEventListener("message", handleChannelMessage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.removeEventListener("message", handleChannelMessage);
        channel.close();
      }
    };
  }, [refreshAuthState]);

  return {
    authState,
    setAuthState,
    refreshAuthState,
    lastError,
    setLastError,
  };
}
