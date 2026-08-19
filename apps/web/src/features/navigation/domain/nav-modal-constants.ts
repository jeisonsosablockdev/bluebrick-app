/**
 * features/navigation/domain/nav-modal-constants.ts
 *
 * Constantes de configuración del feature Navigation.
 * Sin dependencias de React ni de frameworks externos.
 */

export const WALLET_MODAL_IDLE_TIMEOUT_MS = 30_000;
export const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
export const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile/i;
export const PHANTOM_USER_AGENT_PATTERN = /phantom/i;
export const POST_AUTH_DECISION_QUERY_PARAM = "postAuthDecision";
export const PRIMARY_NAV_LINK_BASE_CLASSNAME =
  "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition";
export const PRIMARY_NAV_LINK_STABLE_WIDTH_CLASSNAME = "sm:w-[6.75rem] sm:px-2.5 sm:justify-center";
