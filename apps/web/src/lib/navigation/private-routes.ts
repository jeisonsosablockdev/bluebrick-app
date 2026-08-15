const PRIVATE_POST_LOGOUT_PATH_PREFIXES = ["/admin", "/profile", "/protected", "/checkout"];

export const POST_LOGOUT_PUBLIC_HREF = "/";

export function shouldRedirectToPublicAfterLogout(pathname: string): boolean {
  return PRIVATE_POST_LOGOUT_PATH_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
