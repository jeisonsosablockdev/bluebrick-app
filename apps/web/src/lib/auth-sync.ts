export const AUTH_SYNC_STORAGE_KEY = "siws_auth_sync_v1";
export const AUTH_SYNC_BROADCAST_CHANNEL = "siws_auth_sync_channel_v1";

export type AuthSyncEvent = "login" | "logout";

export type AuthSyncPayload = {
  event: AuthSyncEvent;
  ts: number;
  pubkey: string | null;
};

export function createAuthSyncPayload(event: AuthSyncEvent, pubkey: string | null): AuthSyncPayload {
  return {
    event,
    ts: Date.now(),
    pubkey: typeof pubkey === "string" && pubkey.trim().length > 0 ? pubkey : null
  };
}

export function serializeAuthSyncPayload(payload: AuthSyncPayload): string {
  return JSON.stringify(payload);
}

export function parseAuthSyncPayloadFromUnknown(value: unknown): AuthSyncPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const parsed = value as Partial<AuthSyncPayload>;

  if (parsed.event !== "login" && parsed.event !== "logout") {
    return null;
  }

  if (typeof parsed.ts !== "number" || !Number.isFinite(parsed.ts) || parsed.ts <= 0) {
    return null;
  }

  if (parsed.pubkey !== null && parsed.pubkey !== undefined && typeof parsed.pubkey !== "string") {
    return null;
  }

  return {
    event: parsed.event,
    ts: parsed.ts,
    pubkey: parsed.pubkey ?? null
  };
}

export function parseAuthSyncPayload(value: string | null | undefined): AuthSyncPayload | null {
  if (!value) {
    return null;
  }

  try {
    return parseAuthSyncPayloadFromUnknown(JSON.parse(value));
  } catch {
    return null;
  }
}

export function emitAuthSyncPayload(payload: AuthSyncPayload, storage: Pick<Storage, "setItem">): void {
  storage.setItem(AUTH_SYNC_STORAGE_KEY, serializeAuthSyncPayload(payload));
}

export function createAuthSyncBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  return new BroadcastChannel(AUTH_SYNC_BROADCAST_CHANNEL);
}

export function broadcastAuthSync(event: AuthSyncEvent, pubkey: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload = createAuthSyncPayload(event, pubkey);

  try {
    const channel = createAuthSyncBroadcastChannel();
    if (channel) {
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
    // Ignore unavailable BroadcastChannel implementations.
  }

  try {
    emitAuthSyncPayload(payload, window.localStorage);
  } catch {
    // Ignore storage write failures (private mode / sandboxed browser contexts).
  }
}
