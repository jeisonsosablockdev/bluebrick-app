import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE_NAME, resolveRequestedLocale, type AppLocale } from "@/lib/i18n";

export async function getServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return resolveRequestedLocale({
    cookieValue: cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? null,
    acceptLanguage: headerStore.get("accept-language")
  });
}
