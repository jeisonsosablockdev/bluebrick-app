/**
 * @file apps/web/src/components/dashboard/metric-row.tsx
 * @description Layer 1: Presentation - MetricRow component matching design tokens.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

export interface MetricRowProps {
  label: string;
  value: string | number;
  accent?: string;
  icon?: LucideIcon | React.ComponentType<{ size?: number }>;
}

export function MetricRow({ label, value, accent, icon: Icon }: MetricRowProps): React.JSX.Element {
  // Step 1: Render exact design-tokenized row
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12.5, color: "#7C8A9C", display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 600, color: accent || "#EDF1F5", fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </span>
    </div>
  );
}
