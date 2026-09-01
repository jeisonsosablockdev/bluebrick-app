/**
 * @file apps/web/src/components/dashboard/stat-chip.tsx
 * @description Layer 1: Presentation - KPI StatChip component matching design tokens.
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Props for the StatChip presentation component.
 */
export interface StatChipProps {
  /** Lucide icon or custom React component to render */
  icon: LucideIcon | React.ComponentType<{ size?: number; color?: string }>;
  /** Label describing the metric */
  label: string;
  /** Formatted metric value or count */
  value: string | number;
  /** Optional theme color for the icon */
  color?: string;
  /** Whether the chip spans wider column ratio in flex layout */
  wide?: boolean;
}

/**
 * StatChip renders a compact KPI badge with GPU-composited hover elevation.
 *
 * @param props - StatChipProps containing icon, label, value, color, and wide flag
 * @returns React.JSX.Element
 */
export function StatChip({ icon: Icon, label, value, color, wide }: StatChipProps): React.JSX.Element {
  // Step 1: Render design-tokenized sub-chip item with responsive column spanning and GPU-accelerated hover micro-interaction
  const chipClasses = `dash-interactive-chip ${wide ? "dash-stat-chip-wide" : ""}`.trim();

  return (
    <div className={chipClasses} style={{ flex: wide ? 1.4 : 1, minWidth: 0 }}>
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
