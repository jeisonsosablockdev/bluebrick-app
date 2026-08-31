/**
 * @file apps/web/src/components/dashboard/investment-dashboard.tsx
 * @description Layer 1: Presentation - Institutional Investment Dashboard Component.
 * Implements dark luxury theme, responsive mobile-first grids, Recharts portfolio donut,
 * investment carousel, interactive details table, and Vercel Blob avatar uploader.
 */

"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  Wallet,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Home,
  Building2,
  Warehouse,
  LandPlot,
  LogOut,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { formatUsdCurrency } from "@/lib/pipelines/dashboard-metrics";
import { signOutAction } from "@/lib/auth/actions";
import { BlueBrickMark } from "./blue-brick-mark";
import { StatChip } from "./stat-chip";
import { MetricRow } from "./metric-row";
import { StatusBadge } from "./status-badge";
import { ProjectPhaseProgress } from "./project-phase-progress";
import { AvatarUploadModal } from "@/components/profile/avatar-upload-modal";
import { LogoutConfirmModal } from "@/components/auth/logout-confirm-modal";
import { useI18n, LocaleSwitcher } from "@/features/i18n";
import type { DashboardViewModel } from "@/lib/types/dashboard";
import type { PortfolioItem, DbReinvestmentOpportunity } from "@/lib/types/db";

const PIE_COLORS = ["#2F8F6B", "#C41230", "#57B98C", "#E8495F", "#1A523D"];

export interface InvestmentDashboardProps {
  initialData: DashboardViewModel;
}

function navBtnStyle(dir: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [dir]: -16,
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#0A1220",
    border: "1px solid rgba(237,241,245,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#EDF1F5",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    zIndex: 10,
  };
}

function PropertyIcon({
  type,
  name,
  size,
  color,
}: {
  type: string;
  name: string;
  size: number;
  color: string;
}): React.JSX.Element {
  if (name.includes("Lote") || type === "Lote") return <LandPlot size={size} color={color} />;
  if (name.includes("Bodega") || type === "Industrial") return <Warehouse size={size} color={color} />;
  if (name.includes("Torre") || type === "Comercial") return <Building2 size={size} color={color} />;
  return <Home size={size} color={color} />;
}

export function InvestmentDashboard({ initialData }: InvestmentDashboardProps): React.JSX.Element {
  // Step 1: Access localized translation strings and formatters
  const { t, formatCurrency } = useI18n();

  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.investor.avatarUrl);

  const properties: PortfolioItem[] = initialData.properties;
  const maxIndex = Math.max(0, properties.length - 1);

  // Step 3: Handle logout initiation checking "Don't ask again" preference
  const handleLogoutClick = async () => {
    try {
      const skipConfirm =
        typeof window !== "undefined" &&
        localStorage.getItem("bluebrick_skip_logout_confirm") === "true";
      if (skipConfirm) {
        setIsLoggingOut(true);
        await signOutAction();
        return;
      }
    } catch (e) {
      console.warn("Could not read logout preference from localStorage", e);
    }
    setIsLogoutModalOpen(true);
  };

  // Step 4: Handle modal confirmation with optional preference persistence
  const handleConfirmLogout = async (dontAskAgain: boolean) => {
    try {
      if (dontAskAgain && typeof window !== "undefined") {
        localStorage.setItem("bluebrick_skip_logout_confirm", "true");
      }
    } catch (e) {
      console.warn("Could not save logout preference to localStorage", e);
    }
    setIsLoggingOut(true);
    await signOutAction();
  };

  // Step 3: Use pre-computed server metrics directly to eliminate client recalculation overhead
  const totalInvested = initialData.totalInvested;
  const weightedRoi = initialData.weightedRoi;
  const activeCount = initialData.activeCount;
  const concludedCount = initialData.concludedCount;

  const projectedEarnings = useMemo(
    () => properties.reduce((s: number, p: PortfolioItem) => s + p.investedAmount * (p.roi / 100), 0),
    [properties]
  );

  // Step 4: Animated count-up hook values
  const animatedTotal = useCountUp(totalInvested, { durationMs: 1400 });
  const animatedRoi = useCountUp(weightedRoi, { durationMs: 1400, decimals: 1 });

  // Step 5: Calculate allocation pie data
  const pieData = useMemo(() => {
    return properties.map((p: PortfolioItem) => ({
      name: p.propertyName,
      value: totalInvested > 0 ? Math.round((p.investedAmount / totalInvested) * 100) : 0,
    }));
  }, [properties, totalInvested]);

  const memberSinceYear = useMemo(() => {
    if (!initialData.investor.createdAt) return 2026;
    const d = new Date(initialData.investor.createdAt);
    return Number.isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
  }, [initialData.investor.createdAt]);

  function prevCard() {
    setCarouselIndex((i) => (i === 0 ? maxIndex : i - 1));
  }
  function nextCard() {
    setCarouselIndex((i) => (i === maxIndex ? 0 : i + 1));
  }

  const activeProperty: PortfolioItem | undefined = properties[carouselIndex] || properties[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 15% -10%, rgba(196,18,48,0.08), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(47,143,107,0.10), transparent), #0A1220",
        fontFamily: "'Inter', sans-serif",
        color: "#EDF1F5",
        paddingBottom: "64px",
      }}
    >
      {/* ---------- TOP NAV (STICKY & RESPONSIVE) ---------- */}
      <header className="dash-sticky-header">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <BlueBrickMark />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#EDF1F5",
            }}
          >
            {t("common.brandName")}
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Multi-language Locale Switcher */}
          <LocaleSwitcher compact />

          {/* User Profile Summary (Hidden on extra-small mobile to maintain clean single-row header) */}
          <div className="dash-user-text-container">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#EDF1F5" }}>
              {initialData.investor.firstName} {initialData.investor.lastName}
            </div>
            <div style={{ fontSize: 11, color: "#7C8A9C", fontFamily: "'JetBrains Mono', monospace" }}>
              {initialData.investor.tier} · {t("dashboard.cards.memberSince", { year: memberSinceYear })}
            </div>
          </div>

          {/* Explicit Session Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="dash-logout-btn"
            title={t("common.logout") || "Cerrar sesión"}
            aria-label={t("common.logout") || "Cerrar sesión"}
          >
            <LogOut size={16} />
          </button>

          {/* Avatar Profile Trigger */}
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#2F8F6B,#173F30)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 14,
              border: "1px solid rgba(196,18,48,0.4)",
              color: "#EDF1F5",
              cursor: "pointer",
              overflow: "hidden",
              flexShrink: 0,
            }}
            title={t("dashboard.cards.changeAvatar")}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span>
                {initialData.investor.firstName[0]}
                {initialData.investor.lastName[0]}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="dash-main-container">
        {/* ---------- HERO SECTION (RESPONSIVE STACKED ON MOBILE) ---------- */}
        <section className="dash-hero-grid">
          {/* Card 1: Patrimonio Invertido Total */}
          <div
            style={{
              background: "linear-gradient(160deg,#111B2E 0%,#0D1526 100%)",
              border: "1px solid rgba(237,241,245,0.07)",
              borderRadius: 20,
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#7C8A9C",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                }}
              >
                {t("dashboard.totalInvested")}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 500,
                  fontSize: "clamp(34px, 7vw, 56px)",
                  lineHeight: 1.1,
                  color: "#EDF1F5",
                  wordBreak: "break-word",
                }}
              >
                {formatCurrency(Math.round(animatedTotal))}
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#57B98C",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <TrendingUp size={16} />
                {t("dashboard.weightedRoi", { roi: animatedRoi.toFixed(1) })}
              </div>
            </div>

            <div className="dash-stat-chips-container">
              <StatChip icon={Activity} label={t("dashboard.activeProperties")} value={activeCount} color="#57B98C" />
              <StatChip icon={CheckCircle2} label={t("dashboard.concludedProperties")} value={concludedCount} color="#E8495F" />
              <StatChip
                icon={Wallet}
                label={t("dashboard.projectedEarnings")}
                value={formatCurrency(Math.round(projectedEarnings))}
                color="#C41230"
                wide
              />
            </div>
          </div>

          {/* Card 2: Distribución del Portafolio */}
          <div
            style={{
              background: "#111B2E",
              border: "1px solid rgba(237,241,245,0.07)",
              borderRadius: 20,
              padding: "28px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#7C8A9C",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: 16,
              }}
            >
              {t("dashboard.portfolioDistribution")}
            </div>
            <div className="dash-distribution-body">
              <div style={{ width: "100%", maxWidth: 220, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((_entry, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{
                        background: "#0A1220",
                        border: "1px solid rgba(237,241,245,0.15)",
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: "Inter, sans-serif",
                      }}
                      formatter={(v) => [`${v}%`, t("dashboard.allocation")]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                {properties.map((p: PortfolioItem, idx: number) => {
                  const allocation = totalInvested > 0 ? Math.round((p.investedAmount / totalInvested) * 100) : 0;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 3,
                          background: PIE_COLORS[idx % PIE_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: "#EDF1F5",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.propertyName}
                      </span>
                      <span style={{ color: "#7C8A9C", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                        {allocation}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- CAROUSEL (RESPONSIVE) ---------- */}
        {activeProperty && (
          <section style={{ marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 500, margin: 0 }}>
                {t("dashboard.myInvestments")}
              </h2>
              <span style={{ fontSize: 12, color: "#7C8A9C", fontFamily: "'JetBrains Mono', monospace" }}>
                {carouselIndex + 1} / {properties.length}
              </span>
            </div>

            <div style={{ position: "relative" }}>
              <div className="dash-carousel-card-grid">
                <div
                  style={{
                    background: activeProperty.gradient,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: 24,
                    position: "relative",
                    minHeight: 140,
                  }}
                >
                  <PropertyIcon
                    type={activeProperty.propertyType}
                    name={activeProperty.propertyName}
                    size={28}
                    color="rgba(237,241,245,0.85)"
                  />
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, color: "#EDF1F5", lineHeight: 1.15 }}>
                      {activeProperty.propertyName}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "rgba(237,241,245,0.75)",
                      }}
                    >
                      <MapPin size={14} />
                      {activeProperty.city}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#111B2E",
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  <StatusBadge status={activeProperty.status} />
                  <MetricRow label={t("dashboard.cards.investedAmount")} value={formatCurrency(activeProperty.investedAmount)} />
                  <MetricRow label={t("dashboard.cards.estimatedRoi")} value={`${activeProperty.roi.toFixed(1)}%`} accent="#57B98C" />
                  <MetricRow
                    label={activeProperty.status === "activa" ? t("dashboard.cards.returnDate") : t("dashboard.cards.closingDate")}
                    value={activeProperty.timing}
                    icon={Clock}
                  />
                  {activeProperty.status === "activa" && (
                    <div style={{ height: 6, borderRadius: 4, background: "rgba(237,241,245,0.08)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(8, 100 - activeProperty.monthsLeft * 10)}%`,
                          background: "linear-gradient(90deg,#2F8F6B,#57B98C)",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Construction Phase Progress with Dotted Milestone Stepper & Motion Animations */}
              <div style={{ marginTop: 16 }}>
                <ProjectPhaseProgress property={activeProperty} />
              </div>

              <button onClick={prevCard} aria-label="Anterior" style={navBtnStyle("left")}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextCard} aria-label="Siguiente" style={navBtnStyle("right")}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
              {properties.map((p: PortfolioItem, idx: number) => (
                <button
                  key={p.id}
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={`Ir a ${p.propertyName}`}
                  style={{
                    width: idx === carouselIndex ? 22 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    background: idx === carouselIndex ? "#C41230" : "rgba(237,241,245,0.18)",
                    transition: "all 0.25s ease",
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ---------- TABLE (RESPONSIVE HORIZONTAL SCROLL) ---------- */}
        <section style={{ marginTop: 44 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
            {t("dashboard.portfolioDetail")}
          </h2>
          <div className="dash-table-wrapper">
            <div className="dash-table-content">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1.3fr",
                  padding: "12px 20px",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#7C8A9C",
                  background: "rgba(237,241,245,0.03)",
                }}
              >
                <span>{t("dashboard.tableColumns.project")}</span>
                <span>{t("dashboard.tableColumns.invested")}</span>
                <span>{t("dashboard.tableColumns.roi")}</span>
                <span>{t("dashboard.tableColumns.status")}</span>
                <span>{t("dashboard.tableColumns.timing")}</span>
              </div>
              {properties.map((p: PortfolioItem, idx: number) => {
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1.3fr",
                      padding: "16px 20px",
                      fontSize: 13.5,
                      alignItems: "center",
                      borderTop: "1px solid rgba(237,241,245,0.06)",
                      background: idx % 2 === 0 ? "transparent" : "rgba(237,241,245,0.015)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <PropertyIcon type={p.propertyType} name={p.propertyName} size={16} color="#7C8A9C" />
                      {p.propertyName}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(p.investedAmount)}</span>
                    <span style={{ color: "#57B98C", fontWeight: 600 }}>{p.roi.toFixed(1)}%</span>
                    <span>
                      <StatusBadge status={p.status} compact />
                    </span>
                    <span style={{ color: "#7C8A9C" }}>{p.timing}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- OPPORTUNITIES BANNER (RESPONSIVE) ---------- */}
        <section
          style={{
            marginTop: 48,
            borderRadius: 22,
            padding: "28px",
            background: "linear-gradient(135deg,#16223B 0%,#101A2E 55%,#1F0E14 100%)",
            border: "1px solid rgba(196,18,48,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(196,18,48,0.18), transparent 70%)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Sparkles size={16} color="#E8495F" />
            <span
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#E8495F",
                fontWeight: 600,
              }}
            >
              {t("dashboard.reinvestment.badge", { name: initialData.investor.firstName })}
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(22px, 5vw, 28px)",
              fontWeight: 500,
              maxWidth: 560,
              margin: "0 0 8px 0",
              color: "#EDF1F5",
            }}
          >
            {t("dashboard.reinvestment.title")}
          </h2>
          <p style={{ color: "#7C8A9C", maxWidth: 520, fontSize: 13.5, marginBottom: 24, lineHeight: 1.5 }}>
            {t("dashboard.reinvestment.description")}
          </p>

          <div className="dash-opportunities-grid">
            {initialData.reinvestmentOpportunities.map((o: DbReinvestmentOpportunity) => (
              <div
                key={o.id}
                style={{
                  background: "rgba(10,21,18,0.5)",
                  border: "1px solid rgba(237,241,245,0.08)",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{o.title}</div>
                <div style={{ fontSize: 12, color: "#7C8A9C", marginBottom: 12 }}>{o.city}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#57B98C", fontWeight: 700 }}>
                    {t("dashboard.reinvestment.estimatedRoi", { roi: o.projectedRoi })}
                  </span>
                  <span style={{ color: "#7C8A9C", fontFamily: "'JetBrains Mono', monospace" }}>
                    {t("dashboard.reinvestment.minInvestmentFrom", { amount: formatCurrency(o.minInvestment) })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg,#E8495F,#C41230)",
              color: "#0A1220",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(196,18,48,0.25)",
            }}
          >
            {t("dashboard.reinvestment.ctaButton")}
            <ArrowUpRight size={17} />
          </button>
        </section>
      </main>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        userId={initialData.investor.id}
        onUploadSuccess={(newUrl) => setAvatarUrl(newUrl)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        isSubmitting={isLoggingOut}
      />
    </div>
  );
}
