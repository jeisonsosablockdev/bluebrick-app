"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { type AppLocale } from "@/lib/i18n";
import { useI18n } from "@/components/i18n/locale-provider";

const LANGUAGE_OPTIONS: Array<{ value: AppLocale; label: string }> = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
  { value: "pt", label: "PT" }
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <motion.div
      layout
      className="language-switcher inline-flex min-h-11 items-center rounded-full bg-slate-950/28 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.12),inset_0_-1px_0_rgba(0,176,249,0.04)]"
      role="group"
      aria-label="Language selector"
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <motion.button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.975 }}
          className={cn(
            "language-option relative min-h-9 overflow-hidden rounded-full px-3 text-xs font-semibold transition",
            locale === option.value
              ? "language-option-active text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)]"
              : "language-option-idle text-white/75 hover:bg-white/10 hover:text-white"
          )}
          aria-pressed={locale === option.value}
        >
          {locale === option.value ? (
            <motion.span
              layoutId="language-switcher-active-pill"
              className="absolute inset-0 rounded-full bg-gradientPrimary"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          ) : null}
          <span className="relative z-10">{option.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
