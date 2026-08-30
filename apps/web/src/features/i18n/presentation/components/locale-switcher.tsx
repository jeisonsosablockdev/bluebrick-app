/**
 * @file apps/web/src/features/i18n/presentation/components/locale-switcher.tsx
 * @description Layer 1: Presentation - Interactive Luxury Dark Locale Switcher Component.
 * Supports switching between Spanish (es), English (en), and Portuguese (pt) with accessibility and Motion styling.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n } from "../../application/hooks/use-i18n";
import {
  SUPPORTED_LOCALES,
  LOCALE_CONFIGS,
  type SupportedLocale,
} from "../../domain/models/locale-types";

export interface LocaleSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LocaleSwitcher({ compact = false, className }: LocaleSwitcherProps): React.JSX.Element {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = LOCALE_CONFIGS[locale] || LOCALE_CONFIGS.es;

  // Step 1: Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Step 2: Handle locale change and close menu
  const handleSelectLocale = (code: SupportedLocale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Seleccionar idioma / Select language"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(237,241,245,0.05)",
          border: "1px solid rgba(237,241,245,0.12)",
          borderRadius: 10,
          padding: compact ? "6px 10px" : "8px 14px",
          color: "#EDF1F5",
          fontSize: compact ? 12 : 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s ease",
          outline: "none",
        }}
      >
        <Globe size={14} color="#57B98C" />
        <span style={{ fontSize: 13 }}>{currentConfig.flag}</span>
        {!compact && <span>{currentConfig.code.toUpperCase()}</span>}
        <ChevronDown
          size={13}
          color="#7C8A9C"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            minWidth: 150,
            background: "#0D1526",
            border: "1px solid rgba(237,241,245,0.15)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {SUPPORTED_LOCALES.map((code) => {
            const config = LOCALE_CONFIGS[code];
            const isSelected = code === locale;

            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLocale(code)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: isSelected ? "rgba(47,143,107,0.18)" : "transparent",
                  color: isSelected ? "#57B98C" : "#EDF1F5",
                  fontSize: 12.5,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{config.flag}</span>
                  <span>{config.nativeName}</span>
                </div>
                {isSelected && <Check size={13} color="#57B98C" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
