/**
 * @file tests/unit/i18n-dictionaries.test.ts
 * @description Layer 3 & QA: Comprehensive Behavioral Unit Test Suite for Translation Dictionaries and Schemas.
 * @spec BBC-009-DICTIONARIES
 */

import { describe, it, expect } from "vitest";
import { DictionarySchema } from "@/features/i18n/domain/schemas/i18n-dictionary-schema";
import { es } from "@/features/i18n/domain/dictionaries/es";
import { en } from "@/features/i18n/domain/dictionaries/en";
import { pt } from "@/features/i18n/domain/dictionaries/pt";
import { dictionaryLoaderAdapter } from "@/features/i18n/infrastructure/dictionary-loader-adapter";

/**
 * Extracts all recursive leaf key paths from an object.
 */
function getLeafKeyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getLeafKeyPaths(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe("BBC-009: Translation Dictionaries & Zod Validation (@spec BBC-009-DICTIONARIES)", () => {
  it("should validate Spanish dictionary against DictionarySchema", () => {
    // Step 1: Parse Spanish dictionary through Zod schema
    const result = DictionarySchema.safeParse(es);
    expect(result.success).toBe(true);
  });

  it("should validate English dictionary against DictionarySchema", () => {
    // Step 1: Parse English dictionary through Zod schema
    const result = DictionarySchema.safeParse(en);
    expect(result.success).toBe(true);
  });

  it("should validate Portuguese dictionary against DictionarySchema", () => {
    // Step 1: Parse Portuguese dictionary through Zod schema
    const result = DictionarySchema.safeParse(pt);
    expect(result.success).toBe(true);
  });

  it("should ensure 100% key parity between Spanish, English, and Portuguese", () => {
    // Step 1: Extract all keys from canonical Spanish dictionary
    const esKeys = getLeafKeyPaths(es as unknown as Record<string, unknown>);
    const enKeys = getLeafKeyPaths(en as unknown as Record<string, unknown>);
    const ptKeys = getLeafKeyPaths(pt as unknown as Record<string, unknown>);

    // Step 2: Assert identical key sets across all three languages
    expect(enKeys).toEqual(esKeys);
    expect(ptKeys).toEqual(esKeys);
  });

  it("should ensure all leaf tokens are non-empty strings across all dictionaries", () => {
    const dictionaries = [
      { name: "es", dict: es },
      { name: "en", dict: en },
      { name: "pt", dict: pt },
    ];

    for (const { name, dict } of dictionaries) {
      const keys = getLeafKeyPaths(dict as unknown as Record<string, unknown>);
      for (const keyPath of keys) {
        const parts = keyPath.split(".");
        let val: unknown = dict;
        for (const p of parts) {
          val = (val as Record<string, unknown>)[p];
        }
        expect(typeof val, `Locale '${name}' key '${keyPath}' must be a string`).toBe("string");
        expect((val as string).trim().length, `Locale '${name}' key '${keyPath}' cannot be empty`).toBeGreaterThan(0);
      }
    }
  });

  it("should verify dynamic parameter placeholders exist in appropriate tokens", () => {
    // ROI parameter
    expect(es.dashboard.weightedRoi).toContain("{roi}");
    expect(en.dashboard.weightedRoi).toContain("{roi}");
    expect(pt.dashboard.weightedRoi).toContain("{roi}");

    // Reinvestment name and amount parameters
    expect(es.dashboard.reinvestment.badge).toContain("{name}");
    expect(en.dashboard.reinvestment.badge).toContain("{name}");
    expect(pt.dashboard.reinvestment.badge).toContain("{name}");

    expect(es.dashboard.reinvestment.minInvestmentFrom).toContain("{amount}");
    expect(en.dashboard.reinvestment.minInvestmentFrom).toContain("{amount}");
    expect(pt.dashboard.reinvestment.minInvestmentFrom).toContain("{amount}");

    // Phase progress & media card dynamic parameters
    expect(es.dashboard.phaseProgress.photoCountMultiple).toContain("{count}");
    expect(en.dashboard.phaseProgress.photoCountMultiple).toContain("{count}");
    expect(pt.dashboard.phaseProgress.photoCountMultiple).toContain("{count}");

    expect(es.dashboard.mediaCard.photoCounter).toContain("{total}");
    expect(en.dashboard.mediaCard.photoCounter).toContain("{total}");
    expect(pt.dashboard.mediaCard.photoCounter).toContain("{total}");

    expect(es.dashboard.mediaCard.expandAria).toContain("{phase}");
    expect(en.dashboard.mediaCard.expandAria).toContain("{phase}");
    expect(pt.dashboard.mediaCard.expandAria).toContain("{phase}");
  });

  it("should verify new subcomponent namespaces (phaseProgress, mediaCard, avatarModal, imageDetail) are properly structured", () => {
    // Phase Progress
    expect(es.dashboard.phaseProgress.title).toBe("Avance de obra por fases");
    expect(en.dashboard.phaseProgress.title).toBe("Construction Phase Progress");
    expect(pt.dashboard.phaseProgress.title).toBe("Avanço da Obra por Fases");

    // Avatar Upload Modal
    expect(es.dashboard.avatarModal.title).toBe("Actualizar Avatar de Inversionista");
    expect(en.dashboard.avatarModal.title).toBe("Update Investor Avatar");
    expect(pt.dashboard.avatarModal.title).toBe("Atualizar Avatar do Investidor");

    // Media Card
    expect(es.dashboard.mediaCard.prevImageAria).toBe("Ver imagen anterior");
    expect(en.dashboard.mediaCard.prevImageAria).toBe("View previous image");
    expect(pt.dashboard.mediaCard.prevImageAria).toBe("Ver imagem anterior");
  });

  it("should load dictionary properly from dictionaryLoaderAdapter with fallback", () => {
    expect(dictionaryLoaderAdapter.loadDictionary("es")).toBe(es);
    expect(dictionaryLoaderAdapter.loadDictionary("en")).toBe(en);
    expect(dictionaryLoaderAdapter.loadDictionary("pt")).toBe(pt);
    // Invalid locale fallback to Spanish
    // @ts-expect-error Testing invalid runtime locale
    expect(dictionaryLoaderAdapter.loadDictionary("fr")).toBe(es);
  });
});
