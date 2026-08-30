/**
 * @file apps/web/src/components/dashboard/status-badge.tsx
 * @description Layer 1: Presentation - Localized StatusBadge component matching design tokens.
 */

"use client";

import React from "react";
import { useI18n } from "@/features/i18n";

export interface StatusBadgeProps {
  status: "activa" | "concluida" | string;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps): React.JSX.Element {
  // Step 1: Access localized strings
  const { t } = useI18n();

  // Step 2: Resolve active or concluded status state
  const active = status === "activa";
  const label = active ? t("dashboard.status.active") : t("dashboard.status.concluded");

  // Step 3: Render stylized pill badge with pulsing color indicator
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: compact ? 11 : 12,
        fontWeight: 600,
        padding: compact ? "4px 10px" : "6px 12px",
        borderRadius: 999,
        width: "fit-content",
        color: active ? "#57B98C" : "#E8495F",
        background: active ? "rgba(87,185,140,0.12)" : "rgba(232,73,95,0.12)",
        border: `1px solid ${active ? "rgba(87,185,140,0.3)" : "rgba(232,73,95,0.3)"}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#57B98C" : "#E8495F" }} />
      {label}
    </span>
  );
}
