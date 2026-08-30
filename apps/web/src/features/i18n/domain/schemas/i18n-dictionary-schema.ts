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
  logout: z.string().min(1),
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
  verifiedBadge: z.string().min(1),
  tierLabel: z.string().min(1),
  activeProjectsCount: z.string().min(1),
  enterDashboardButton: z.string().min(1),
  emailLoginButton: z.string().min(1),
  disclaimerNote: z.string().min(1),
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
    estimatedRoi: z.string().min(1),
    minInvestmentFrom: z.string().min(1),
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
 * Complete Dictionary Schema enforcing all required token namespaces.
 */
export const DictionarySchema = z.object({
  common: CommonTokensSchema,
  nav: NavTokensSchema,
  landing: LandingTokensSchema,
  loginCard: LoginCardTokensSchema,
  dashboard: DashboardTokensSchema,
  wallet: WalletTokensSchema,
});

export type ValidatedDictionary = z.infer<typeof DictionarySchema>;
