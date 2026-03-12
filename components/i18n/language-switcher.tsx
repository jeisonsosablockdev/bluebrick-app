"use client";

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
    <div className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 p-1" role="group" aria-label="Language selector">
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setLocale(option.value)}
          className={cn(
            "min-h-9 rounded-full px-3 text-xs font-semibold transition",
            locale === option.value
              ? "bg-gradientPrimary text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)]"
              : "text-white/75 hover:bg-white/10 hover:text-white"
          )}
          aria-pressed={locale === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
