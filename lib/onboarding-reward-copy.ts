import { localize, type AppLocale, type LocaleText } from "@/lib/i18n";

export type OnboardingRewardStatus =
  | "pending_profile"
  | "pending_kyc"
  | "pending_review"
  | "earned"
  | "reserved"
  | "consumed"
  | "expired";

const LOCALE_FORMAT_TAGS: Record<AppLocale, string> = {
  en: "en-US",
  es: "es-CO",
  pt: "pt-BR"
};

export const ONBOARDING_REWARD_STATUS_LABELS: Record<OnboardingRewardStatus, LocaleText> = {
  pending_profile: {
    en: "Complete profile",
    es: "Completar perfil",
    pt: "Completar perfil"
  },
  pending_kyc: {
    en: "Pending KYC",
    es: "KYC pendiente",
    pt: "KYC pendente"
  },
  pending_review: {
    en: "Under review",
    es: "En revisión",
    pt: "Em revisão"
  },
  earned: {
    en: "Earned",
    es: "Ganado",
    pt: "Ganho"
  },
  reserved: {
    en: "Reserved",
    es: "Reservado",
    pt: "Reservado"
  },
  consumed: {
    en: "Used",
    es: "Usado",
    pt: "Usado"
  },
  expired: {
    en: "Expired",
    es: "Expirado",
    pt: "Expirado"
  }
};

export function formatOnboardingRewardDeadlineLabel(deadlineIso: string | null, locale: AppLocale): string | null {
  if (!deadlineIso) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(LOCALE_FORMAT_TAGS[locale], {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(deadlineIso));
  } catch {
    return null;
  }
}

export function formatOnboardingRewardRemainingWindow(seconds: number | null, locale: AppLocale): string | null {
  if (typeof seconds !== "number") {
    return null;
  }

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.max(1, Math.floor((seconds % 3_600) / 60));

  if (days > 0) {
    return localize(locale, {
      en: `${days}d ${hours}h`,
      es: `${days}d ${hours}h`,
      pt: `${days}d ${hours}h`
    });
  }

  return localize(locale, {
    en: `${hours}h ${minutes}m`,
    es: `${hours}h ${minutes}m`,
    pt: `${hours}h ${minutes}m`
  });
}

export function formatUsdByLocale(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(LOCALE_FORMAT_TAGS[locale], {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
