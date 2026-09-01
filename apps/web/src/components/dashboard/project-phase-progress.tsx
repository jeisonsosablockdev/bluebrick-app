/**
 * @file apps/web/src/components/dashboard/project-phase-progress.tsx
 * @description Layer 1: Presentation - Real-time Project Construction Phase Progress Component.
 * Features an animated dotted milestone stepper powered by Motion, responsive media preview,
 * phase status tracking, and theme-adaptive luxury styling.
 * 
 * Supports dynamic project phases (e.g. 14 phases from DASH-BOARD Excel workbook).
 * If property has NO phases, renders as completely full (100% completado) per user requirement.
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Image as ImageIcon, Check } from "lucide-react";
import { useTheme } from "@/components/theme";
import type { PortfolioItem } from "@/lib/types/db";

export interface ProjectPhaseProgressProps {
  readonly property: PortfolioItem;
  readonly className?: string;
}

interface UiPhase {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly status: "Completada" | "En curso" | "Pendiente" | "No aplica";
  readonly images: string[];
}

const DEFAULT_PHASES: readonly UiPhase[] = [
  "Estudios y licencias de construcción",
  "Excavación y preparación del terreno",
  "Cimentación y zapatas estructurales",
  "Levantamiento de columnas y vigas",
  "Losa de entrepisos y placas",
  "Construcción de estructuras y muros",
  "Redes hidrosanitarias y eléctricas",
  "Cerramientos y carpintería exterior",
  "Acabados interiores y revestimientos",
  "Equipamiento de zonas comunes",
  "Pruebas de calidad y habitabilidad",
  "Entrega de llaves y escrituración",
].map((name, i) => ({
  id: i + 1,
  name,
  description: "Fase de obra completada según cronograma",
  status: "Completada",
  images: [],
}));

const PHASE_THEME_TOKENS = {
  Completada: {
    color: "#57B98C",
    bgDark: "rgba(87, 185, 140, 0.16)",
    bgLight: "rgba(47, 143, 107, 0.12)",
    borderDark: "rgba(87, 185, 140, 0.32)",
    borderLight: "rgba(47, 143, 107, 0.25)",
  },
  "En curso": {
    color: "#E8495F",
    bgDark: "rgba(232, 73, 95, 0.16)",
    bgLight: "rgba(196, 18, 48, 0.12)",
    borderDark: "rgba(232, 73, 95, 0.32)",
    borderLight: "rgba(196, 18, 48, 0.25)",
  },
  default: {
    color: "#7C8A9C",
    bgDark: "rgba(124, 138, 156, 0.14)",
    bgLight: "rgba(10, 18, 32, 0.08)",
    borderDark: "rgba(124, 138, 156, 0.28)",
    borderLight: "rgba(10, 18, 32, 0.16)",
  },
} as const;

/**
 * ProjectPhaseProgress renders an interactive, animated phase progress stepper with dots.
 */
export function ProjectPhaseProgress({ property, className = "" }: ProjectPhaseProgressProps): React.JSX.Element {
  // Step 1: Access active theme
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Step 2: Determine if dynamic phases exist or fallback to 100% full
  const hasDynamicPhases = Array.isArray(property.phases) && property.phases.length > 0;

  const uiPhases: readonly UiPhase[] = hasDynamicPhases
    ? property.phases!.map((p) => ({
        id: p.order,
        name: p.name,
        description: p.startDate ? `Inicio: ${p.startDate}${p.endDate ? ` · Fin: ${p.endDate}` : ""}` : `Estado: ${p.status}`,
        status: p.status,
        images: p.images || [],
      }))
    : DEFAULT_PHASES;

  const totalPhases = uiPhases.length;
  const isConcluded = property.status === "concluida" || !hasDynamicPhases;

  // Step 3: Compute default active phase index (Ponytail shrink: lean declarative resolution)
  const inProgressIndex = uiPhases.findIndex((p) => p.status === "En curso");
  const defaultActiveIndex = !hasDynamicPhases || isConcluded
    ? totalPhases - 1
    : inProgressIndex !== -1
    ? inProgressIndex
    : Math.max(0, uiPhases.findLastIndex((p) => p.status === "Completada"));

  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number>(defaultActiveIndex);
  const [hoveredDotIndex, setHoveredDotIndex] = useState<number | null>(null);

  // Step 3.1: Synchronize active phase selection when property changes in carousel
  useEffect(() => {
    setSelectedPhaseIndex(defaultActiveIndex);
    setHoveredDotIndex(null);
  }, [defaultActiveIndex, property.id, property.propertyId]);

  const activePhaseIndex = Math.min(selectedPhaseIndex, totalPhases - 1);
  const currentPhase = uiPhases[activePhaseIndex] ?? uiPhases[0]!;
  const currentPhaseNumber = activePhaseIndex + 1;

  // Step 4: Calculate completion percentage declaratively
  const completionPercentage = (() => {
    if (!hasDynamicPhases || property.status === "concluida") return 100;
    if (property.phaseProgressPct != null) {
      const rawPct = Number(property.phaseProgressPct);
      return Math.round(rawPct <= 1 ? rawPct * 100 : rawPct);
    }
    const completedCount = uiPhases.filter((p) => p.status === "Completada").length;
    return Math.round((completedCount / totalPhases) * 100);
  })();

  // Step 5: Color tokens
  const containerBg = isDark ? "rgba(10, 18, 32, 0.7)" : "rgba(248, 250, 252, 0.9)";
  const containerBorder = isDark ? "1px solid rgba(237, 241, 245, 0.08)" : "1px solid rgba(10, 18, 32, 0.08)";
  const trackBg = isDark ? "rgba(237, 241, 245, 0.12)" : "rgba(10, 18, 32, 0.12)";
  const textTitleColor = isDark ? "#EDF1F5" : "#0A1220";
  const textMutedColor = isDark ? "#7C8A9C" : "#718096";

  const isCurrentActive = hasDynamicPhases && !isConcluded && currentPhase.status === "En curso";
  const statusLabel = isConcluded ? "Completado" : isCurrentActive ? "En curso" : currentPhase.status;

  // Step 5.1: Dynamic media carousel state for the active phase
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isHoveredOnMedia, setIsHoveredOnMedia] = useState<boolean>(false);

  const phaseImages: readonly string[] = currentPhase.images || [];
  const hasMultipleImages = phaseImages.length > 1;
  const hasAnyImage = phaseImages.length > 0;

  // Reset active image index when selected phase or property changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [currentPhase.id, property.id, property.propertyId]);

  // Automatic cycling timer (cambio automático de imágenes cada 4s) when multiple images exist
  useEffect(() => {
    if (!hasMultipleImages || isHoveredOnMedia) return;

    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % phaseImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [hasMultipleImages, isHoveredOnMedia, phaseImages.length]);

  const safeImageIndex = hasAnyImage ? Math.min(activeImageIndex, phaseImages.length - 1) : 0;
  const currentPhoto = hasAnyImage ? phaseImages[safeImageIndex] : null;

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
      {/* Step 6: Header - Title and Progress Percentage */}
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

      {/* Step 7: Horizontal Dotted Milestone Stepper Track */}
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
          animate={{
            width: isConcluded || !hasDynamicPhases ? "100%" : `${Math.min(100, Math.max(0, completionPercentage))}%`,
          }}
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
          {uiPhases.map((phase, idx) => {
            const isCompleted = isConcluded || !hasDynamicPhases || phase.status === "Completada";
            const isCurrent = !isCompleted && (phase.status === "En curso" || idx === activePhaseIndex);
            const phaseStatusLabel = isConcluded || !hasDynamicPhases ? "Completada" : phase.status || "Pendiente";
            const token = PHASE_THEME_TOKENS[phaseStatusLabel as keyof typeof PHASE_THEME_TOKENS] ?? PHASE_THEME_TOKENS.default;

            const badgeColor = token.color;
            const badgeBg = isDark ? token.bgDark : token.bgLight;
            const badgeBorder = isDark ? token.borderDark : token.borderLight;

            const dotBg = isCompleted
              ? "#57B98C"
              : isCurrent
              ? "#E8495F"
              : isDark
              ? "rgba(237, 241, 245, 0.25)"
              : "rgba(10, 18, 32, 0.25)";

            const dotBorder = isCurrent ? (isDark ? "2px solid #FFFFFF" : "2px solid #0A1220") : "2px solid transparent";

            return (
              <button
                key={phase.id}
                type="button"
                data-testid="phase-dot"
                onClick={() => setSelectedPhaseIndex(idx)}
                onMouseEnter={() => setHoveredDotIndex(idx)}
                onMouseLeave={() => setHoveredDotIndex(null)}
                onFocus={() => setHoveredDotIndex(idx)}
                onBlur={() => setHoveredDotIndex(null)}
                aria-label={`Fase ${phase.id}: ${phase.name} - ${phaseStatusLabel}`}
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
                {/* Floating Tooltip: Line 1 (Arriba): nombre_fase, Line 2 (Abajo): estado */}
                <AnimatePresence>
                  {hoveredDotIndex === idx && (
                    <motion.div
                      data-testid="phase-dot-tooltip"
                      role="tooltip"
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 3, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 9px)",
                        left: idx === 0 ? "0%" : idx === totalPhases - 1 ? "auto" : "50%",
                        right: idx === totalPhases - 1 ? "0%" : "auto",
                        transform: idx === 0 || idx === totalPhases - 1 ? "none" : "translateX(-50%)",
                        pointerEvents: "none",
                        zIndex: 60,
                        minWidth: 140,
                        maxWidth: 240,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: isDark ? "rgba(10, 18, 32, 0.96)" : "rgba(255, 255, 255, 0.98)",
                        border: isDark ? "1px solid rgba(237, 241, 245, 0.18)" : "1px solid rgba(10, 18, 32, 0.15)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        textAlign: "center",
                        alignItems: "center",
                      }}
                    >
                      {/* Arriba: nombre_fase */}
                      <div
                        data-testid="phase-dot-tooltip-name"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: textTitleColor,
                          fontFamily: "'Space Grotesk', sans-serif",
                          whiteSpace: "nowrap",
                          lineHeight: 1.2,
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        {phase.name}
                      </div>

                      {/* Abajo: estado */}
                      <div
                        data-testid="phase-dot-tooltip-status"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            padding: "2px 8px",
                            borderRadius: 4,
                            color: badgeColor,
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {phaseStatusLabel}
                        </span>
                      </div>

                      {/* Arrow */}
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: idx === 0 ? "10px" : idx === totalPhases - 1 ? "auto" : "50%",
                          right: idx === totalPhases - 1 ? "10px" : "auto",
                          transform: idx === 0 || idx === totalPhases - 1 ? "none" : "translateX(-50%)",
                          width: 0,
                          height: 0,
                          borderLeft: "5px solid transparent",
                          borderRight: "5px solid transparent",
                          borderTop: `5px solid ${isDark ? "rgba(10, 18, 32, 0.96)" : "rgba(255, 255, 255, 0.98)"}`,
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={
                    isCurrent
                      ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 2 } }
                      : { scale: 1 }
                  }
                  whileHover={{ scale: 1.32 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
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
                    transform: "translateZ(0)",
                    willChange: "transform",
                  }}
                >
                  {isCompleted && <Check size={7} color="#FFFFFF" strokeWidth={3} />}
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 8: Phase Description & Media Card Grid */}
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
                background: isConcluded || statusLabel === "Completado"
                  ? "rgba(87, 185, 140, 0.12)"
                  : "rgba(232, 73, 95, 0.12)",
                color: isConcluded || statusLabel === "Completado" ? "#57B98C" : "#E8495F",
                border: isConcluded || statusLabel === "Completado"
                  ? "1px solid rgba(87, 185, 140, 0.3)"
                  : "1px solid rgba(232, 73, 95, 0.3)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isConcluded || statusLabel === "Completado" ? "#57B98C" : "#E8495F",
                }}
              />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Right Column: Media Preview Card with hardware-accelerated hover zoom */}
        <motion.div
          onMouseEnter={() => setIsHoveredOnMedia(true)}
          onMouseLeave={() => setIsHoveredOnMedia(false)}
          whileHover={{ scale: 1.025, y: -2 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          style={{
            borderRadius: 12,
            background: "linear-gradient(135deg, #1C4D38 0%, #0F3124 100%)",
            border: "1px solid rgba(87, 185, 140, 0.3)",
            padding: "18px 14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: 110,
            gap: 8,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            position: "relative",
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <ImageIcon size={22} color="rgba(237, 241, 245, 0.85)" />
            {hasMultipleImages && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(237, 241, 245, 0.8)",
                  background: "rgba(0, 0, 0, 0.35)",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {safeImageIndex + 1}/{phaseImages.length}
              </span>
            )}
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#EDF1F5",
              maxWidth: 220,
              lineHeight: 1.3,
            }}
          >
            {hasMultipleImages
              ? `${currentPhase.name} · foto ${safeImageIndex + 1} de ${phaseImages.length}`
              : currentPhoto
              ? `${currentPhase.name} · foto avance`
              : `${currentPhase.name} · avance 1`}
          </span>

          {/* Carousel dots indicator — ONLY rendered if there are multiple images */}
          {hasMultipleImages && (
            <div
              data-testid="phase-images-pagination"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 4,
                zIndex: 5,
              }}
            >
              {phaseImages.map((_, imgIdx) => {
                const isActive = imgIdx === safeImageIndex;
                return (
                  <button
                    key={imgIdx}
                    type="button"
                    data-testid={`phase-image-dot-${imgIdx}`}
                    aria-label={`Ver imagen ${imgIdx + 1} de ${phaseImages.length}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(imgIdx);
                    }}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      width: isActive ? 14 : 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: isActive ? "#E8495F" : "rgba(237, 241, 245, 0.35)",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

