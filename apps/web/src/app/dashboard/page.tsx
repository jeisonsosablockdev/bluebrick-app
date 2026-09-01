/**
 * @file apps/web/src/app/dashboard/page.tsx
 * @description Layer 1: Presentation - Private Investor Dashboard Page (Server Component).
 * Fetches portfolio aggregations from Neon PostgreSQL and renders the complete interactive dashboard.
 */

import React from "react";
import type { Metadata } from "next";
import { InvestmentDashboard } from "@/components/dashboard/investment-dashboard";
import { InvestmentRepository } from "@/lib/infrastructure/db/repositories/investment-repository";
import { UserRepository } from "@/lib/infrastructure/db/repositories/user-repository";
import type { DashboardViewModel } from "@/lib/types/dashboard";
import type { DbUser, PortfolioItem, DbReinvestmentOpportunity, PortfolioSummary } from "@/lib/types/db";

export const metadata: Metadata = {
  title: "Panel de Inversión (Demo) | BlueBrick",
  description:
    "Monitorea el portafolio de inversión inmobiliaria fraccionada, rendimientos mensuales y oportunidades activas en BlueBrick.",
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    title: "Panel de Inversión (Demo) | BlueBrick",
    description:
      "Portafolio institucional de inversiones inmobiliarias fraccionadas con dividendos mensuales y métricas en tiempo real.",
    url: "/dashboard",
  },
};

const DEFAULT_INVESTOR: DbUser = {
  id: "user_sofia_martinez",
  email: "sofia.martinez@bluebrick.investments",
  firstName: "Sofía",
  lastName: "Martínez",
  avatarUrl: null,
  tier: "Inversionista Privado",
  createdAt: new Date("2021-01-01"),
};

const FALLBACK_PROPERTIES: PortfolioItem[] = [
  {
    id: "inv_sofia_001",
    propertyId: "prop_vista_norte",
    propertyName: "Residencial Vista Norte",
    city: "Bogotá, Colombia",
    propertyType: "Residencial",
    investedAmount: 45000,
    roi: 14.2,
    status: "activa",
    timing: "Noviembre 2026",
    monthsLeft: 4,
    gradient: "linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)",
  },
  {
    id: "inv_sofia_002",
    propertyId: "prop_torre_sabana",
    propertyName: "Torre Corporativa Sabana",
    city: "Bogotá, Colombia",
    propertyType: "Comercial",
    investedAmount: 60000,
    roi: 11.8,
    status: "activa",
    timing: "Marzo 2027",
    monthsLeft: 8,
    gradient: "linear-gradient(135deg,#C41230 0%,#4A0F1A 100%)",
  },
  {
    id: "inv_sofia_003",
    propertyId: "prop_bodega_cota",
    propertyName: "Bodega Industrial Cota",
    city: "Cota, Colombia",
    propertyType: "Industrial",
    investedAmount: 25000,
    roi: 18.5,
    status: "concluida",
    timing: "Concluida — Junio 2026",
    monthsLeft: 0,
    gradient: "linear-gradient(135deg,#57B98C 0%,#0A1220 100%)",
  },
  {
    id: "inv_sofia_004",
    propertyId: "prop_lote_chia",
    propertyName: "Lote Comercial Chía",
    city: "Chía, Colombia",
    propertyType: "Comercial",
    investedAmount: 18000,
    roi: 9.4,
    status: "activa",
    timing: "Enero 2027",
    monthsLeft: 6,
    gradient: "linear-gradient(135deg,#E8495F 0%,#3B1018 100%)",
  },
  {
    id: "inv_sofia_005",
    propertyId: "prop_apartaestudios_laureles",
    propertyName: "Apartaestudios Laureles",
    city: "Medellín, Colombia",
    propertyType: "Residencial",
    investedAmount: 15000,
    roi: 13.0,
    status: "activa",
    timing: "Agosto 2026",
    monthsLeft: 1,
    gradient: "linear-gradient(135deg,#3F7D63 0%,#0A1220 100%)",
  },
];

const DEFAULT_PORTFOLIO_SUMMARY: PortfolioSummary = {
  userId: DEFAULT_INVESTOR.id,
  totalInvested: 163000,
  weightedRoi: 13.7,
  activeCount: 4,
  concludedCount: 1,
  items: FALLBACK_PROPERTIES,
};

export interface DashboardPageProps {
  readonly params?: Promise<Record<string, string>>;
  readonly searchParams?: Promise<{ readonly [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage(props: DashboardPageProps): Promise<React.JSX.Element> {
  // Step 1: Initialize database repositories
  const investmentRepo = new InvestmentRepository();
  const userRepo = new UserRepository();

  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const rawEmail = searchParams?.email;
  const paramEmail = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : null;

  let investor: DbUser = DEFAULT_INVESTOR;
  let summary = { ...DEFAULT_PORTFOLIO_SUMMARY };
  let opportunities: DbReinvestmentOpportunity[] = [];

  try {
    const { getAuthenticatedInvestor } = await import("@/lib/auth/workos-session");
    investor = await getAuthenticatedInvestor(userRepo);

    // If paramEmail is provided or session investor has real email, resolve target email
    const targetEmail = paramEmail || (investor.email !== DEFAULT_INVESTOR.email ? investor.email : null);

    // Step 2: Query live portfolio metrics from Neon PostgreSQL (prioritizing dashboard_investments by email)
    const dbSummary = await investmentRepo.getPortfolioSummary(targetEmail || investor.email, investor.id);
    if (dbSummary && dbSummary.items.length > 0) {
      summary = dbSummary;

      // If resolved from a real investor email, update investor display metadata if needed
      if (targetEmail && targetEmail !== DEFAULT_INVESTOR.email) {
        investor = {
          ...investor,
          email: targetEmail,
          firstName: investor.firstName || "Inversionista",
          lastName: investor.lastName || "BlueBrick",
        };
      }
    }

    // Step 3: Query active reinvestment opportunities exclusively from Neon PostgreSQL (ingested from Excel)
    opportunities = await investmentRepo.getReinvestmentOpportunities();
  } catch (error) {
    // Invariant: If database connection is offline, smoothly fall back to default seed state
    console.warn("Neon PostgreSQL offline or unreachable, using fallback portfolio fixtures.", error);
  }

  // Step 4: Construct unified DashboardViewModel
  const dashboardData: DashboardViewModel = {
    investor,
    totalInvested: summary.totalInvested,
    weightedRoi: summary.weightedRoi,
    activeCount: summary.activeCount,
    concludedCount: summary.concludedCount,
    properties: summary.items,
    reinvestmentOpportunities: opportunities,
  };

  return <InvestmentDashboard initialData={dashboardData} />;
}

