import type { AppLocale } from "@/lib/i18n";

function unavailableLabel(locale: AppLocale): string {
  return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
}

export function formatMarketplaceDetailUsd(value: number | null, locale: AppLocale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return unavailableLabel(locale);
  }

  const normalizedLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";
  return new Intl.NumberFormat(normalizedLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatMarketplaceDetailMonths(value: number | null, locale: AppLocale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return unavailableLabel(locale);
  }

  return `${value} ${locale === "en" ? "months" : "meses"}`;
}

export function formatMarketplaceDetailPercent(value: number | null, locale: AppLocale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return unavailableLabel(locale);
  }

  const normalizedLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";
  return `${new Intl.NumberFormat(normalizedLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
}

export function shouldRenderMarketplaceDetailMetric(value: number | null): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function formatMarketplaceDetailLocation(detailedLocation: string, postalCode: string | null | undefined): string {
  const normalizedDetailedLocation = detailedLocation.trim();
  const normalizedPostalCode = postalCode?.trim();
  if (!normalizedPostalCode) {
    return normalizedDetailedLocation;
  }

  return normalizedDetailedLocation
    .replace(new RegExp(`\\s*,?\\s*${normalizedPostalCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`), "")
    .trim();
}

export function formatMarketplaceDetailDate(dateValue: string | null, locale: AppLocale): string {
  if (!dateValue) {
    return unavailableLabel(locale);
  }

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.valueOf())) {
    return unavailableLabel(locale);
  }

  const dateLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";

  return parsed.toLocaleString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
