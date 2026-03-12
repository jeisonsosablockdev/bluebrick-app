import type { ListingStatus } from "@/lib/property-service";
import type { AppLocale } from "@/lib/i18n";

export function listingStatusLabel(status: ListingStatus, locale: AppLocale = "es"): string {
  if (status === "active") {
    if (locale === "en") {
      return "Active";
    }

    if (locale === "pt") {
      return "Ativo";
    }

    return "Activo";
  }

  if (status === "funding") {
    if (locale === "en") {
      return "Funding";
    }

    if (locale === "pt") {
      return "Captação";
    }

    return "Funding";
  }

  if (locale === "pt") {
    return "Esgotado";
  }

  return locale === "en" ? "Sold out" : "Agotado";
}

export function listingStatusClasses(status: ListingStatus): string {
  if (status === "active") {
    return "bg-emerald-500/15 text-emerald-200";
  }

  if (status === "funding") {
    return "bg-amber-500/15 text-amber-200";
  }

  return "bg-slate-500/20 text-slate-200";
}
