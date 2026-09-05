/**
 * @file apps/web/src/features/i18n/presentation/components/flag-icons.tsx
 * @description Layer 1: Presentation - High-Fidelity Vector SVG Flag Icons for Supported Locales.
 * Renders resolution-independent national flags for Spain (es), United States (en), and Brazil (pt).
 * 
 * Invariants:
 * - Pure SVG components with strict viewBox aspect ratios and rounded border masks.
 * - Zero external asset or network dependencies.
 * - Accessible title and decorative role support.
 */

"use client";

import React from "react";
import type { SupportedLocale } from "../../domain/models/locale-types";

export interface FlagIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width in pixels. Defaults to 20. */
  readonly width?: number;
  /** Height in pixels. Defaults to 14. */
  readonly height?: number;
  /** Optional accessible title for screen readers. */
  readonly title?: string;
  /** Visual radius for pill or rounded rect styling. Defaults to 3. */
  readonly borderRadius?: number;
}

/**
 * SpainFlag renders the official national flag of Spain (Bandera de España).
 * 
 * @param props Component properties controlling dimensions and title.
 * @returns React.JSX.Element
 */
export function SpainFlag({
  width = 20,
  height = 14,
  title = "España",
  borderRadius = 3,
  className,
  style,
  ...rest
}: FlagIconProps): React.JSX.Element {
  // Step 1: Render vector flag with 3:2 aspect ratio and red/gold/red bands
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 750 500"
      width={width}
      height={height}
      aria-label={title}
      role="img"
      className={className}
      style={{
        borderRadius,
        overflow: "hidden",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 0 1px rgba(0,0,0,0.35)",
        ...style,
      }}
      {...rest}
    >
      <title>{title}</title>
      {/* Red Top & Bottom bands */}
      <rect width="750" height="500" fill="#AA151B" />
      {/* Yellow / Golden Center band (half total height) */}
      <rect y="125" width="750" height="250" fill="#F1BF00" />
      {/* Stylized Coat of Arms Emblem Crown & Pillars in Spain flag */}
      <g transform="translate(180, 200) scale(0.65)">
        <ellipse cx="50" cy="50" rx="35" ry="42" fill="#AA151B" opacity="0.9" />
        <rect x="25" y="20" width="50" height="60" rx="4" fill="#AA151B" />
        <rect x="35" y="30" width="30" height="40" rx="2" fill="#F1BF00" />
        <circle cx="50" cy="50" r="10" fill="#00356B" />
        {/* Crown accent */}
        <polygon points="25,18 35,5 50,15 65,5 75,18" fill="#F1BF00" stroke="#AA151B" strokeWidth="2" />
        {/* Left and right Pillars of Hercules */}
        <rect x="5" y="10" width="8" height="80" rx="2" fill="#FFFFFF" opacity="0.85" />
        <rect x="87" y="10" width="8" height="80" rx="2" fill="#FFFFFF" opacity="0.85" />
      </g>
    </svg>
  );
}

/**
 * UsaFlag renders the official national flag of the United States of America.
 * 
 * @param props Component properties controlling dimensions and title.
 * @returns React.JSX.Element
 */
export function UsaFlag({
  width = 20,
  height = 14,
  title = "United States",
  borderRadius = 3,
  className,
  style,
  ...rest
}: FlagIconProps): React.JSX.Element {
  // Step 1: Render vector flag with 13 stripes and blue canton with stars
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 741 390"
      width={width}
      height={height}
      aria-label={title}
      role="img"
      className={className}
      style={{
        borderRadius,
        overflow: "hidden",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 0 1px rgba(0,0,0,0.35)",
        ...style,
      }}
      {...rest}
    >
      <title>{title}</title>
      {/* 13 Horizontal Stripes (7 red, 6 white) */}
      <rect width="741" height="390" fill="#B22234" />
      <path
        d="M0,30H741M0,90H741M0,150H741M0,210H741M0,270H741M0,330H741"
        stroke="#FFFFFF"
        strokeWidth="30"
      />
      {/* Blue Canton (Union) */}
      <rect width="296" height="210" fill="#3C3B6E" />
      {/* Stylized Star Grid Patterns inside Canton */}
      <g fill="#FFFFFF" opacity="0.95">
        {[
          [35, 25], [95, 25], [155, 25], [215, 25], [265, 25],
          [65, 55], [125, 55], [185, 55], [245, 55],
          [35, 85], [95, 85], [155, 85], [215, 85], [265, 85],
          [65, 115], [125, 115], [185, 115], [245, 115],
          [35, 145], [95, 145], [155, 145], [215, 145], [265, 145],
          [65, 175], [125, 175], [185, 175], [245, 175],
        ].map(([cx, cy], i) => (
          <polygon
            key={i}
            points={`${cx},${cy - 8} ${cx + 2.5},${cy - 2.5} ${cx + 8},${cy - 2} ${cx + 3.5},${cy + 2.5} ${cx + 5},${cy + 8} ${cx},${cy + 4.5} ${cx - 5},${cy + 8} ${cx - 3.5},${cy + 2.5} ${cx - 8},${cy - 2} ${cx - 2.5},${cy - 2.5}`}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * BrazilFlag renders the official national flag of Brazil (Bandeira do Brasil).
 * 
 * @param props Component properties controlling dimensions and title.
 * @returns React.JSX.Element
 */
export function BrazilFlag({
  width = 20,
  height = 14,
  title = "Brasil",
  borderRadius = 3,
  className,
  style,
  ...rest
}: FlagIconProps): React.JSX.Element {
  // Step 1: Render vector flag with green field, yellow rhombus and celestial blue circle
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720 504"
      width={width}
      height={height}
      aria-label={title}
      role="img"
      className={className}
      style={{
        borderRadius,
        overflow: "hidden",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        boxShadow: "0 0 1px rgba(0,0,0,0.35)",
        ...style,
      }}
      {...rest}
    >
      <title>{title}</title>
      {/* Green Field */}
      <rect width="720" height="504" fill="#009739" />
      {/* Yellow Rhombus (Losango Amarelo) */}
      <polygon points="360,40 670,252 360,464 50,252" fill="#FEDD00" />
      {/* Blue Celestial Sphere (Globo Azul) */}
      <circle cx="360" cy="252" r="126" fill="#012169" />
      {/* Curved White Band (Faixa Branca) */}
      <path
        d="M236,252 C280,210 440,210 484,252 C440,230 280,230 236,252 Z"
        fill="#FFFFFF"
      />
      {/* Constellation Southern Cross stars */}
      <circle cx="360" cy="270" r="4" fill="#FFFFFF" />
      <circle cx="370" cy="285" r="3" fill="#FFFFFF" />
      <circle cx="350" cy="288" r="3" fill="#FFFFFF" />
      <circle cx="362" cy="305" r="3.5" fill="#FFFFFF" />
      <circle cx="378" cy="298" r="2.5" fill="#FFFFFF" />
      <circle cx="330" cy="295" r="3" fill="#FFFFFF" />
      <circle cx="395" cy="280" r="3" fill="#FFFFFF" />
    </svg>
  );
}

export interface LocaleFlagProps extends FlagIconProps {
  /** Supported locale code: "es" | "en" | "pt". */
  readonly locale: SupportedLocale;
}

/**
 * LocaleFlag resolves and renders the matching national vector flag icon for the active locale.
 * 
 * @param props Props containing the target locale and optional dimensions.
 * @returns React.JSX.Element
 */
export function LocaleFlag({ locale, ...rest }: LocaleFlagProps): React.JSX.Element {
  switch (locale) {
    case "es":
      return <SpainFlag {...rest} />;
    case "en":
      return <UsaFlag {...rest} />;
    case "pt":
      return <BrazilFlag {...rest} />;
    default:
      return <SpainFlag {...rest} />;
  }
}
