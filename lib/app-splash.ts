export const APP_SPLASH_MINIMUM_VISIBLE_MS = 1000;
export const APP_SPLASH_NAME_INTRO_MS = 400;
export const APP_SPLASH_MARK_DELAY_MS = 420;
export const APP_SPLASH_FADE_OUT_MS = 520;

export function getAppSplashExitDelay(elapsedMs: number): number {
  return Math.max(APP_SPLASH_MINIMUM_VISIBLE_MS - elapsedMs, 0);
}

export function shouldWaitForAppLoad(documentReadyState: DocumentReadyState): boolean {
  return documentReadyState !== "complete";
}
