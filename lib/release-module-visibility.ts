const DEV_ONLY_MODULES_FLAG = "NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES";

const PROTECTED_RELEASE_CONTROLLED_ROUTES = new Set([
  "/protected/portfolio",
  "/protected/stake",
  "/protected/rentas",
  "/protected/historial"
]);

const ADMIN_RELEASE_CONTROLLED_ROUTES = new Set([
  "/admin/mint",
  "/admin/treasury",
  "/admin/distributions",
  "/admin/settings"
]);

function parseBooleanEnv(rawValue: string | undefined): boolean | null {
  if (!rawValue) {
    return null;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
    return false;
  }

  return null;
}

export function areDevOnlyModulesVisible(): boolean {
  const explicit = parseBooleanEnv(process.env[DEV_ONLY_MODULES_FLAG]);

  if (explicit !== null) {
    return explicit;
  }

  return process.env.NODE_ENV !== "production";
}

export function isProtectedReleaseControlledRoute(route: string): boolean {
  return PROTECTED_RELEASE_CONTROLLED_ROUTES.has(route);
}

export function isAdminReleaseControlledRoute(route: string): boolean {
  return ADMIN_RELEASE_CONTROLLED_ROUTES.has(route);
}

export function isReleaseControlledRouteVisible(route: string): boolean {
  if (!isProtectedReleaseControlledRoute(route) && !isAdminReleaseControlledRoute(route)) {
    return true;
  }

  return areDevOnlyModulesVisible();
}
