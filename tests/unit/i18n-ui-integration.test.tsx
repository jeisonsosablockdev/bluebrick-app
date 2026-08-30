/**
 * @file tests/unit/i18n-ui-integration.test.tsx
 * @description Layer 1 & QA: Behavioral UI Integration Test Suite for I18nProvider, useI18n, and LocaleSwitcher.
 * @spec BBC-009-UI-INTEGRATION
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "@/features/i18n/presentation/components/i18n-provider";
import { LocaleSwitcher } from "@/features/i18n/presentation/components/locale-switcher";
import { useI18n } from "@/features/i18n/application/hooks/use-i18n";
import { LOCALE_COOKIE_NAME } from "@/features/i18n/infrastructure/cookie-locale-adapter";

function TestConsumer(): React.JSX.Element {
  const { locale, t, formatCurrency, formatPercent, setLocale } = useI18n();

  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <h1 data-testid="landing-headline">{t("landing.headline")}</h1>
      <span data-testid="common-loading">{t("common.loading")}</span>
      <span data-testid="formatted-currency">{formatCurrency(120000)}</span>
      <span data-testid="formatted-roi">{formatPercent(14.5)}</span>
      <button data-testid="btn-switch-en" onClick={() => setLocale("en")}>
        Switch EN
      </button>
      <button data-testid="btn-switch-pt" onClick={() => setLocale("pt")}>
        Switch PT
      </button>
      <button data-testid="btn-switch-es" onClick={() => setLocale("es")}>
        Switch ES
      </button>
      <LocaleSwitcher />
    </div>
  );
}

describe("BBC-009: I18n UI Integration & Consumer Hook (@spec BBC-009-UI-INTEGRATION)", () => {
  beforeEach(() => {
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE_NAME}=; max-age=0; path=/`;
    }
  });

  it("should render Spanish translations by default", () => {
    render(
      <I18nProvider initialLocale="es">
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId("current-locale").textContent).toBe("es");
    expect(screen.getByTestId("landing-headline").textContent).toBe(
      "Invierte en activos inmobiliarios premium con retornos transparentes"
    );
    expect(screen.getByTestId("common-loading").textContent).toBe("Cargando...");
    expect(screen.getByTestId("formatted-currency").textContent).toBe("$120,000");
  });

  it("should dynamically switch to English and update translated UI text", () => {
    render(
      <I18nProvider initialLocale="es">
        <TestConsumer />
      </I18nProvider>
    );

    // Step 1: Switch to English
    fireEvent.click(screen.getByTestId("btn-switch-en"));

    // Step 2: Assert updated translation strings
    expect(screen.getByTestId("current-locale").textContent).toBe("en");
    expect(screen.getByTestId("landing-headline").textContent).toBe(
      "Invest in premium real estate assets with transparent returns"
    );
    expect(screen.getByTestId("common-loading").textContent).toBe("Loading...");
  });

  it("should dynamically switch to Portuguese and update translated UI text", () => {
    render(
      <I18nProvider initialLocale="es">
        <TestConsumer />
      </I18nProvider>
    );

    // Step 1: Switch to Portuguese
    fireEvent.click(screen.getByTestId("btn-switch-pt"));

    // Step 2: Assert updated translation strings
    expect(screen.getByTestId("current-locale").textContent).toBe("pt");
    expect(screen.getByTestId("landing-headline").textContent).toBe(
      "Invista em ativos imobiliários premium com retornos transparentes"
    );
    expect(screen.getByTestId("common-loading").textContent).toBe("Carregando...");
  });

  it("should render LocaleSwitcher dropdown and allow selecting language via UI", () => {
    render(
      <I18nProvider initialLocale="es">
        <TestConsumer />
      </I18nProvider>
    );

    // Step 1: Click trigger to open dropdown
    const trigger = screen.getByRole("button", { name: /seleccionar idioma/i });
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);

    // Step 2: Select English option from listbox
    const englishOption = screen.getByRole("option", { name: /english/i });
    expect(englishOption).toBeInTheDocument();
    fireEvent.click(englishOption);

    // Step 3: Verify context updated to English
    expect(screen.getByTestId("current-locale").textContent).toBe("en");
    expect(screen.getByTestId("landing-headline").textContent).toBe(
      "Invest in premium real estate assets with transparent returns"
    );
  });
});
