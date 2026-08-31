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
    toggleThemeAria: "Toggle light or dark theme",
  },
  nav: {
    dashboard: "Dashboard",
    properties: "Properties",
    portfolio: "Portfolio",
    governance: "Governance",
    support: "Support",
  },
  landing: {
    badge: "Private Real Estate Investment Platform",
    headline: "Private Real Estate Investment Platform",
    subtitle:
      "Access your institutional portfolio, monitor monthly distributions, track weighted returns, and reinvest capital into exclusive opportunities.",
    securityBadge: "Institutional Governance · Maximum security and privacy for investors",
    footerText: "BlueBrick Platform · Fractional Real Estate Investments",
  },
  loginCard: {
    headerTitle: "Investor Access",
    privatePortalBadge: "Private Portal",
    exclusiveAccessTitle: "Exclusive access for investors",
    loginSubtitle: "Sign in with your personal or corporate email to manage your investments.",
    emailLoginButton: "Sign in with your email",
    disclaimerNote: "BlueBrick Investment Platform · Secure and institutional access for verified investors.",
    supportedProvidersLabel: "Compatible with Google, Microsoft, Apple & Yahoo",
  },
  logoutModal: {
    title: "Sign out?",
    description: "Are you sure you want to sign out of your account? You will need to re-enter your credentials to access your portfolio.",
    dontAskAgain: "Don't ask again",
    confirmButton: "Sign out",
    cancelButton: "Cancel",
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
      title: "Grow your wealth",
      description:
        "Discover new real estate opportunities curated by Blue Brick. Expand your exposure to real assets, diversify your capital, and find new opportunities to keep building wealth.",
      ctaButton: "Invest Now",
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
