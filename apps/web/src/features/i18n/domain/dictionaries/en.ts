/**
 * @file apps/web/src/features/i18n/domain/dictionaries/en.ts
 * @description Layer 3: Domain - Canonical English (en) Localization Dictionary.
 */

import type { Dictionary } from "../models/locale-types";

export const en: Dictionary = {
  common: {
    brandName: "BLUE BRICK",
    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    close: "Close",
    learnMore: "Learn more",
    language: "Language",
    selectLanguage: "Select language",
    logout: "Sign out",
  },
  nav: {
    dashboard: "Dashboard",
    properties: "Properties",
    portfolio: "Portfolio",
    governance: "Governance",
    support: "Support",
  },
  landing: {
    badge: "Private Fractional Real Estate Investment Platform",
    headline: "Invest in premium real estate assets with transparent returns",
    subtitle:
      "Access your institutional portfolio, monitor monthly distributions, track weighted returns, and reinvest capital into exclusive opportunities.",
    securityBadge: "Institutional Governance · WorkOS AuthKit & Neon Cloud Security",
    footerText: "BlueBrick Platform · Fractional Real Estate Investments · Connected to Vercel Cloud",
  },
  loginCard: {
    headerTitle: "Investor Access",
    verifiedBadge: "Verified Demo",
    tierLabel: "Private Investor",
    activeProjectsCount: "{count} Active Projects",
    enterDashboardButton: "Enter Dashboard",
    emailLoginButton: "Sign in with Email",
    disclaimerNote: "* BlueBrick Investment Platform · Instant demo or federated access.",
  },
  dashboard: {
    totalInvested: "Total Invested Capital",
    weightedRoi: "Weighted Average ROI: {roi}%",
    activeProperties: "Active",
    concludedProperties: "Concluded",
    projectedEarnings: "Projected Earnings",
    portfolioDistribution: "Portfolio Distribution",
    allocation: "Allocation",
    myInvestments: "My Investments",
    portfolioDetail: "Portfolio Detail",
    tableColumns: {
      project: "Project",
      invested: "Invested",
      roi: "ROI",
      status: "Status",
      timing: "Timeline",
    },
    status: {
      active: "Active",
      concluded: "Concluded",
      pending: "Pending",
    },
    cards: {
      investedAmount: "Invested Amount",
      estimatedRoi: "Estimated ROI",
      returnDate: "Return Date",
      closingDate: "Closing Date",
      changeAvatar: "Change avatar",
      memberSince: "since {year}",
    },
    reinvestment: {
      badge: "New Opportunities for {name}",
      title: "Your concluded capital is ready to work again.",
      description:
        "Reinvest profits from your concluded projects into these curated opportunities selected by our team, with estimated returns exceeding your current portfolio average.",
      ctaButton: "Reinvest Now",
      estimatedRoi: "Est. ROI {roi}%",
      minInvestmentFrom: "from {amount}",
    },
  },
  wallet: {
    connect: "Connect Wallet",
    disconnect: "Disconnect",
    connecting: "Connecting...",
    connected: "Connected",
    error: "Wallet error",
  },
};
