/**
 * @file apps/web/src/features/i18n/domain/schemas/i18n-dictionary-schema.ts
 * @description Layer 3: Domain - Zod Schema for Dictionary Validation.
 * Validates full dictionary structure to ensure zero missing keys across all languages.
 */

import { z } from "zod";

/**
 * Common tokens schema.
 */
export const CommonTokensSchema = z.object({
  brandName: z.string().min(1),
  loading: z.string().min(1),
  error: z.string().min(1),
  retry: z.string().min(1),
  save: z.string().min(1),
  cancel: z.string().min(1),
  back: z.string().min(1),
  close: z.string().min(1),
  learnMore: z.string().min(1),
  language: z.string().min(1),
  selectLanguage: z.string().min(1),
  logout: z.string().min(1),
  toggleThemeAria: z.string().min(1),
});

/**
 * Nav tokens schema.
 */
export const NavTokensSchema = z.object({
  dashboard: z.string().min(1),
  properties: z.string().min(1),
  portfolio: z.string().min(1),
  governance: z.string().min(1),
  support: z.string().min(1),
});

/**
 * Landing tokens schema.
 */
export const LandingTokensSchema = z.object({
  badge: z.string().min(1),
  headline: z.string().min(1),
  subtitle: z.string().min(1),
  securityBadge: z.string().min(1),
  footerText: z.string().min(1),
});

/**
 * Login Card tokens schema.
 */
export const LoginCardTokensSchema = z.object({
  headerTitle: z.string().min(1),
  privatePortalBadge: z.string().min(1),
  exclusiveAccessTitle: z.string().min(1),
  loginSubtitle: z.string().min(1),
  emailLoginButton: z.string().min(1),
  disclaimerNote: z.string().min(1),
  supportedProvidersLabel: z.string().min(1),
});

/**
 * Dashboard tokens schema.
 */
export const DashboardTokensSchema = z.object({
  totalInvested: z.string().min(1),
  weightedRoi: z.string().min(1),
  activeProperties: z.string().min(1),
  concludedProperties: z.string().min(1),
  projectedEarnings: z.string().min(1),
  portfolioDistribution: z.string().min(1),
  allocation: z.string().min(1),
  myInvestments: z.string().min(1),
  portfolioDetail: z.string().min(1),
  previous: z.string().min(1),
  next: z.string().min(1),
  goToProperty: z.string().min(1),
  tableColumns: z.object({
    project: z.string().min(1),
    invested: z.string().min(1),
    roi: z.string().min(1),
    status: z.string().min(1),
    timing: z.string().min(1),
  }),
  status: z.object({
    active: z.string().min(1),
    concluded: z.string().min(1),
    pending: z.string().min(1),
  }),
  propertyTypes: z.object({
    residential: z.string().min(1),
    commercial: z.string().min(1),
    industrial: z.string().min(1),
  }),
  cards: z.object({
    investedAmount: z.string().min(1),
    estimatedRoi: z.string().min(1),
    returnDate: z.string().min(1),
    closingDate: z.string().min(1),
    changeAvatar: z.string().min(1),
    memberSince: z.string().min(1),
  }),
  reinvestment: z.object({
    badge: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    ctaButton: z.string().min(1),
    submitting: z.string().min(1),
    defaultError: z.string().min(1),
    unexpectedError: z.string().min(1),
    estimatedRoi: z.string().min(1),
    minInvestmentFrom: z.string().min(1),
  }),
  phaseProgress: z.object({
    title: z.string().min(1),
    completed: z.string().min(1),
    phaseXofY: z.string().min(1),
    status: z.object({
      completed: z.string().min(1),
      inProgress: z.string().min(1),
      pending: z.string().min(1),
      notApplicable: z.string().min(1),
    }),
    photoCountSingle: z.string().min(1),
    photoCountMultiple: z.string().min(1),
    defaultDescription: z.string().min(1),
  }),
  mediaCard: z.object({
    expandAria: z.string().min(1),
    photoAlt: z.string().min(1),
    photoCounter: z.string().min(1),
    progressPhoto: z.string().min(1),
    progress1: z.string().min(1),
    prevImageAria: z.string().min(1),
    nextImageAria: z.string().min(1),
    viewImageAria: z.string().min(1),
    modalTitle: z.string().min(1),
  }),
  avatarModal: z.object({
    title: z.string().min(1),
    dragDrop: z.string().min(1),
    browse: z.string().min(1),
    supportedFormats: z.string().min(1),
    uploading: z.string().min(1),
    uploadButton: z.string().min(1),
    cancel: z.string().min(1),
    invalidImage: z.string().min(1),
    uploadError: z.string().min(1),
  }),
  imageDetail: z.object({
    zoomIn: z.string().min(1),
    zoomOut: z.string().min(1),
    reset: z.string().min(1),
    close: z.string().min(1),
    prevPhoto: z.string().min(1),
    nextPhoto: z.string().min(1),
    allPhasesNav: z.string().min(1),
    fallbackTitle: z.string().min(1),
    fallbackDescription: z.string().min(1),
  }),
});

/**
 * Wallet tokens schema.
 */
export const WalletTokensSchema = z.object({
  connect: z.string().min(1),
  disconnect: z.string().min(1),
  connecting: z.string().min(1),
  connected: z.string().min(1),
  error: z.string().min(1),
});

/**
 * Logout Modal tokens schema.
 */
export const LogoutModalTokensSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  dontAskAgain: z.string().min(1),
  confirmButton: z.string().min(1),
  cancelButton: z.string().min(1),
});

/**
 * Complete Dictionary Schema enforcing all required token namespaces.
 */
export const DictionarySchema = z.object({
  common: CommonTokensSchema,
  nav: NavTokensSchema,
  landing: LandingTokensSchema,
  loginCard: LoginCardTokensSchema,
  logoutModal: LogoutModalTokensSchema,
  dashboard: DashboardTokensSchema,
  wallet: WalletTokensSchema,
});

export type ValidatedDictionary = z.infer<typeof DictionarySchema>;
