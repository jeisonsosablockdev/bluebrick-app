export const APP_SPLASH_MINIMUM_VISIBLE_MS = 2400;
export const APP_SPLASH_NAME_INTRO_MS = 400;
export const APP_SPLASH_MARK_DELAY_MS = 420;
export const APP_SPLASH_FADE_OUT_MS = 520;
export const SPLASH_SESSION_KEY = "brids_splash_shown_session";

export function getAppSplashExitDelay(elapsedMs: number): number {
  return Math.max(APP_SPLASH_MINIMUM_VISIBLE_MS - elapsedMs, 0);
}

export function shouldWaitForAppLoad(documentReadyState: DocumentReadyState): boolean {
  return documentReadyState !== "complete";
}

export function hasSeenSplashInSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function markSplashSeenInSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
  } catch {
    // SessionStorage unavailable or restricted
  }
}
