/**
 * @file apps/web/src/components/landing/landing-feature-cards.tsx
 * @description Layer 1: Presentation - 2x2 Value Proposition Feature Cards Grid presenting institutional investor value pillars, private portal badge, and interactive hover elevation.
 */

"use client";

import React, { useState } from "react";
import { Handshake } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useTheme } from "@/components/theme";

/**
 * Properties for the LandingFeatureCards presentation component.
 */
export interface LandingFeatureCardsProps {
  className?: string;
}

/**
 * BricksIcon renders the 3-layer brick foundation pyramid.
 * Features spacious geometry and refined 0.85 stroke for pristine clarity.
 */
function BricksIcon({ color = "#FFFFFF", size = 46 }: { color?: string; size?: number }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="0.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-icon="bricks"
    >
      <rect x="2" y="16" width="5.6" height="4.6" rx="0.5" />
      <rect x="9.2" y="16" width="5.6" height="4.6" rx="0.5" />
      <rect x="16.4" y="16" width="5.6" height="4.6" rx="0.5" />
      <rect x="5.6" y="10.2" width="5.6" height="4.6" rx="0.5" />
      <rect x="12.8" y="10.2" width="5.6" height="4.6" rx="0.5" />
      <rect x="9.2" y="4.4" width="5.6" height="4.6" rx="0.5" />
    </svg>
  );
}

/**
 * PerformanceChartIcon renders the upward growth chart matching the user's uploaded vector reference.
 * Features a bottom foundation platform, 4 volume bars with dynamic valley,
 * an upward trendline soaring strictly above the bars, and a chevron directional arrowhead.
 * Fully theme-adaptive with dynamic fill color.
 */
function PerformanceChartIcon({ color = "#FFFFFF", size = 46 }: { color?: string; size?: number }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      data-icon="performance"
    >
      <g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" fill={color} stroke="none">
        <path d="M9155 10221 c-117 -53 -150 -199 -69 -307 44 -59 79 -68 282 -74 l182 -5 -1745 -1745 -1744 -1744 -1120 1119 c-616 615 -1133 1126 -1148 1134 -37 19 -130 18 -168 -2 -41 -21 -3585 -3568 -3607 -3609 -39 -74 -10 -182 64 -242 44 -34 122 -46 184 -26 32 10 344 317 1741 1713 l1703 1702 1127 -1127 c1093 -1091 1129 -1126 1175 -1136 51 -10 107 -4 148 17 14 7 847 835 1853 1840 l1827 1826 0 -169 c0 -194 9 -235 60 -286 94 -94 250 -69 312 49 l28 53 0 439 0 440 -25 49 c-16 32 -41 60 -67 77 l-42 28 -455 2 c-426 3 -459 2 -496 -16z" />
        <path d="M7859 6546 c-55 -19 -95 -52 -115 -93 -18 -37 -19 -129 -22 -3046 l-2 -3007 -200 0 -200 0 -2 2228 -3 2227 -27 45 c-16 28 -43 55 -70 70 l-43 25 -835 3 c-617 2 -846 0 -878 -9 -54 -15 -117 -76 -131 -126 -8 -26 -11 -724 -11 -2250 l0 -2213 -200 0 -200 0 -2 2698 -3 2697 -27 45 c-16 28 -43 55 -70 70 l-43 25 -856 0 -856 0 -48 -30 c-30 -19 -56 -45 -69 -70 l-21 -40 -3 -2697 -2 -2698 -200 0 -200 0 -2 1588 -3 1587 -25 43 c-15 27 -42 54 -70 70 l-45 27 -835 3 c-617 2 -846 0 -878 -9 -54 -15 -114 -73 -130 -125 -9 -32 -12 -402 -12 -1612 l0 -1570 -194 -4 -194 -3 -44 -30 c-132 -92 -110 -288 41 -351 29 -12 749 -14 4991 -14 l4958 0 53 28 c43 22 59 38 81 81 16 30 28 69 28 90 0 58 -42 135 -91 168 -42 28 -43 28 -236 31 l-193 4 -2 3006 -3 3007 -25 43 c-15 27 -42 54 -70 70 l-45 27 -840 2 c-670 2 -847 0 -876 -11z m1461 -3266 l0 -2880 -600 0 -600 0 0 2880 0 2880 600 0 600 0 0 -2880z m-4800 -310 l0 -2570 -600 0 -600 0 0 2570 0 2570 600 0 600 0 0 -2570z m2400 -470 l0 -2100 -600 0 -600 0 0 2100 0 2100 600 0 600 0 0 -2100z m-4800 -640 l0 -1460 -600 0 -600 0 0 1460 0 1460 600 0 600 0 0 -1460z" />
      </g>
    </svg>
  );
}

/**
 * CoinsDistributionIcon renders the capital distribution receiving hand with coins,
 * extracted directly from the user's vector reference specification.
 * Fully theme-adaptive with dynamic fill color.
 */
function CoinsDistributionIcon({ color = "#FFFFFF", size = 46 }: { color?: string; size?: number }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      data-icon="distributions"
    >
      <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill={color} stroke="none">
        <path d="M2478 4450 c-264 -48 -475 -237 -554 -495 -28 -93 -26 -287 4 -385 58 -186 186 -336 357 -421 91 -44 178 -69 245 -69 25 0 50 -4 55 -8 6 -4 28 -43 50 -87 57 -115 178 -236 295 -293 116 -57 194 -76 315 -76 121 0 199 19 315 76 120 59 239 178 298 298 57 115 75 194 75 315 0 121 -18 200 -75 315 -33 68 -59 102 -127 171 -122 121 -253 184 -431 204 l-55 6 -45 87 c-80 157 -231 283 -405 338 -88 28 -236 39 -317 24z m225 -155 c141 -30 295 -142 360 -262 l27 -51 -52 -17 c-171 -56 -331 -191 -406 -345 -53 -108 -74 -192 -76 -304 l-1 -88 -45 5 c-113 14 -228 75 -314 168 -247 266 -168 686 158 851 108 55 226 69 349 43z m682 -467 c176 -45 334 -205 385 -388 16 -58 16 -212 0 -270 -51 -185 -203 -337 -390 -391 -74 -21 -224 -16 -300 10 -168 58 -289 178 -348 345 -34 97 -35 241 -3 336 96 277 376 431 656 358z" />
        <path d="M2500 4114 c-147 -40 -251 -160 -266 -311 -6 -57 -5 -63 19 -87 15 -15 37 -26 52 -26 35 0 75 42 75 78 0 105 82 193 196 209 60 8 87 31 87 73 0 24 -7 40 -27 57 -31 26 -58 28 -136 7z" />
        <path d="M3189 3660 c-154 -26 -274 -148 -299 -303 -13 -82 13 -127 73 -127 35 0 63 38 76 104 19 99 78 158 178 178 68 13 103 40 103 80 0 27 -30 68 -49 68 -5 0 -15 2 -23 4 -7 2 -34 0 -59 -4z" />
        <path d="M3483 3358 c-11 -13 -25 -49 -31 -81 -20 -100 -79 -159 -178 -178 -66 -13 -104 -41 -104 -76 0 -60 45 -86 128 -72 153 24 277 147 301 299 14 85 -11 130 -72 130 -13 0 -33 -10 -44 -22z" />
        <path d="M72 3270 c-18 -11 -41 -34 -52 -52 -19 -32 -20 -52 -20 -581 l0 -548 25 -24 c31 -32 69 -32 100 0 l25 24 0 526 0 525 210 0 210 0 0 -860 0 -860 -210 0 -210 0 0 185 c0 184 0 186 -25 210 -31 32 -69 32 -100 0 -25 -24 -25 -25 -25 -227 0 -228 6 -255 71 -293 32 -19 52 -20 294 -20 256 0 260 0 293 23 51 37 62 68 62 182 l0 102 148 -4 c113 -3 154 -7 177 -20 17 -9 170 -144 340 -299 496 -452 517 -471 572 -505 28 -19 87 -46 130 -61 l78 -28 503 -3 c573 -3 570 -4 705 76 95 56 117 84 98 130 -14 34 -57 57 -87 45 -10 -4 -55 -28 -99 -53 l-80 -45 -480 -3 c-529 -3 -571 0 -670 57 -27 16 -239 201 -470 411 -510 465 -476 443 -707 448 l-158 4 0 670 0 670 308 -5 c270 -4 317 -7 388 -25 110 -28 244 -88 330 -145 39 -26 214 -178 390 -338 175 -159 333 -298 349 -307 27 -15 85 -18 555 -22 l525 -5 51 -27 c225 -119 217 -435 -15 -542 -45 -21 -58 -21 -729 -26 -662 -5 -684 -6 -698 -24 -23 -33 -18 -82 12 -105 26 -21 34 -21 683 -21 709 0 713 0 819 54 135 69 242 231 242 369 l0 42 308 177 c324 187 371 206 459 194 103 -14 192 -77 241 -171 21 -41 26 -64 26 -130 1 -68 -3 -89 -27 -137 -15 -31 -44 -71 -65 -90 -20 -18 -298 -183 -617 -367 -319 -183 -590 -345 -603 -358 -30 -33 -28 -59 8 -95 24 -24 36 -29 57 -23 14 3 233 126 487 272 254 147 517 299 586 337 233 132 330 268 330 464 0 308 -334 534 -619 419 -46 -19 -483 -264 -577 -324 -20 -13 -23 -11 -52 39 -35 62 -121 147 -180 177 -96 49 -124 51 -647 51 l-490 1 -295 270 c-162 148 -329 296 -371 327 -85 66 -242 149 -339 181 -152 49 -190 53 -527 58 -178 3 -323 9 -323 14 0 4 -17 20 -37 34 l-38 25 -260 0 c-242 0 -262 -1 -293 -20z" />
      </g>
    </svg>
  );
}

/**
 * LandingFeatureCards renders the 2x2 informative cards grid showcasing BlueBrick's core investment value pillars.
 */
export function LandingFeatureCards({ className = "" }: LandingFeatureCardsProps = {}): React.JSX.Element {
  // Step 1: Access localized translation strings and active theme
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Step 2: Track hover state for microanimations
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Step 3: Theme-adaptive tokens matching luxury design guidelines with subtle complementary green gradient
  const cardBg = isDark
    ? "linear-gradient(160deg, #111B2E 0%, #0E1B28 55%, rgba(87, 185, 140, 0.12) 100%)"
    : "linear-gradient(160deg, #FFFFFF 0%, #F5FAF7 60%, rgba(47, 143, 107, 0.10) 100%)";
  const cardBorderBase = isDark ? "rgba(237, 241, 245, 0.08)" : "rgba(10, 18, 32, 0.08)";
  const cardBorderHover = isDark ? "rgba(87, 185, 140, 0.35)" : "rgba(47, 143, 107, 0.35)";
  const cardShadowBase = isDark ? "0 8px 24px rgba(0, 0, 0, 0.3)" : "0 8px 20px rgba(10, 18, 32, 0.04)";
  const cardShadowHover = isDark
    ? "0 14px 28px rgba(0, 0, 0, 0.45), 0 0 18px rgba(87, 185, 140, 0.15)"
    : "0 14px 28px rgba(10, 18, 32, 0.08), 0 0 18px rgba(47, 143, 107, 0.12)";
  const titleColor = isDark ? "#EDF1F5" : "#0A1220";
  const subtitleColor = isDark ? "#8E9BAE" : "#4A5568";
  const accentColor = isDark ? "#57B98C" : "#2F8F6B";
  const iconColor = isDark ? "#FFFFFF" : "#0A1220";

  const getCardStyle = (index: number): React.CSSProperties => {
    const isHovered = hoveredCard === index;
    return {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: 172,
      minWidth: 0,
      padding: "20px 16px",
      borderRadius: 22,
      background: cardBg,
      border: `1px solid ${isHovered ? cardBorderHover : cardBorderBase}`,
      boxShadow: isHovered ? cardShadowHover : cardShadowBase,
      transform: isHovered ? "translateY(-4px)" : "translateY(0)",
      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease",
      userSelect: "none",
      boxSizing: "border-box",
    };
  };

  // Step 4: Render 2x2 grid container
  return (
    <section
      aria-label="Investment Pillars"
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        width: "100%",
        maxWidth: 460,
        boxSizing: "border-box",
      }}
    >
      {/* Card 1: Acceso Exclusivo + Private Portal Badge */}
      <div
        data-feature-card="exclusive"
        onMouseEnter={() => setHoveredCard(1)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(1)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <BricksIcon color={iconColor} size={46} />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              background: isDark ? "rgba(87, 185, 140, 0.14)" : "rgba(47, 143, 107, 0.1)",
              padding: "3px 8px",
              fontSize: 10.5,
              fontWeight: 600,
              color: accentColor,
              border: isDark ? "1px solid rgba(87, 185, 140, 0.28)" : "1px solid rgba(47, 143, 107, 0.25)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {t("loginCard.privatePortalBadge")}
          </span>
        </div>
        <div style={{ marginTop: 14 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: titleColor,
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            {t("landing.cardExclusiveAccessTitle")}
          </h2>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: 13,
              lineHeight: 1.35,
              color: subtitleColor,
            }}
          >
            {t("landing.cardExclusiveAccessSubtitle")}
          </p>
        </div>
      </div>

      {/* Card 2: Consultar Rendimiento */}
      <div
        data-feature-card="performance"
        onMouseEnter={() => setHoveredCard(2)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(2)}
      >
        <div>
          <PerformanceChartIcon color={iconColor} size={46} />
        </div>
        <div style={{ marginTop: 14 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: titleColor,
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            {t("landing.cardPerformanceTitle")}
          </h2>
        </div>
      </div>

      {/* Card 3: Monitorear Distribuciones */}
      <div
        data-feature-card="distributions"
        onMouseEnter={() => setHoveredCard(3)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(3)}
      >
        <div>
          <CoinsDistributionIcon color={iconColor} size={46} />
        </div>
        <div style={{ marginTop: 14 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: titleColor,
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            {t("landing.cardDistributionsTitle")}
          </h2>
        </div>
      </div>

      {/* Card 4: Reinvertir Capital */}
      <div
        data-feature-card="reinvest"
        onMouseEnter={() => setHoveredCard(4)}
        onMouseLeave={() => setHoveredCard(null)}
        style={getCardStyle(4)}
      >
        <div>
          <Handshake size={46} color={iconColor} data-icon="reinvest" strokeWidth={0.85} />
        </div>
        <div style={{ marginTop: 14 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: titleColor,
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
            }}
          >
            {t("landing.cardReinvestTitle")}
          </h2>
        </div>
      </div>
    </section>
  );
}

