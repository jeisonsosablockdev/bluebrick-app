/**
 * @file apps/web/src/components/dashboard/project-phase-progress.tsx
 * @description Layer 1: Presentation - Real-time Project Construction Phase Progress Component.
 * Features an animated dotted milestone stepper powered by Motion, responsive media preview,
 * phase status tracking, and theme-adaptive luxury styling.
 */

"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Camera, Image as ImageIcon, Check } from "lucide-react";
import { useTheme } from "@/components/theme";
import type { PortfolioItem } from "@/lib/types/db";

export interface ProjectPhaseProgressProps {
  readonly property: PortfolioItem;
  readonly className?: string;
}

interface PhaseDefinition {
  readonly id: number;
  readonly name: string;
  readonly description: string;
}

const DEFAULT_PHASES: readonly PhaseDefinition[] = [
  { id: 1, name: "Estudios y licencias de construcción", description: "Aprobación de planos y permisos ambientales" },
  { id: 2, name: "Excavación y preparación del terreno", description: "Movimiento de tierras y estabilización de taludes" },
  { id: 3, name: "Cimentación y zapatas estructurales", description: "Fundición de pilotes y losa de cimentación" },
  { id: 4, name: "Levantamiento de columnas y vigas", description: "Armado de acero y vaciado de concreto estructural" },
  { id: 5, name: "Losa de entrepisos y placas", description: "Vaciado de placas intermedias y ductos técnicos" },
  { id: 6, name: "Construcción de estructuras y muros", description: "Mampostería perimetral y divisiones estructurales" },
  { id: 7, name: "Redes hidrosanitarias y eléctricas", description: "Instalación de tuberías, ductos y tableros eléctricos" },
  { id: 8, name: "Cerramientos y carpintería exterior", description: "Ventanería, fachadas ventiladas y aislamiento" },
  { id: 9, name: "Acabados interiores y revestimientos", description: "Pisos, estuco, pintura e iluminación arquitectónica" },
  { id: 10, name: "Equipamiento de zonas comunes", description: "Instalación de ascensores, lobby y áreas sociales" },
  { id: 11, name: "Pruebas de calidad y habitabilidad", description: "Inspecciones técnicas y certificaciones de servicio" },
  { id: 12, name: "Entrega de llaves y escrituración", description: "Puesta en marcha y liquidación de rendimientos" },
];

/**
 * ProjectPhaseProgress renders an interactive, animated phase progress stepper with dots.
 */
export function ProjectPhaseProgress({ property, className = "" }: ProjectPhaseProgressProps): React.JSX.Element {
  // Step 1: Access active theme
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Step 2: Calculate active phase and percentage based on property state
  const totalPhases = DEFAULT_PHASES.length;
  const isConcluded = property.status === "concluida";

  const rawActivePhaseIndex = isConcluded
    ? totalPhases - 1
    : Math.max(0, Math.min(totalPhases - 1, totalPhases - Math.max(1, Math.floor(property.monthsLeft * 0.9))));

  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number>(rawActivePhaseIndex);

  const activePhaseIndex = selectedPhaseIndex;
  const currentPhaseNumber = activePhaseIndex + 1;
  const currentPhase = DEFAULT_PHASES[activePhaseIndex] ?? DEFAULT_PHASES[0]!;

  const completionPercentage = isConcluded
    ? 100
    : Math.round(((activePhaseIndex + 1) / totalPhases) * 100);

  // Step 3: Color tokens
  const containerBg = isDark ? "rgba(10, 18, 32, 0.7)" : "rgba(248, 250, 252, 0.9)";
  const containerBorder = isDark ? "1px solid rgba(237, 241, 245, 0.08)" : "1px solid rgba(10, 18, 32, 0.08)";
  const trackBg = isDark ? "rgba(237, 241, 245, 0.12)" : "rgba(10, 18, 32, 0.12)";
  const textTitleColor = isDark ? "#EDF1F5" : "#0A1220";
  const textMutedColor = isDark ? "#7C8A9C" : "#718096";

  return (
    <div
      className={className}
      style={{
        background: containerBg,
        border: containerBorder,
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Step 4: Header - Title and Progress Percentage */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Camera size={15} color={isDark ? "#E8495F" : "#C41230"} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'Space Grotesk', sans-serif",
              color: isDark ? "#E8495F" : "#C41230",
            }}
          >
            AVANCE DE OBRA POR FASES
          </span>
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: textMutedColor,
          }}
        >
          {completionPercentage}% completado
        </div>
      </div>

      {/* Step 5: Horizontal Dotted Milestone Stepper Track */}
      <div style={{ position: "relative", width: "100%", padding: "10px 0" }}>
        {/* Background track line */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 4,
            transform: "translateY(-50%)",
            background: trackBg,
            borderRadius: 2,
            zIndex: 1,
          }}
        />

        {/* Animated Active fill line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(activePhaseIndex / (totalPhases - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            height: 4,
            transform: "translateY(-50%)",
            background: "linear-gradient(90deg, #2F8F6B, #57B98C)",
            borderRadius: 2,
            zIndex: 2,
          }}
        />

        {/* Milestone Dots */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            zIndex: 3,
          }}
        >
          {DEFAULT_PHASES.map((phase, idx) => {
            const isCompleted = idx < activePhaseIndex;
            const isCurrent = idx === activePhaseIndex;

            let dotBg = isDark ? "rgba(237, 241, 245, 0.25)" : "rgba(10, 18, 32, 0.25)";
            let dotBorder = "2px solid transparent";

            if (isCompleted) {
              dotBg = "#57B98C";
            } else if (isCurrent) {
              dotBg = "#E8495F";
              dotBorder = isDark ? "2px solid #FFFFFF" : "2px solid #0A1220";
            }

            return (
              <button
                key={phase.id}
                type="button"
                data-testid="phase-dot"
                onClick={() => setSelectedPhaseIndex(idx)}
                title={`Fase ${phase.id}: ${phase.name}`}
                aria-label={`Fase ${phase.id}: ${phase.name}`}
                style={{
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={
                    isCurrent
                      ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 2 } }
                      : { scale: 1 }
                  }
                  style={{
                    width: isCurrent ? 14 : 10,
                    height: isCurrent ? 14 : 10,
                    borderRadius: "50%",
                    backgroundColor: dotBg,
                    border: dotBorder,
                    boxShadow: isCurrent ? "0 0 10px rgba(232, 73, 95, 0.7)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isCompleted && <Check size={7} color="#FFFFFF" strokeWidth={3} />}
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 6: Phase Description & Media Card Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          alignItems: "center",
        }}
      >
        {/* Left Column: Phase Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: textMutedColor, fontFamily: "'JetBrains Mono', monospace" }}>
            Fase {currentPhaseNumber} de {totalPhases}
          </div>

          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: textTitleColor,
              lineHeight: 1.25,
            }}
          >
            {currentPhase.name}
          </div>

          <div style={{ fontSize: 12, color: textMutedColor, lineHeight: 1.4 }}>
            {currentPhase.description}
          </div>

          <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: isConcluded
                  ? "rgba(87, 185, 140, 0.12)"
                  : "rgba(232, 73, 95, 0.12)",
                color: isConcluded ? "#57B98C" : "#E8495F",
                border: isConcluded
                  ? "1px solid rgba(87, 185, 140, 0.3)"
                  : "1px solid rgba(232, 73, 95, 0.3)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isConcluded ? "#57B98C" : "#E8495F",
                }}
              />
              {isConcluded ? "Completado" : "En curso"}
            </span>
          </div>
        </div>

        {/* Right Column: Media Preview Card */}
        <div
          style={{
            borderRadius: 12,
            background: "linear-gradient(135deg, #1C4D38 0%, #0F3124 100%)",
            border: "1px solid rgba(87, 185, 140, 0.3)",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: 110,
            gap: 8,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
          }}
        >
          <ImageIcon size={24} color="rgba(237, 241, 245, 0.85)" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#EDF1F5",
              maxWidth: 220,
            }}
          >
            {currentPhase.name} · avance 1
          </span>

          {/* Carousel dots indicator */}
          <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
            <span style={{ width: 14, height: 4, borderRadius: 2, background: "#E8495F" }} />
            <span style={{ width: 4, height: 4, borderRadius: 2, background: "rgba(237, 241, 245, 0.3)" }} />
            <span style={{ width: 4, height: 4, borderRadius: 2, background: "rgba(237, 241, 245, 0.3)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
