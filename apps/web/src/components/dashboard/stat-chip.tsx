/**
 * @file apps/web/src/components/dashboard/stat-chip.tsx
 * @description Layer 1: Presentation - KPI StatChip component matching design tokens.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

export interface StatChipProps {
  icon: LucideIcon | React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string | number;
  color?: string;
  wide?: boolean;
}

export function StatChip({ icon: Icon, label, value, color, wide }: StatChipProps): React.JSX.Element {
  // Step 1: Render design-tokenized sub-chip item with responsive column spanning
  return (
    <div className={wide ? "dash-stat-chip-wide" : ""} style={{ flex: wide ? 1.4 : 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color, marginBottom: 4 }}>
        <Icon size={14} />
        <span style={{ fontSize: 11, color: "#7C8A9C", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "#EDF1F5", fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
    </div>
  );
}
