/**
 * @file apps/web/src/features/i18n/domain/models/locale-types.ts
 * @description Layer 3: Domain - Core Type Contracts for Internationalization (i18n).
 * Defines supported locales, dictionary schema structures, formatting options, and metadata.
 */

/**
 * Enumeration of supported ISO 639-1 language codes across the BlueBrick platform.
 */
export type SupportedLocale = "es" | "en" | "pt";

/**
 * Array of all supported locales for runtime validation and iteration.
 */
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["es", "en", "pt"] as const;

/**
 * The canonical fallback locale when no user preference or matching browser locale is found.
 */
export const DEFAULT_LOCALE: SupportedLocale = "es";

/**
 * Metadata configuration for each supported locale.
 */
export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
  dateFormat: string;
}

/**
 * Map of metadata descriptors for UI rendering and locale presentation.
 */
export const LOCALE_CONFIGS: Record<SupportedLocale, LocaleMetadata> = {
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    dir: "ltr",
    dateFormat: "DD/MM/YYYY",
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    dir: "ltr",
    dateFormat: "MM/DD/YYYY",
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    dir: "ltr",
    dateFormat: "DD/MM/YYYY",
  },
};

/**
 * Full shape of the BlueBrick localized translation dictionary.
 */
export interface Dictionary {
  common: {
    brandName: string;
    loading: string;
    error: string;
    retry: string;
    save: string;
    cancel: string;
    back: string;
    close: string;
    learnMore: string;
    language: string;
    selectLanguage: string;
    logout: string;
    toggleThemeAria: string;
  };
  nav: {
    dashboard: string;
    properties: string;
    portfolio: string;
    governance: string;
    support: string;
  };
  landing: {
    badge: string;
    headline: string;
    subtitle: string;
    securityBadge: string;
    footerText: string;
  };
  loginCard: {
    headerTitle: string;
    privatePortalBadge: string;
    exclusiveAccessTitle: string;
    loginSubtitle: string;
    emailLoginButton: string;
    disclaimerNote: string;
    supportedProvidersLabel: string;
  };
  logoutModal: {
    title: string;
    description: string;
    dontAskAgain: string;
    confirmButton: string;
    cancelButton: string;
  };
  dashboard: {
    totalInvested: string;
    weightedRoi: string;
    activeProperties: string;
    concludedProperties: string;
    projectedEarnings: string;
    portfolioDistribution: string;
    allocation: string;
    myInvestments: string;
    portfolioDetail: string;
    tableColumns: {
      project: string;
      invested: string;
      roi: string;
      status: string;
      timing: string;
    };
    status: {
      active: string;
      concluded: string;
      pending: string;
    };
    cards: {
      investedAmount: string;
      estimatedRoi: string;
      returnDate: string;
      closingDate: string;
      changeAvatar: string;
      memberSince: string;
    };
    reinvestment: {
      badge: string;
      title: string;
      description: string;
      ctaButton: string;
      estimatedRoi: string;
      minInvestmentFrom: string;
    };
  };
  wallet: {
    connect: string;
    disconnect: string;
    connecting: string;
    connected: string;
    error: string;
  };
}

/**
 * Nested key paths for strongly-typed translation lookups.
 */
export type TranslationKey = string;

/**
 * Options for currency, number, and percentage formatting.
 */
export interface FormatOptions {
  locale?: SupportedLocale;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}
