"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ClipboardEvent, ReactElement } from "react";
import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import {
  CoreCandyMachinePanel
} from "@/components/admin/core-candy-machine-panel";
import { useAssetCreationFormState, useAssetImportJobs, useAssetUploadWorkflow } from "@/components/admin/asset-creation";
import type { AssetForm, AssetType, FileUploadField, TypeFormState } from "@/components/admin/asset-creation/types";
import type { ParsedImportCandidate } from "@/components/admin/asset-creation/use-asset-import-jobs";
import {
  AssetCollectionSection,
  AssetCommercialDescriptionSection,
  AssetCreationIntroSection,
  AssetIdentificationSection,
  AssetImportSection,
  AssetLocationSection,
  AssetMediaSection,
  AssetTypeSelectionSection,
  GuidedFieldHeader,
  GuidedInputField,
  GuidedSelectField,
  GuidedTextareaField
} from "@/components/admin/asset-creation/sections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  applyFinancialRule,
  mapImportRowToFormFields,
  suggestCollectionFromIdentity
} from "@/lib/admin/asset-form";
import {
  convertSolToUsd,
  convertUsdToSol,
  formatPriceInput,
  parsePositiveDecimalInput
} from "@/lib/admin/pricing";
import type { PropertyEconomics, PropertyGovernance, PropertyProject } from "@/lib/property-service";
import {
  parseCollectionName,
  parseCollectionSymbol,
  parseExitStrategy
} from "@/lib/admin/asset-compatibility-validation";

const assetTypeOptions: Array<{ value: Exclude<AssetType, "">; title: { en: string; es: string; pt: string }; subtitle: { en: string; es: string; pt: string } }> = [
  {
    value: "building_new",
    title: { en: "New building", es: "Edificio nuevo", pt: "Edificio novo" },
    subtitle: {
      en: "Asset in development or delivery stage.",
      es: "Activo en fase de desarrollo o entrega.",
      pt: "Ativo em fase de desenvolvimento ou entrega."
    }
  },
  {
    value: "rental_property",
    title: { en: "Rental property", es: "Propiedad en renta", pt: "Propriedade em renda" },
    subtitle: {
      en: "Asset focused on recurring yield flow.",
      es: "Activo enfocado en flujo de renta recurrente.",
      pt: "Ativo focado em fluxo de renda recorrente."
    }
  },
  {
    value: "land_lot",
    title: { en: "Land lot", es: "Lote de engorde", pt: "Lote de valorizacao" },
    subtitle: {
      en: "Asset with future appreciation thesis.",
      es: "Activo con tesis de valorizacion futura.",
      pt: "Ativo com tese de valorizacao futura."
    }
  }
];

const exitStrategyOptions: Array<{
  value: string;
  label: { en: string; es: string; pt: string };
}> = [
  {
    value: "sale",
    label: { en: "Sale", es: "Venta", pt: "Venda" }
  },
  {
    value: "refinance",
    label: { en: "Refinance", es: "Refinanciacion", pt: "Refinanciamento" }
  },
  {
    value: "buyback",
    label: { en: "Buyback", es: "Recompra", pt: "Recompra" }
  },
  {
    value: "hold",
    label: { en: "Hold", es: "Mantener", pt: "Manter" }
  },
  {
    value: "token-redemption",
    label: { en: "Token redemption", es: "Rescate de token", pt: "Resgate de token" }
  }
];

function createDraftId(): string {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi) {
    throw new Error("Browser crypto API is required to initialize draftId.");
  }

  if (cryptoApi.randomUUID) {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join("")
  ].join("-");
}

function dedupeValidationErrors(errors: string[]): string[] {
  return Array.from(new Set(errors.map((item) => item.trim()).filter(Boolean)));
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeError = (payload as { error?: { message?: unknown } }).error;
  if (!maybeError || typeof maybeError !== "object") {
    return fallback;
  }

  const message = maybeError.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
}

function normalizeMarketplaceEntryId(primary: string, fallback: string): string {
  const candidate = primary.trim() || fallback.trim();
  const normalized = candidate
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "marketplace-entry";
}

function readOptionalNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function readOptionalPositiveInteger(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function deriveNftPriceUsd(form: AssetForm): number {
  if (form.assetType === "building_new") {
    const nftCost = Number(form.buildingNftCost);
    if (Number.isFinite(nftCost) && nftCost > 0) {
      return nftCost;
    }
  }

  if (form.assetType === "land_lot") {
    const entryPrice = Number(form.landEntryPrice);
    if (Number.isFinite(entryPrice) && entryPrice > 0) {
      return entryPrice;
    }
  }

  if (form.assetType === "rental_property") {
    const monthlyRentEstimate = Number(form.rentalMonthlyRentEstimate);
    if (Number.isFinite(monthlyRentEstimate) && monthlyRentEstimate > 0) {
      return monthlyRentEstimate;
    }
  }

  return 0;
}

function deriveAnnualRoiPct(form: AssetForm): number {
  if (form.assetType === "building_new") {
    const projectedNetRoi = Number(form.projectedNetRoiPct);
    if (Number.isFinite(projectedNetRoi) && projectedNetRoi >= 0) {
      return projectedNetRoi;
    }

    const annualReturn = Number(form.buildingExpectedAnnualReturn);
    if (Number.isFinite(annualReturn) && annualReturn >= 0) {
      return annualReturn;
    }
  }

  if (form.assetType === "rental_property") {
    const historicalYield = Number(form.rentalHistoricalYield);
    if (Number.isFinite(historicalYield) && historicalYield >= 0) {
      return historicalYield;
    }
  }

  return 0;
}

function buildMarketplaceHighlights(form: AssetForm): string[] {
  const highlights: string[] = [];

  if (form.assetType === "building_new" && form.buildingProjectStage.trim()) {
    highlights.push(`Project stage: ${form.buildingProjectStage.trim()}`);
  }

  if (form.assetType === "building_new" && form.buildingDeveloperName.trim()) {
    highlights.push(`Operator: ${form.buildingDeveloperName.trim()}`);
  }

  if (form.assetType === "building_new" && form.buildingExitStrategy.trim()) {
    highlights.push(`Exit: ${form.buildingExitStrategy.trim()}`);
  }

  if (form.assetType === "building_new" && form.buildingProjectDurationMonths.trim()) {
    highlights.push(`Duration: ${form.buildingProjectDurationMonths.trim()} months`);
  }

  if (form.assetType === "rental_property" && form.rentalOccupancyRate.trim()) {
    highlights.push(`Occupancy: ${form.rentalOccupancyRate.trim()}%`);
  }

  if (form.assetType === "land_lot" && form.landAreaM2.trim()) {
    highlights.push(`Area: ${form.landAreaM2.trim()} m2`);
  }

  if (form.city.trim() || form.country.trim()) {
    highlights.push(`Location: ${[form.city.trim(), form.country.trim()].filter(Boolean).join(", ")}`);
  }

  return Array.from(new Set(highlights.map((item) => item.trim()).filter(Boolean))).slice(0, 6);
}

function buildMarketplaceProject(form: AssetForm): PropertyProject {
  return {
    stage: form.buildingProjectStage.trim(),
    developerName: form.buildingDeveloperName.trim(),
    exitStrategy: form.buildingExitStrategy.trim(),
    durationMonths: readOptionalPositiveInteger(form.buildingProjectDurationMonths)
  };
}

function buildMarketplaceEconomics(form: AssetForm): PropertyEconomics {
  return {
    purchasePriceUsd: readOptionalNumber(form.purchasePriceUsd),
    afterRepairValueUsd: readOptionalNumber(form.afterRepairValueUsd),
    rehabBudgetUsd: readOptionalNumber(form.rehabBudgetUsd),
    closingCostsUsd: readOptionalNumber(form.closingCostsUsd),
    holdingCostsUsd: readOptionalNumber(form.holdingCostsUsd),
    sellingCostsUsd: readOptionalNumber(form.sellingCostsUsd),
    totalProjectCostUsd: readOptionalNumber(form.totalProjectCostUsd),
    minimumCapitalRequiredUsd: readOptionalNumber(form.buildingFundingGoal),
    structuringFeeUsd: readOptionalNumber(form.structuringFeeUsd),
    grossProfitProjectedUsd: readOptionalNumber(form.grossProfitProjectedUsd),
    managementFeeUsd: readOptionalNumber(form.managementFeeUsd),
    brokerFeeUsd: readOptionalNumber(form.brokerFeeUsd),
    netInvestorProfitUsd: readOptionalNumber(form.netInvestorProfitUsd),
    projectedNetRoiPct: readOptionalNumber(form.projectedNetRoiPct)
  };
}

function buildMarketplaceGovernance(form: AssetForm): PropertyGovernance {
  const governanceNotes = [
    form.riskNotes.trim(),
    form.buildingFiduciaryStructure.trim() ? `Fiduciary structure: ${form.buildingFiduciaryStructure.trim()}` : "",
    form.buildingLicensesStatus.trim() ? `Licenses status: ${form.buildingLicensesStatus.trim()}` : ""
  ].filter(Boolean);

  return {
    riskNotes: (governanceNotes.join(" ") || form.investmentThesis.trim() || "").trim()
  };
}

function buildMarketplaceDocuments(form: AssetForm): Array<{ label: string; url: string }> {
  const documents: Array<{ label: string; url: string }> = [];

  if (form.brochureFile.trim()) {
    documents.push({ label: "Brochure", url: form.brochureFile.trim() });
  }

  for (const [index, url] of form.legalDocs.map((item) => item.trim()).filter(Boolean).slice(0, 4).entries()) {
    documents.push({ label: `Legal document ${index + 1}`, url });
  }

  for (const [index, url] of form.financialDocs.map((item) => item.trim()).filter(Boolean).slice(0, 4).entries()) {
    documents.push({ label: `Financial document ${index + 1}`, url });
  }

  return documents;
}

function deriveProjectDurationMonths(startDateRaw: string, deliveryDateRaw: string): string {
  if (!startDateRaw || !deliveryDateRaw) {
    return "";
  }

  const startDate = Date.parse(`${startDateRaw}T00:00:00Z`);
  const deliveryDate = Date.parse(`${deliveryDateRaw}T00:00:00Z`);
  if (!Number.isFinite(startDate) || !Number.isFinite(deliveryDate) || deliveryDate < startDate) {
    return "";
  }

  const DAY_IN_MS = 1000 * 60 * 60 * 24;
  const averageMonthInDays = 30.4375;
  const diffDays = (deliveryDate - startDate) / DAY_IN_MS;
  const months = Math.max(1, Math.ceil(diffDays / averageMonthInDays));
  return String(months);
}

type PriceInputCurrency = "USD" | "SOL";

type SolUsdQuoteResponse = {
  solUsd?: number;
  updatedAt?: string;
  error?: string;
};

export function AssetCreationForm(): ReactElement {
  const { t } = useI18n();
  const [draftId] = useState<string>(() => createDraftId());
  const {
    form,
    formStatus,
    validationErrors,
    collectionNameManual,
    collectionSymbolManual,
    importText,
    importFileName,
    importFingerprint,
    importPreviewCount,
    importHeaders,
    importMessage,
    dragTargetField,
    uploadState,
    uploadRefs,
    mintQuantity,
    showMintSetup,
    deployCompletedData,
    snapshotFinalize,
    createAssetMessage,
    isCreatingMarketplaceEntry,
    createdMarketplaceEntryId,
    setForm,
    setFormStatus,
    setValidationErrors,
    setCollectionNameManual,
    setCollectionSymbolManual,
    setImportText,
    setImportFileName,
    setImportFingerprint,
    setImportPreviewCount,
    setImportHeaders,
    setImportMessage,
    setDragTargetField,
    setUploadState,
    setUploadRefs,
    setMintQuantity,
    setShowMintSetup,
    setDeployCompletedData,
    setSnapshotFinalize,
    setCreateAssetMessage,
    setIsCreatingMarketplaceEntry,
    setCreatedMarketplaceEntryId
  } = useAssetCreationFormState(draftId);
  const [priceInputCurrency, setPriceInputCurrency] = useState<PriceInputCurrency>("USD");
  const [pendingImportCandidate, setPendingImportCandidate] = useState<ParsedImportCandidate | null>(null);
  const [solUsdRate, setSolUsdRate] = useState<number | null>(null);
  const [solUsdUpdatedAt, setSolUsdUpdatedAt] = useState<string | null>(null);
  const [solUsdQuoteStatus, setSolUsdQuoteStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [solUsdQuoteError, setSolUsdQuoteError] = useState<string | null>(null);

  const refreshSolUsdQuote = useCallback(async () => {
    setSolUsdQuoteStatus((previous) => (previous === "ready" ? "ready" : "loading"));
    setSolUsdQuoteError(null);

    try {
      const response = await fetch("/api/admin/pricing/sol-usd", {
        method: "GET",
        headers: {
          accept: "application/json"
        },
        cache: "no-store"
      });

      const payload = await response.json().catch(() => null) as SolUsdQuoteResponse | null;
      if (!response.ok || typeof payload?.solUsd !== "number" || !Number.isFinite(payload.solUsd) || payload.solUsd <= 0) {
        throw new Error(payload?.error ?? "Could not fetch SOL/USD quote.");
      }

      setSolUsdRate(payload.solUsd);
      setSolUsdUpdatedAt(typeof payload.updatedAt === "string" ? payload.updatedAt : null);
      setSolUsdQuoteStatus("ready");
    } catch (error) {
      setSolUsdQuoteStatus("error");
      setSolUsdQuoteError(error instanceof Error ? error.message : "Could not fetch SOL/USD quote.");
    }
  }, []);

  useEffect(() => {
    if (form.assetType !== "building_new") {
      setPriceInputCurrency("USD");
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadQuote = async () => {
      if (cancelled) {
        return;
      }
      await refreshSolUsdQuote();
    };

    void loadQuote();
    intervalId = setInterval(() => {
      void loadQuote();
    }, 90_000);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [form.assetType, refreshSolUsdQuote]);

  const derivedMintQuantityFromType = useMemo(() => {
    if (form.assetType !== "building_new") {
      return null;
    }

    const parsed = Number(form.buildingTotalUnits);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Math.floor(parsed);
  }, [form.assetType, form.buildingTotalUnits]);

  const mintQuantityValue = useMemo(() => {
    const sourceValue = derivedMintQuantityFromType ?? Number(mintQuantity);
    const parsed = Number(sourceValue);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.floor(parsed);
  }, [derivedMintQuantityFromType, mintQuantity]);

  const snapshotFormData = useMemo<Record<string, unknown>>(() => {
    return {
      ...form,
      draftId,
      formStatus,
      mintQuantity: mintQuantityValue,
      uploadRefs
    };
  }, [draftId, form, formStatus, mintQuantityValue, uploadRefs]);

  const requiredErrors = useMemo(() => {
    const errors: string[] = [];

    if (!form.assetType) {
      errors.push(t({ en: "You must select an asset type.", es: "Debes seleccionar tipo de activo.", pt: "Voce deve selecionar o tipo de ativo." }));
    }
    if (!form.assetName.trim()) {
      errors.push(t({ en: "Asset name is required.", es: "Nombre del activo es obligatorio.", pt: "Nome do ativo e obrigatorio." }));
    }
    if (!form.country.trim() || !form.city.trim()) {
      errors.push(t({ en: "City and country are required.", es: "Ciudad y pais son obligatorios.", pt: "Cidade e pais sao obrigatorios." }));
    }
    if (!form.coverImage.trim()) {
      errors.push(t({ en: "Cover image is required.", es: "Cover image es obligatoria.", pt: "Cover image e obrigatoria." }));
    }
    if (!Number.isInteger(mintQuantityValue) || mintQuantityValue < 1) {
      errors.push(
        form.assetType === "building_new"
          ? t({
              en: "Mint quantity comes from totalUnits and must be at least 1.",
              es: "La cantidad de mint se toma de totalUnits y debe ser minimo 1.",
              pt: "A quantidade de mint vem de totalUnits e deve ser no minimo 1."
            })
          : t({ en: "Mint quantity must be at least 1.", es: "La cantidad de mint debe ser minimo 1.", pt: "A quantidade de mint deve ser no minimo 1." })
      );
    }
    return errors;
  }, [form, mintQuantityValue, t]);

  const typeValidation = useMemo<{ state: TypeFormState; errors: string[] }>(() => {
    if (!form.assetType) {
      return {
        state: "incomplete",
        errors: [
          t({
            en: "Select an asset type to validate differential fields.",
            es: "Selecciona un tipo de activo para validar campos diferenciales.",
            pt: "Selecione um tipo de ativo para validar campos diferenciais."
          })
        ]
      };
    }

    const errors: string[] = [];

    if (form.assetType === "building_new") {
      const purchasePriceUsd = Number(form.purchasePriceUsd || "0");
      const afterRepairValueUsd = Number(form.afterRepairValueUsd || "0");
      const rehabBudgetUsd = Number(form.rehabBudgetUsd || "0");
      const totalProjectCostUsd = Number(form.totalProjectCostUsd || "0");
      const projectedNetRoiPct = Number(form.projectedNetRoiPct || "0");
      const closingCostsUsd = Number(form.closingCostsUsd || "0");
      const holdingCostsUsd = Number(form.holdingCostsUsd || "0");
      const sellingCostsUsd = Number(form.sellingCostsUsd || "0");
      const knownCostComponentSum = purchasePriceUsd + rehabBudgetUsd + closingCostsUsd + holdingCostsUsd + sellingCostsUsd;

      if (!form.buildingDeveloperName.trim()) errors.push(t({ en: "developerName is required.", es: "developerName obligatorio.", pt: "developerName obrigatorio." }));
      if (!form.buildingProjectStage.trim()) errors.push(t({ en: "projectStage is required.", es: "projectStage obligatorio.", pt: "projectStage obrigatorio." }));
      if (!form.buildingProjectDurationMonths.trim()) errors.push(t({ en: "projectDurationMonths is required.", es: "projectDurationMonths obligatorio.", pt: "projectDurationMonths obrigatorio." }));
      if (Number(form.buildingFundingGoal || "0") <= 0) errors.push(t({ en: "fundingGoal must be greater than 0.", es: "fundingGoal debe ser mayor a 0.", pt: "fundingGoal deve ser maior que 0." }));
      if (Number(form.buildingNftCost || "0") <= 0) errors.push(t({ en: "nftCost must be greater than 0.", es: "nftCost debe ser mayor a 0.", pt: "nftCost deve ser maior que 0." }));
      if (Number(form.buildingTotalUnits || "0") <= 0) errors.push(t({ en: "totalUnits must be greater than 0.", es: "totalUnits debe ser mayor a 0.", pt: "totalUnits deve ser maior que 0." }));
      if (purchasePriceUsd <= 0) errors.push(t({ en: "purchasePriceUsd must be greater than 0.", es: "purchasePriceUsd debe ser mayor a 0.", pt: "purchasePriceUsd deve ser maior que 0." }));
      if (afterRepairValueUsd <= 0) errors.push(t({ en: "afterRepairValueUsd must be greater than 0.", es: "afterRepairValueUsd debe ser mayor a 0.", pt: "afterRepairValueUsd deve ser maior que 0." }));
      if (rehabBudgetUsd <= 0) errors.push(t({ en: "rehabBudgetUsd must be greater than 0.", es: "rehabBudgetUsd debe ser mayor a 0.", pt: "rehabBudgetUsd deve ser maior que 0." }));
      if (totalProjectCostUsd <= 0) errors.push(t({ en: "totalProjectCostUsd must be greater than 0.", es: "totalProjectCostUsd debe ser mayor a 0.", pt: "totalProjectCostUsd deve ser maior que 0." }));
      if (projectedNetRoiPct < 0) errors.push(t({ en: "projectedNetRoiPct must be non-negative.", es: "projectedNetRoiPct debe ser no negativo.", pt: "projectedNetRoiPct deve ser nao negativo." }));
      if (knownCostComponentSum > 0 && totalProjectCostUsd > 0 && totalProjectCostUsd < knownCostComponentSum) {
        errors.push(t({
          en: "totalProjectCostUsd cannot be lower than the known component cost sum.",
          es: "totalProjectCostUsd no puede ser menor a la suma de costos conocidos.",
          pt: "totalProjectCostUsd nao pode ser menor que a soma dos custos conhecidos."
        }));
      }
    }

    if (form.assetType === "rental_property") {
      const occupancy = Number(form.rentalOccupancyRate || "0");
      if (Number(form.rentalMonthlyRentEstimate || "0") <= 0) errors.push(t({ en: "monthlyRentEstimate must be greater than 0.", es: "monthlyRentEstimate debe ser mayor a 0.", pt: "monthlyRentEstimate deve ser maior que 0." }));
      if (occupancy < 0 || occupancy > 100) errors.push(t({ en: "occupancyRate must be between 0 and 100.", es: "occupancyRate debe estar entre 0 y 100.", pt: "occupancyRate deve estar entre 0 e 100." }));
      if (form.rentalLeaseStartDate && form.rentalLeaseEndDate && form.rentalLeaseStartDate > form.rentalLeaseEndDate) {
        errors.push(t({ en: "leaseStartDate cannot be greater than leaseEndDate.", es: "leaseStartDate no puede ser mayor a leaseEndDate.", pt: "leaseStartDate nao pode ser maior que leaseEndDate." }));
      }
    }

    if (form.assetType === "land_lot") {
      if (Number(form.landAreaM2 || "0") <= 0) errors.push(t({ en: "landAreaM2 must be greater than 0.", es: "landAreaM2 debe ser mayor a 0.", pt: "landAreaM2 deve ser maior que 0." }));
      if (Number(form.landAppreciationHorizonMonths || "0") <= 0) errors.push(t({ en: "appreciationHorizonMonths must be greater than 0.", es: "appreciationHorizonMonths debe ser mayor a 0.", pt: "appreciationHorizonMonths deve ser maior que 0." }));
      if (Number(form.landEntryPrice || "0") <= 0) errors.push(t({ en: "entryPrice must be greater than 0.", es: "entryPrice debe ser mayor a 0.", pt: "entryPrice deve ser maior que 0." }));
      if (!form.landUse.trim()) errors.push(t({ en: "landUse is required.", es: "landUse es obligatorio.", pt: "landUse e obrigatorio." }));
    }

    if (errors.length > 0) {
      return { state: "invalid", errors };
    }

    return { state: "valid", errors: [] };
  }, [form, t]);

  const compatibilityErrors = useMemo<string[]>(() => {
    const errors: string[] = [];

    const collectionNameResult = parseCollectionName(form.collectionName);
    if (!collectionNameResult.ok) {
      errors.push(...collectionNameResult.errors);
    }

    const collectionSymbolResult = parseCollectionSymbol(form.collectionSymbol);
    if (!collectionSymbolResult.ok) {
      errors.push(...collectionSymbolResult.errors);
    }

    const exitStrategyValue = form.assetType === "building_new"
      ? form.buildingExitStrategy
      : form.assetType === "land_lot"
        ? form.landExitStrategy
        : null;

    if (exitStrategyValue !== null) {
      const exitStrategyResult = parseExitStrategy(exitStrategyValue);
      if (!exitStrategyResult.ok) {
        errors.push(...exitStrategyResult.errors);
      }
    }

    return errors;
  }, [
    form.assetType,
    form.collectionName,
    form.collectionSymbol,
    form.buildingExitStrategy,
    form.landExitStrategy
  ]);

  const canContinueToMint =
    requiredErrors.length === 0 &&
    typeValidation.state === "valid" &&
    compatibilityErrors.length === 0;

  const currentValidationErrors = useMemo(() => {
    return dedupeValidationErrors([
      ...requiredErrors,
      ...typeValidation.errors,
      ...compatibilityErrors
    ]);
  }, [requiredErrors, typeValidation.errors, compatibilityErrors]);

  const continuationTone = useMemo<"ready" | "error" | "pending">(() => {
    if (canContinueToMint) {
      return "ready";
    }

    if (!form.assetType || formStatus === "validation-error") {
      return "error";
    }

    return "pending";
  }, [canContinueToMint, form.assetType, formStatus]);

  const continuationMessage = useMemo(() => {
    if (canContinueToMint) {
      return t({
        en: "Rules: all required fields are valid. You can continue to mint.",
        es: "Reglas: todos los campos requeridos son validos. Puedes continuar a mint.",
        pt: "Regras: todos os campos obrigatorios sao validos. Voce pode continuar para mint."
      });
    }

    if (!form.assetType) {
      return t({
        en: "Rules: select an asset type before continuing.",
        es: "Reglas: selecciona un tipo de activo antes de continuar.",
        pt: "Regras: selecione um tipo de ativo antes de continuar."
      });
    }

    if (formStatus === "validation-error") {
      return t({
        en: "Rules: there are validation errors. Resolve them to continue.",
        es: "Reglas: hay errores de validacion. Corrigelos para continuar.",
        pt: "Regras: existem erros de validacao. Corrija-os para continuar."
      });
    }

    return t({
      en: "Rules: complete required fields to continue to mint.",
      es: "Reglas: completa los campos requeridos para continuar a mint.",
      pt: "Regras: complete os campos obrigatorios para continuar para mint."
    });
  }, [canContinueToMint, form.assetType, formStatus, t]);

  useEffect(() => {
    if (formStatus !== "validation-error") {
      return;
    }

    if (canContinueToMint) {
      setValidationErrors([]);
      setFormStatus("draft");
      return;
    }

    setValidationErrors((previous) => {
      if (areStringArraysEqual(previous, currentValidationErrors)) {
        return previous;
      }

      return currentValidationErrors;
    });
  }, [formStatus, canContinueToMint, currentValidationErrors, setFormStatus, setValidationErrors]);

  useEffect(() => {
    const collectionSuggestion = suggestCollectionFromIdentity({
      internalCode: form.internalCode,
      slug: form.slug
    });

    setForm((prev) => {
      const next = { ...prev };
      let changed = false;

      if (!collectionNameManual && prev.collectionName !== collectionSuggestion.collectionName) {
        next.collectionName = collectionSuggestion.collectionName;
        changed = true;
      }

      if (!collectionSymbolManual && prev.collectionSymbol !== collectionSuggestion.collectionSymbol) {
        next.collectionSymbol = collectionSuggestion.collectionSymbol;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [form.internalCode, form.slug, collectionNameManual, collectionSymbolManual, setForm]);

  useEffect(() => {
    if (form.assetType !== "building_new") {
      return;
    }

    const autoDuration = deriveProjectDurationMonths(form.buildingConstructionStartDate, form.buildingEstimatedDeliveryDate);
    setForm((prev) => {
      if (prev.buildingProjectDurationMonths === autoDuration) {
        return prev;
      }

      return {
        ...prev,
        buildingProjectDurationMonths: autoDuration
      };
    });
  }, [
    form.assetType,
    form.buildingConstructionStartDate,
    form.buildingEstimatedDeliveryDate,
    setForm
  ]);

  useEffect(() => {
    if (form.assetType !== "building_new") {
      return;
    }

    if (form.buildingExpectedAnnualReturn === form.projectedNetRoiPct) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      buildingExpectedAnnualReturn: prev.projectedNetRoiPct
    }));
  }, [form.assetType, form.projectedNetRoiPct, form.buildingExpectedAnnualReturn, setForm]);

  const {
    onFileInput,
    onFileDragOver,
    onFileDragLeave,
    onFileDrop,
    uploadFieldValue
  } = useAssetUploadWorkflow({
    draftId,
    form,
    dragTargetField,
    setForm,
    setUploadState,
    setUploadRefs,
    setDragTargetField,
    t
  });

  const renderUploadFieldFeedback = (field: FileUploadField): ReactElement | null => {
    const state = uploadState[field];
    const refsCount = uploadRefs[field]?.length ?? 0;

    if (!state.uploading && !state.message && !state.error && refsCount === 0) {
      return null;
    }

    return (
      <div className="mt-1 space-y-1">
        {state.message && (
          <p className="text-[11px] leading-relaxed text-cyan-100">{state.message}</p>
        )}
        {state.error && (
          <p className="text-[11px] leading-relaxed text-rose-200">{state.error}</p>
        )}
        {refsCount > 0 && (
          <p className="text-[11px] leading-relaxed text-emerald-200">
            {t({ en: "fileRefIds", es: "fileRefIds", pt: "fileRefIds" })}: {refsCount}
          </p>
        )}
      </div>
    );
  };

  const applyFinancialSource = useCallback((source: "totalUnits" | "nftCost", nextValue: string) => {
    setForm((prev) => {
      const raw = source === "totalUnits"
        ? { ...prev, buildingTotalUnits: nextValue }
        : { ...prev, buildingNftCost: nextValue };

      const result = applyFinancialRule({
        fundingGoal: raw.buildingFundingGoal,
        nftCost: raw.buildingNftCost,
        source,
        totalUnits: raw.buildingTotalUnits
      });

      return {
        ...raw,
        buildingFundingGoal: result.fundingGoal,
        buildingNftCost: result.nftCost,
        buildingTotalUnits: result.totalUnits
      };
    });
  }, [setForm]);

  const buildingNftCostUsd = useMemo(() => parsePositiveDecimalInput(form.buildingNftCost), [form.buildingNftCost]);
  const buildingNftCostSol = useMemo(() => {
    if (!buildingNftCostUsd || !solUsdRate) {
      return null;
    }

    return convertUsdToSol(buildingNftCostUsd, solUsdRate);
  }, [buildingNftCostUsd, solUsdRate]);

  const displayedBuildingNftCostInput = useMemo(() => {
    if (priceInputCurrency === "USD") {
      return form.buildingNftCost;
    }

    if (!buildingNftCostUsd || !solUsdRate) {
      return "";
    }

    return formatPriceInput(buildingNftCostSol ?? 0, 8);
  }, [buildingNftCostSol, buildingNftCostUsd, form.buildingNftCost, priceInputCurrency, solUsdRate]);

  const onBuildingNftCostChange = useCallback((nextValue: string) => {
    if (priceInputCurrency === "USD") {
      applyFinancialSource("nftCost", nextValue);
      return;
    }

    const parsedSol = parsePositiveDecimalInput(nextValue);
    if (!parsedSol || !solUsdRate) {
      applyFinancialSource("nftCost", "");
      return;
    }

    const convertedUsd = convertSolToUsd(parsedSol, solUsdRate);
    applyFinancialSource("nftCost", formatPriceInput(convertedUsd, 8));
  }, [applyFinancialSource, priceInputCurrency, solUsdRate]);

  const nftCostConversionSummary = useMemo(() => {
    if (!buildingNftCostUsd) {
      return t({
        en: "Define a positive Fraction cost to lock deploy price.",
        es: "Define un costo por Fracción positivo para fijar el precio del deploy.",
        pt: "Defina um custo por Fração positivo para fixar o preco do deploy."
      });
    }

    if (!solUsdRate || !buildingNftCostSol) {
      return t({
        en: "SOL/USD quote unavailable. Keep pricing input in USD for now.",
        es: "No hay cotizacion SOL/USD disponible. Mantenga el ingreso en USD por ahora.",
        pt: "Cotacao SOL/USD indisponivel. Mantenha o valor em USD por enquanto."
      });
    }

    return t({
      en: `Canonical deploy price: $${buildingNftCostUsd.toFixed(6)} USD (~${buildingNftCostSol.toFixed(8)} SOL @ $${solUsdRate.toFixed(4)}/SOL).`,
      es: `Precio canonico para deploy: $${buildingNftCostUsd.toFixed(6)} USD (~${buildingNftCostSol.toFixed(8)} SOL @ $${solUsdRate.toFixed(4)}/SOL).`,
      pt: `Preco canonico para deploy: $${buildingNftCostUsd.toFixed(6)} USD (~${buildingNftCostSol.toFixed(8)} SOL @ $${solUsdRate.toFixed(4)}/SOL).`
    });
  }, [buildingNftCostSol, buildingNftCostUsd, solUsdRate, t]);

  const onFundingGoalChange = (nextFundingGoal: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        buildingFundingGoal: nextFundingGoal
      };
      const source: "totalUnits" | "nftCost" = next.buildingTotalUnits ? "totalUnits" : "nftCost";
      const result = applyFinancialRule({
        fundingGoal: next.buildingFundingGoal,
        nftCost: next.buildingNftCost,
        source,
        totalUnits: next.buildingTotalUnits
      });

      return {
        ...next,
        buildingFundingGoal: result.fundingGoal,
        buildingNftCost: result.nftCost,
        buildingTotalUnits: result.totalUnits
      };
    });
  };

  const applyImportedRow = (row: Record<string, string>) => {
    setForm((prev) => {
      const next = { ...prev };
      const mappedRow = mapImportRowToFormFields(row);
      const arrayFields = new Set<keyof AssetForm>([
        "galleryImages",
        "legalDocs",
        "financialDocs",
        "propertyImages"
      ]);

      Object.entries(mappedRow).forEach(([key, value]) => {
        if (key in next) {
          const formKey = key as keyof AssetForm;
          if (arrayFields.has(formKey)) {
            (next[formKey] as string[]) = value
              .split("|")
              .map((item) => item.trim())
              .filter(Boolean);
          } else {
            (next[formKey] as string) = value;
          }
        }
      });

      return next;
    });

    const normalized = mapImportRowToFormFields(row);
    if (normalized.collectionName) {
      setCollectionNameManual(true);
    }
    if (normalized.collectionSymbol) {
      setCollectionSymbolManual(true);
    }
  };

  const hasLoadedImport = importHeaders.length > 0 && importPreviewCount > 0;

  const {
    buildImportCandidateFromText,
    applyImportCandidate: applyImportCandidateToState,
    onImportFileInput
  } = useAssetImportJobs({
    setImportMessage,
    setImportHeaders,
    setImportPreviewCount,
    setImportFileName,
    setImportFingerprint,
    setImportText,
    t,
    onApplyImportedRow: applyImportedRow
  });

  const requestImportCandidate = useCallback((candidate: ParsedImportCandidate | null) => {
    if (!candidate) {
      return;
    }

    const isSameImport = candidate.fingerprint === importFingerprint;
    if (!hasLoadedImport || isSameImport) {
      applyImportCandidateToState(candidate);
      return;
    }

    setPendingImportCandidate(candidate);
  }, [
    applyImportCandidateToState,
    hasLoadedImport,
    importFingerprint
  ]);

  const handleImportFileInput = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const candidate = await onImportFileInput(event);
    requestImportCandidate(candidate);
  }, [onImportFileInput, requestImportCandidate]);

  const handleImportTextareaPaste = useCallback((event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData("text");
    if (!pastedText.trim()) {
      return;
    }

    event.preventDefault();
    const candidate = buildImportCandidateFromText({
      text: pastedText,
      fileName: "pasted-import.tsv"
    });
    requestImportCandidate(candidate);
  }, [buildImportCandidateFromText, requestImportCandidate]);

  const confirmReplaceImport = useCallback(() => {
    if (!pendingImportCandidate) {
      return;
    }

    applyImportCandidateToState(pendingImportCandidate);
    setPendingImportCandidate(null);
  }, [applyImportCandidateToState, pendingImportCandidate]);

  const cancelReplaceImport = useCallback(() => {
    setPendingImportCandidate(null);
    setImportMessage(t({
      en: "Replacement canceled. Your current imported values were kept.",
      es: "Se cancelo el reemplazo. Se mantuvieron tus valores importados actuales.",
      pt: "A substituicao foi cancelada. Seus valores importados atuais foram mantidos."
    }));
  }, [setImportMessage, t]);

  const continueToMint = async () => {
    if (!canContinueToMint) {
      setValidationErrors(currentValidationErrors);
      setFormStatus("validation-error");
      return;
    }

    setValidationErrors([]);
    setFormStatus("saving");
    await new Promise((resolve) => setTimeout(resolve, 350));
    setFormStatus("saved");
    setDeployCompletedData(null);
    setSnapshotFinalize(null);
    setCreateAssetMessage("");
    setCreatedMarketplaceEntryId(null);
    setShowMintSetup(true);
  };

  const handleCreateAsset = async () => {
    if (!deployCompletedData) {
      return;
    }

    setIsCreatingMarketplaceEntry(true);
    setCreateAssetMessage("");

    const nftPriceUsd = deriveNftPriceUsd(form);
    const annualRoiPct = deriveAnnualRoiPct(form);
    const economics = buildMarketplaceEconomics(form);

    const payload = {
      entryId: normalizeMarketplaceEntryId(form.slug, form.internalCode || draftId),
      title: form.assetName.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      stateProvince: form.state.trim() || null,
      address: form.address.trim() || `${form.city.trim()}, ${form.country.trim()}`,
      geoLat: form.geoLat.trim() || null,
      geoLng: form.geoLng.trim() || null,
      imageUrl: form.coverImage.trim(),
      shortDescription: (form.shortDescription.trim() || form.longDescription.trim() || form.assetName.trim()),
      highlights: buildMarketplaceHighlights(form),
      investmentNotes: (form.investmentThesis.trim() || form.riskNotes.trim() || "").trim(),
      supplyTotal: mintQuantityValue > 0 ? mintQuantityValue : 1,
      nftPriceUsd,
      annualRoiPct,
      project: buildMarketplaceProject(form),
      economics,
      governance: buildMarketplaceGovernance(form),
      documents: buildMarketplaceDocuments(form),
      collectionAddress: deployCompletedData.collectionAddress,
      candyMachineAddress: deployCompletedData.candyMachineAddress,
      snapshotId: snapshotFinalize?.snapshotId ?? null
    };

    try {
      const response = await fetch("/api/admin/marketplace/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          readApiErrorMessage(
            body,
            t({
              en: "Could not create marketplace entry.",
              es: "No se pudo crear la entrada del marketplace.",
              pt: "Nao foi possivel criar a entrada do marketplace."
            })
          )
        );
      }

      const createdId = typeof body?.data?.id === "string" ? body.data.id : payload.entryId;
      setCreatedMarketplaceEntryId(createdId);
      setCreateAssetMessage(
        t({
          en: "Marketplace entry created successfully from admin console.",
          es: "Entrada del marketplace creada correctamente desde la consola admin.",
          pt: "Entrada do marketplace criada com sucesso no console admin."
        })
      );
    } catch (error) {
      const fallback = t({
        en: "Could not create marketplace entry.",
        es: "No se pudo crear la entrada del marketplace.",
        pt: "Nao foi possivel criar a entrada do marketplace."
      });
      setCreateAssetMessage(error instanceof Error ? error.message : fallback);
      setCreatedMarketplaceEntryId(null);
    } finally {
      setIsCreatingMarketplaceEntry(false);
    }
  };

  const handleResetSuggestedCollectionValues = () => {
    const suggestion = suggestCollectionFromIdentity({
      internalCode: form.internalCode,
      slug: form.slug
    });
    setCollectionNameManual(false);
    setCollectionSymbolManual(false);
    setForm((prev) => ({
      ...prev,
      collectionName: suggestion.collectionName,
      collectionSymbol: suggestion.collectionSymbol
    }));
  };

  return (
    <div className="space-y-4 pb-24">
      <AssetCreationIntroSection t={t} />
      <AssetImportSection
        t={t}
        importFileName={importFileName}
        importText={importText}
        importPreviewCount={importPreviewCount}
        importHeaders={importHeaders}
        importMessage={importMessage}
        hasLoadedImport={hasLoadedImport}
        replaceImportOpen={Boolean(pendingImportCandidate)}
        pendingImportLabel={pendingImportCandidate?.fileName ?? ""}
        setImportText={setImportText}
        onImportFileInput={handleImportFileInput}
        onImportTextareaPaste={handleImportTextareaPaste}
        onConfirmReplaceImport={confirmReplaceImport}
        onCancelReplaceImport={cancelReplaceImport}
      />
      <AssetTypeSelectionSection t={t} form={form} setForm={setForm} options={assetTypeOptions} />
      <AssetIdentificationSection t={t} form={form} setForm={setForm} />
      <AssetLocationSection t={t} form={form} setForm={setForm} />
      <AssetCommercialDescriptionSection t={t} form={form} setForm={setForm} />
      <AssetMediaSection
        t={t}
        form={form}
        dragTargetField={dragTargetField}
        setForm={setForm}
        onFileDragOver={onFileDragOver}
        onFileDragLeave={onFileDragLeave}
        onFileDrop={onFileDrop}
        onFileInput={onFileInput}
        uploadFieldValue={uploadFieldValue}
        renderUploadFieldFeedback={renderUploadFieldFeedback}
      />
      <AssetCollectionSection
        t={t}
        form={form}
        setForm={setForm}
        setCollectionNameManual={setCollectionNameManual}
        setCollectionSymbolManual={setCollectionSymbolManual}
        onResetSuggestedValues={handleResetSuggestedCollectionValues}
      />
      {form.assetType && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">{t({ en: "Differential fields by type", es: "Campos diferenciales por tipo", pt: "Campos diferenciais por tipo" })}</p>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                typeValidation.state === "valid"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : typeValidation.state === "invalid"
                    ? "bg-rose-500/20 text-rose-200"
                    : "bg-slate-500/20 text-slate-200"
              }`}
            >
              {typeValidation.state}
            </span>
          </div>

          {form.assetType === "building_new" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <GuidedInputField
                  label={t({ en: "Project stage", es: "Etapa del proyecto", pt: "Etapa do projeto" })}
                  hint={t({ en: "Example: pre-sale, construction, delivery.", es: "Ejemplo: preventa, construccion, entrega.", pt: "Exemplo: pre-venda, construcao, entrega." })}
                  tooltip={t({ en: "Current lifecycle status used in investor communications.", es: "Estado del ciclo de vida usado en comunicacion al inversionista.", pt: "Status do ciclo de vida usado na comunicacao ao investidor." })}
                  placeholder="projectStage"
                  value={form.buildingProjectStage}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingProjectStage: event.target.value }))}
                />
                <GuidedInputField
                  label={t({ en: "Operator / developer", es: "Operador / desarrollador", pt: "Operador / desenvolvedor" })}
                  hint={t({ en: "Sponsor, developer, or execution operator from the brief.", es: "Sponsor, desarrollador u operador de ejecucion del brief.", pt: "Sponsor, desenvolvedor ou operador de execucao do brief." })}
                  tooltip={t({ en: "Displayed to investors as the entity leading execution.", es: "Se muestra al inversionista como la entidad que lidera la ejecucion.", pt: "Exibido ao investidor como a entidade que lidera a execucao." })}
                  placeholder="developerName"
                  value={form.buildingDeveloperName}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingDeveloperName: event.target.value }))}
                />
                <GuidedInputField
                  label={t({ en: "Estimated delivery date", es: "Fecha estimada de entrega", pt: "Data estimada de entrega" })}
                  hint={t({ en: "Used to auto-calculate project duration.", es: "Se usa para calcular automaticamente la duracion.", pt: "Usado para calcular automaticamente a duracao." })}
                  tooltip={t({ en: "End date for construction and handover plan.", es: "Fecha final del plan de construccion y entrega.", pt: "Data final do plano de construcao e entrega." })}
                  type="date"
                  value={form.buildingEstimatedDeliveryDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingEstimatedDeliveryDate: event.target.value }))}
                />
                <GuidedInputField
                  label={t({ en: "Construction start date", es: "Fecha de inicio de construccion", pt: "Data de inicio da construcao" })}
                  hint={t({ en: "Together with delivery date defines project months.", es: "Junto con la fecha de entrega define meses del proyecto.", pt: "Junto com a data de entrega define os meses do projeto." })}
                  tooltip={t({ en: "Initial date for timeline and progress baseline.", es: "Fecha inicial para linea de tiempo y progreso.", pt: "Data inicial para linha do tempo e progresso." })}
                  type="date"
                  value={form.buildingConstructionStartDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingConstructionStartDate: event.target.value }))}
                />
                <GuidedInputField
                  label={t({ en: "Minimum capital required", es: "Capital minimo requerido", pt: "Capital minimo requerido" })}
                  hint={t({ en: "Investor capital target from the brief, in USD.", es: "Meta de capital inversionista del brief, en USD.", pt: "Meta de capital do investidor do brief, em USD." })}
                  tooltip={t({ en: "Used as the public minimum-capital signal and mint consistency anchor.", es: "Se usa como senal publica de capital minimo y ancla de consistencia de mint.", pt: "Usado como sinal publico de capital minimo e ancora de consistencia do mint." })}
                  placeholder="fundingGoal"
                  prefix="$"
                  value={form.buildingFundingGoal}
                  onChange={(event) => onFundingGoalChange(event.target.value)}
                />
                <GuidedInputField
                  label={t({ en: "Total units", es: "Total de unidades", pt: "Total de unidades" })}
                  hint={t({ en: "Defines mint quantity for building assets.", es: "Define la cantidad de mint para activos building.", pt: "Define a quantidade de mint para ativos building." })}
                  tooltip={t({ en: "Must be an integer greater than zero.", es: "Debe ser un entero mayor a cero.", pt: "Deve ser um inteiro maior que zero." })}
                  placeholder="totalUnits"
                  value={form.buildingTotalUnits}
                  onChange={(event) => applyFinancialSource("totalUnits", event.target.value)}
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-white/70">
                      <GuidedFieldHeader
                        label={t({ en: "Pricing input currency", es: "Moneda de entrada", pt: "Moeda de entrada" })}
                        hint={t({ en: "Choose whether you type the Fraction cost in USD or SOL.", es: "Elige si vas a escribir el costo por Fraccion en USD o SOL.", pt: "Escolha se voce vai digitar o custo por Fracao em USD ou SOL." })}
                        tooltip={t({ en: "The canonical stored price stays in USD even when the entry mode is SOL.", es: "El precio canonico almacenado sigue en USD incluso cuando el modo de entrada es SOL.", pt: "O preco canonico armazenado permanece em USD mesmo quando o modo de entrada e SOL." })}
                        ariaLabel={t({ en: "Pricing input currency help", es: "Ayuda de moneda de entrada", pt: "Ajuda de moeda de entrada" })}
                      />
                    </div>
                    <div className="inline-flex rounded-xl border border-white/20 bg-slate-900/50 p-1">
                      {(["USD", "SOL"] as const).map((currency) => (
                        <button
                          key={currency}
                          className={cn(
                            "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                            priceInputCurrency === currency
                              ? "bg-cyan-400/25 text-cyan-100"
                              : "text-white/70 hover:text-white"
                          )}
                          onClick={() => {
                            setPriceInputCurrency(currency);
                            if (currency === "SOL" && !solUsdRate) {
                              void refreshSolUsdQuote();
                            }
                          }}
                          type="button"
                        >
                          {currency}
                        </button>
                      ))}
                    </div>
                  </div>
                  <GuidedInputField
                    label={t({ en: "Fraction cost", es: "Costo por Fracción", pt: "Custo por Fração" })}
                    hint={t({ en: "Unit price per Fraction share. Canonical value is stored in USD.", es: "Precio unitario por fraccion Fracción. El valor canonico se guarda en USD.", pt: "Preco unitario por fracao Fração. O valor canonico e salvo em USD." })}
                    tooltip={t({ en: "Auto-adjusted with funding goal and total units.", es: "Se autoajusta con meta de fondeo y total de unidades.", pt: "Autoajustado com meta de captacao e total de unidades." })}
                    placeholder="nftCost"
                    prefix={priceInputCurrency === "SOL" ? "◎" : "$"}
                    value={displayedBuildingNftCostInput}
                    disabled={priceInputCurrency === "SOL" && !solUsdRate}
                    onChange={(event) => onBuildingNftCostChange(event.target.value)}
                  />
                  <p className="text-[11px] text-white/60">{nftCostConversionSummary}</p>
                  {solUsdQuoteStatus === "loading" ? (
                    <p className="text-[11px] text-cyan-100/80">
                      {t({ en: "Refreshing SOL/USD quote...", es: "Actualizando cotizacion SOL/USD...", pt: "Atualizando cotacao SOL/USD..." })}
                    </p>
                  ) : null}
                  {solUsdUpdatedAt ? (
                    <p className="text-[11px] text-white/50">
                      {t({ en: "SOL/USD updated at", es: "SOL/USD actualizado a las", pt: "SOL/USD atualizado em" })}: {new Date(solUsdUpdatedAt).toLocaleString()}
                    </p>
                  ) : null}
                  {solUsdQuoteError ? (
                    <p className="text-[11px] text-rose-200">{solUsdQuoteError}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{t({ en: "Deal economics", es: "Economia del deal", pt: "Economia do deal" })}</p>
                  <p className="text-xs text-white/60">
                    {t({
                      en: "Informational project economics captured from the investment brief and shown in the marketplace detail.",
                      es: "Economia informativa del proyecto capturada desde el brief y mostrada en el detalle del marketplace.",
                      pt: "Economia informativa do projeto capturada do brief e exibida no detalhe do marketplace."
                    })}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <GuidedInputField
                    label={t({ en: "Purchase price", es: "Purchase Price", pt: "Purchase Price" })}
                    hint={t({ en: "Acquisition price from the brief.", es: "Precio de adquisicion del brief.", pt: "Preco de aquisicao do brief." })}
                    tooltip={t({ en: "Base entry price for the project economics.", es: "Precio base de entrada para la economia del proyecto.", pt: "Preco base de entrada para a economia do projeto." })}
                    prefix="$"
                    value={form.purchasePriceUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, purchasePriceUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "After Repair Value (ARV)", es: "After Repair Value (ARV)", pt: "After Repair Value (ARV)" })}
                    hint={t({ en: "Projected value after completion or stabilization.", es: "Valor proyectado despues de completar o estabilizar.", pt: "Valor projetado apos concluir ou estabilizar." })}
                    tooltip={t({ en: "Primary upside benchmark from the brief.", es: "Benchmark principal de upside del brief.", pt: "Benchmark principal de upside do brief." })}
                    prefix="$"
                    value={form.afterRepairValueUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, afterRepairValueUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Rehab budget", es: "Rehab Budget", pt: "Rehab Budget" })}
                    hint={t({ en: "Construction or rehabilitation budget.", es: "Presupuesto de construccion o rehabilitacion.", pt: "Orcamento de construcao ou reabilitacao." })}
                    tooltip={t({ en: "Execution cost allocated to the work scope.", es: "Costo de ejecucion asignado al alcance de obra.", pt: "Custo de execucao alocado ao escopo da obra." })}
                    prefix="$"
                    value={form.rehabBudgetUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, rehabBudgetUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Closing costs", es: "Closing Costs", pt: "Closing Costs" })}
                    hint={t({ en: "Acquisition and transaction closing costs.", es: "Costos de cierre y transaccion.", pt: "Custos de fechamento e transacao." })}
                    tooltip={t({ en: "Administrative and transactional cost bucket.", es: "Bolsa de costos administrativos y transaccionales.", pt: "Bolsa de custos administrativos e transacionais." })}
                    prefix="$"
                    value={form.closingCostsUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, closingCostsUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Holding & misc.", es: "Holding & Misc.", pt: "Holding & Misc." })}
                    hint={t({ en: "Carry, contingency, and miscellaneous operating costs.", es: "Carry, contingencia y costos operativos varios.", pt: "Carry, contingencia e custos operacionais diversos." })}
                    tooltip={t({ en: "Intermediate cost bucket while the project is live.", es: "Bolsa intermedia de costos mientras el proyecto esta vivo.", pt: "Bolsa intermediaria de custos enquanto o projeto esta ativo." })}
                    prefix="$"
                    value={form.holdingCostsUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, holdingCostsUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Selling costs", es: "Selling Costs", pt: "Selling Costs" })}
                    hint={t({ en: "Disposition or commercialization cost bucket.", es: "Bolsa de costos de salida o comercializacion.", pt: "Bolsa de custos de saida ou comercializacao." })}
                    tooltip={t({ en: "Used to explain the net path to exit.", es: "Se usa para explicar la ruta neta hacia la salida.", pt: "Usado para explicar a rota liquida ate a saida." })}
                    prefix="$"
                    value={form.sellingCostsUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, sellingCostsUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Total project cost", es: "Total Project Cost", pt: "Total Project Cost" })}
                    hint={t({ en: "All-in project cost shown to investors.", es: "Costo all-in del proyecto mostrado al inversionista.", pt: "Custo all-in do projeto exibido ao investidor." })}
                    tooltip={t({ en: "Validated against known cost components when present.", es: "Se valida contra los componentes de costo conocidos cuando existan.", pt: "Validado contra os componentes de custo conhecidos quando presentes." })}
                    prefix="$"
                    value={form.totalProjectCostUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, totalProjectCostUsd: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{t({ en: "Fees and investor return", es: "Fees y retorno del inversionista", pt: "Fees e retorno do investidor" })}</p>
                  <p className="text-xs text-white/60">
                    {t({
                      en: "Public economics used to explain fee stack, projected profit, and investor outcome.",
                      es: "Economia publica usada para explicar fees, profit proyectado y resultado para el inversionista.",
                      pt: "Economia publica usada para explicar fees, lucro projetado e resultado para o investidor."
                    })}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <GuidedInputField
                    label={t({ en: "Structuring fee", es: "Structuring Fee", pt: "Structuring Fee" })}
                    hint={t({ en: "Fee charged for structuring the deal participation.", es: "Fee cobrado por estructurar la participacion del deal.", pt: "Fee cobrado pela estruturacao da participacao no deal." })}
                    tooltip={t({ en: "Investor-visible structuring fee in USD.", es: "Fee de estructuracion visible para el inversionista en USD.", pt: "Fee de estruturacao visivel ao investidor em USD." })}
                    prefix="$"
                    value={form.structuringFeeUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, structuringFeeUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Net profit (before distribution)", es: "Net Profit (before distribution)", pt: "Net Profit (before distribution)" })}
                    hint={t({ en: "Projected gross distributable profit before downstream splits.", es: "Profit proyectado antes de splits posteriores.", pt: "Lucro projetado antes de splits posteriores." })}
                    tooltip={t({ en: "Headline projected profit from the brief.", es: "Profit proyectado principal del brief.", pt: "Lucro projetado principal do brief." })}
                    prefix="$"
                    value={form.grossProfitProjectedUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, grossProfitProjectedUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Management fee", es: "Management Fee", pt: "Management Fee" })}
                    hint={t({ en: "Operator or management fee disclosed to investors.", es: "Fee de operador o management informado al inversionista.", pt: "Fee de operador ou management informado ao investidor." })}
                    tooltip={t({ en: "Part of the public fee stack.", es: "Parte del stack publico de fees.", pt: "Parte do stack publico de fees." })}
                    prefix="$"
                    value={form.managementFeeUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, managementFeeUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Broker fee", es: "Broker Fee", pt: "Broker Fee" })}
                    hint={t({ en: "Broker or selling-side fee bucket.", es: "Bolsa de fee broker o lado comercial.", pt: "Bolsa de fee de broker ou lado comercial." })}
                    tooltip={t({ en: "Shown separately to preserve deal transparency.", es: "Se muestra separado para preservar transparencia del deal.", pt: "Exibido separadamente para preservar a transparencia do deal." })}
                    prefix="$"
                    value={form.brokerFeeUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, brokerFeeUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Net profit for investor", es: "Net Profit for Investor", pt: "Net Profit for Investor" })}
                    hint={t({ en: "Projected investor-side net outcome.", es: "Resultado neto proyectado del inversionista.", pt: "Resultado liquido projetado do investidor." })}
                    tooltip={t({ en: "Public-facing investor profit outcome.", es: "Resultado de profit visible para el inversionista.", pt: "Resultado de lucro visivel para o investidor." })}
                    prefix="$"
                    value={form.netInvestorProfitUsd}
                    onChange={(event) => setForm((prev) => ({ ...prev, netInvestorProfitUsd: event.target.value }))}
                  />
                  <GuidedInputField
                    label={t({ en: "Projected net ROI", es: "ROI proyectado", pt: "ROI projetado" })}
                    hint={t({ en: "Net investor ROI from the brief.", es: "ROI neto del inversionista segun el brief.", pt: "ROI liquido do investidor segundo o brief." })}
                    tooltip={t({ en: "Preferred ROI signal for the marketplace.", es: "Senal de ROI preferida para el marketplace.", pt: "Sinal de ROI preferido para o marketplace." })}
                    suffix="%"
                    value={form.projectedNetRoiPct}
                    onChange={(event) => setForm((prev) => ({ ...prev, projectedNetRoiPct: event.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <GuidedSelectField
                  label={t({ en: "Exit strategy", es: "Estrategia de salida", pt: "Estrategia de saida" })}
                  hint={t({ en: "Choose the expected liquidation path for the project.", es: "Selecciona la via esperada de liquidacion del proyecto.", pt: "Selecione a via esperada de liquidacao do projeto." })}
                  tooltip={t({ en: "How investor capital is expected to be recovered at the end of the cycle.", es: "Como se espera recuperar el capital del inversionista al final del ciclo.", pt: "Como se espera recuperar o capital do investidor no fim do ciclo." })}
                  ariaLabel={t({ en: "Exit strategy help", es: "Ayuda de estrategia de salida", pt: "Ajuda da estrategia de saida" })}
                  value={form.buildingExitStrategy}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingExitStrategy: event.target.value }))}
                >
                  <option className="bg-slate-900 text-slate-100" value="">
                    {t({ en: "Select strategy", es: "Selecciona estrategia", pt: "Selecione estrategia" })}
                  </option>
                  {exitStrategyOptions.map((option) => (
                    <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                      {t(option.label)}
                    </option>
                  ))}
                </GuidedSelectField>
                <GuidedInputField
                  label={t({ en: "Project duration", es: "Duracion del proyecto", pt: "Duracao do projeto" })}
                  hint={t({ en: "Prefers total estimated duration from the brief and auto-syncs from dates when available.", es: "Prefiere la duracion total estimada del brief y se autosincroniza con fechas cuando existan.", pt: "Prefere a duracao total estimada do brief e sincroniza automaticamente com datas quando existirem." })}
                  tooltip={t({ en: "Investor-facing duration signal used on marketplace.", es: "Senal de duracion visible para el inversionista en marketplace.", pt: "Sinal de duracao visivel ao investidor no marketplace." })}
                  placeholder={t({ en: "Months", es: "Meses", pt: "Meses" })}
                  suffix={t({ en: "mo", es: "meses", pt: "meses" })}
                  value={form.buildingProjectDurationMonths}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingProjectDurationMonths: event.target.value }))}
                />
                <GuidedInputField
                  label={t({ en: "Licenses status", es: "Estado de licencias", pt: "Status das licencas" })}
                  hint={t({ en: "Use short status like approved, in-process, pending.", es: "Usa estado corto como aprobado, en tramite, pendiente.", pt: "Use status curto como aprovado, em tramitacao, pendente." })}
                  tooltip={t({ en: "Administrative status of permits and municipal approvals.", es: "Estado administrativo de permisos y aprobaciones municipales.", pt: "Status administrativo de permissoes e aprovacoes municipais." })}
                  placeholder="licensesStatus"
                  value={form.buildingLicensesStatus}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingLicensesStatus: event.target.value }))}
                />
                <GuidedInputField
                  label={t({ en: "Fiduciary structure", es: "Estructura fiduciaria", pt: "Estrutura fiduciaria" })}
                  hint={t({ en: "Describe trust/fiduciary setup in one line.", es: "Describe en una linea la estructura fiduciaria.", pt: "Descreva em uma linha a estrutura fiduciaria." })}
                  tooltip={t({ en: "Useful for legal and governance context.", es: "Util para contexto legal y de gobernanza.", pt: "Util para contexto legal e de governanca." })}
                  placeholder="fiduciaryStructure"
                  value={form.buildingFiduciaryStructure}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingFiduciaryStructure: event.target.value }))}
                />
                <GuidedInputField
                  label={t({ en: "Sales progress", es: "Progreso de ventas", pt: "Progresso de vendas" })}
                  hint={t({ en: "Approximate pre-sale/commercialization progress.", es: "Progreso aproximado de preventa/comercializacion.", pt: "Progresso aproximado de pre-venda/comercializacao." })}
                  tooltip={t({ en: "Operational indicator for commercial stage.", es: "Indicador operativo del estado comercial.", pt: "Indicador operacional do estado comercial." })}
                  placeholder="salesProgressPercent"
                  suffix="%"
                  value={form.buildingSalesProgressPercent}
                  onChange={(event) => setForm((prev) => ({ ...prev, buildingSalesProgressPercent: event.target.value }))}
                />
              </div>
              <p className="text-xs text-white/60">
                {t({
                  en: "exitStrategy defines how investors recover value at the end of the cycle (sale, refinance, buyback, etc).",
                  es: "exitStrategy define como recuperan valor los inversionistas al final del ciclo (venta, refinanciacion, recompra, etc).",
                  pt: "exitStrategy define como os investidores recuperam valor no fim do ciclo (venda, refinanciamento, recompra, etc)."
                })}
              </p>
            </>
          )}

          {form.assetType === "rental_property" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <GuidedInputField
                label={t({ en: "Monthly rent estimate", es: "Renta mensual estimada", pt: "Renda mensal estimada" })}
                hint={t({ en: "Base rent amount before expenses.", es: "Monto base de renta antes de gastos.", pt: "Valor base de renda antes de despesas." })}
                tooltip={t({ en: "Primary input used for revenue projections.", es: "Input principal para proyecciones de ingresos.", pt: "Input principal para projecoes de receita." })}
                placeholder="monthlyRentEstimate"
                prefix="$"
                value={form.rentalMonthlyRentEstimate}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalMonthlyRentEstimate: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Annual gross income", es: "Ingreso bruto anual", pt: "Receita bruta anual" })}
                hint={t({ en: "Total yearly income before deductions.", es: "Ingreso total anual antes de deducciones.", pt: "Receita total anual antes de deducoes." })}
                tooltip={t({ en: "Used for ROI and treasury planning.", es: "Se usa para ROI y planificacion financiera.", pt: "Usado para ROI e planejamento financeiro." })}
                placeholder="annualGrossIncome"
                prefix="$"
                value={form.rentalAnnualGrossIncome}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalAnnualGrossIncome: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Occupancy rate", es: "Tasa de ocupacion", pt: "Taxa de ocupacao" })}
                hint={t({ en: "Value between 0 and 100.", es: "Valor entre 0 y 100.", pt: "Valor entre 0 e 100." })}
                tooltip={t({ en: "Operational occupancy of the property.", es: "Nivel de ocupacion operativa del inmueble.", pt: "Nivel de ocupacao operacional do imovel." })}
                placeholder="occupancyRate"
                suffix="%"
                value={form.rentalOccupancyRate}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalOccupancyRate: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Lease start date", es: "Inicio del contrato", pt: "Inicio do contrato" })}
                hint={t({ en: "Date the lease period starts.", es: "Fecha en la que inicia la vigencia del contrato.", pt: "Data em que inicia a vigencia do contrato." })}
                tooltip={t({ en: "Must be earlier than lease end date.", es: "Debe ser anterior a la fecha de fin del contrato.", pt: "Deve ser anterior a data de fim do contrato." })}
                type="date"
                value={form.rentalLeaseStartDate}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalLeaseStartDate: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Lease end date", es: "Fin del contrato", pt: "Fim do contrato" })}
                hint={t({ en: "Date the current lease ends.", es: "Fecha en la que termina el contrato actual.", pt: "Data em que termina o contrato atual." })}
                tooltip={t({ en: "Used to validate lease timeline consistency.", es: "Se usa para validar consistencia del periodo contractual.", pt: "Usado para validar consistencia do periodo contratual." })}
                type="date"
                value={form.rentalLeaseEndDate}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalLeaseEndDate: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Tenant type", es: "Tipo de inquilino", pt: "Tipo de inquilino" })}
                hint={t({ en: "Example: residential, corporate, mixed.", es: "Ejemplo: residencial, corporativo, mixto.", pt: "Exemplo: residencial, corporativo, misto." })}
                tooltip={t({ en: "Helps classify tenant profile and risk.", es: "Ayuda a clasificar perfil y riesgo del arrendatario.", pt: "Ajuda a classificar perfil e risco do locatario." })}
                placeholder="tenantType"
                value={form.rentalTenantType}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalTenantType: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Property manager", es: "Administrador del inmueble", pt: "Administrador do imovel" })}
                hint={t({ en: "Person or company managing operations.", es: "Persona o empresa que opera el activo.", pt: "Pessoa ou empresa que opera o ativo." })}
                tooltip={t({ en: "Operational owner for maintenance and tenant service.", es: "Responsable operativo de mantenimiento y servicio al inquilino.", pt: "Responsavel operacional por manutencao e atendimento ao inquilino." })}
                placeholder="propertyManager"
                value={form.rentalPropertyManager}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalPropertyManager: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Historical yield", es: "Yield historico", pt: "Yield historico" })}
                hint={t({ en: "Past observed rental return.", es: "Retorno historico observado por renta.", pt: "Retorno historico observado por renda." })}
                tooltip={t({ en: "Reference metric for expectations and risk.", es: "Metrica de referencia para expectativas y riesgo.", pt: "Metrica de referencia para expectativas e risco." })}
                placeholder="historicalYield"
                suffix="%"
                value={form.rentalHistoricalYield}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalHistoricalYield: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Maintenance reserve", es: "Reserva de mantenimiento", pt: "Reserva de manutencao" })}
                hint={t({ en: "Planned reserve for upkeep and contingencies.", es: "Reserva planificada para mantenimiento y contingencias.", pt: "Reserva planejada para manutencao e contingencias." })}
                tooltip={t({ en: "Protects yield projections from operational shocks.", es: "Protege proyecciones de yield frente a eventos operativos.", pt: "Protege projecoes de yield contra eventos operacionais." })}
                placeholder="maintenanceReserve"
                prefix="$"
                value={form.rentalMaintenanceReserve}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalMaintenanceReserve: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Current tenant", es: "Inquilino actual", pt: "Inquilino atual" })}
                hint={t({ en: "Optional descriptive reference.", es: "Referencia descriptiva opcional.", pt: "Referencia descritiva opcional." })}
                tooltip={t({ en: "Extra context field for operational follow-up.", es: "Campo extra para seguimiento operativo.", pt: "Campo extra para acompanhamento operacional." })}
                placeholder="currentTenant"
                value={form.rentalCurrentTenant}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalCurrentTenant: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Contract status", es: "Estado del contrato", pt: "Status do contrato" })}
                hint={t({ en: "Optional legal/admin status.", es: "Estado legal/admin opcional.", pt: "Status legal/admin opcional." })}
                tooltip={t({ en: "Extra context field for admin operations.", es: "Campo de contexto adicional para operacion admin.", pt: "Campo de contexto adicional para operacao admin." })}
                placeholder="contractStatus"
                value={form.rentalContractStatus}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalContractStatus: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Payment frequency", es: "Frecuencia de pago", pt: "Frequencia de pagamento" })}
                hint={t({ en: "Example: monthly, quarterly.", es: "Ejemplo: mensual, trimestral.", pt: "Exemplo: mensal, trimestral." })}
                tooltip={t({ en: "Optional field to detail rent payment cadence.", es: "Campo opcional para detallar la cadencia de pago.", pt: "Campo opcional para detalhar a cadencia de pagamento." })}
                placeholder="paymentFrequency"
                value={form.rentalPaymentFrequency}
                onChange={(event) => setForm((prev) => ({ ...prev, rentalPaymentFrequency: event.target.value }))}
              />
            </div>
          )}

          {form.assetType === "land_lot" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <GuidedInputField
                label={t({ en: "Cadastral number", es: "Numero catastral", pt: "Numero cadastral" })}
                hint={t({ en: "Official property registry identifier.", es: "Identificador oficial del registro del predio.", pt: "Identificador oficial do registro do terreno." })}
                tooltip={t({ en: "Used for legal traceability and due diligence.", es: "Se usa para trazabilidad legal y due diligence.", pt: "Usado para rastreabilidade legal e due diligence." })}
                placeholder="cadastralNumber"
                value={form.landCadastralNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, landCadastralNumber: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Land area", es: "Area del lote", pt: "Area do lote" })}
                hint={t({ en: "Total area available for development.", es: "Area total disponible para desarrollo.", pt: "Area total disponivel para desenvolvimento." })}
                tooltip={t({ en: "Supports valuation and zoning feasibility.", es: "Soporta valuacion y factibilidad de uso de suelo.", pt: "Suporta avaliacao e viabilidade de uso do solo." })}
                placeholder="landAreaM2"
                suffix="m²"
                value={form.landAreaM2}
                onChange={(event) => setForm((prev) => ({ ...prev, landAreaM2: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Land use", es: "Uso del suelo", pt: "Uso do terreno" })}
                hint={t({ en: "Primary intended use for the lot.", es: "Uso principal previsto para el lote.", pt: "Uso principal previsto para o terreno." })}
                tooltip={t({ en: "Example: residential, industrial, mixed use.", es: "Ejemplo: residencial, industrial, uso mixto.", pt: "Exemplo: residencial, industrial, uso misto." })}
                placeholder="landUse"
                value={form.landUse}
                onChange={(event) => setForm((prev) => ({ ...prev, landUse: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Zoning classification", es: "Clasificacion de zonificacion", pt: "Classificacao de zoneamento" })}
                hint={t({ en: "Municipal zoning code or category.", es: "Codigo o categoria de zonificacion municipal.", pt: "Codigo ou categoria de zoneamento municipal." })}
                tooltip={t({ en: "Key legal input for permitted development.", es: "Input legal clave para desarrollo permitido.", pt: "Input legal chave para desenvolvimento permitido." })}
                placeholder="zoningClassification"
                value={form.landZoningClassification}
                onChange={(event) => setForm((prev) => ({ ...prev, landZoningClassification: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Appreciation horizon", es: "Horizonte de valorizacion", pt: "Horizonte de valorizacao" })}
                hint={t({ en: "Planned months until expected exit.", es: "Meses planificados hasta la salida esperada.", pt: "Meses planejados ate a saida esperada." })}
                tooltip={t({ en: "Defines expected investment timeline.", es: "Define la linea de tiempo esperada de la inversion.", pt: "Define a linha do tempo esperada do investimento." })}
                placeholder="appreciationHorizonMonths"
                suffix={t({ en: "mo", es: "meses", pt: "meses" })}
                value={form.landAppreciationHorizonMonths}
                onChange={(event) => setForm((prev) => ({ ...prev, landAppreciationHorizonMonths: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Target exit value", es: "Valor objetivo de salida", pt: "Valor alvo de saida" })}
                hint={t({ en: "Projected valuation at disposal time.", es: "Valuacion proyectada al momento de salida.", pt: "Avaliacao projetada no momento da saida." })}
                tooltip={t({ en: "Financial target for upside scenario.", es: "Objetivo financiero para escenario de valorizacion.", pt: "Meta financeira para cenario de valorizacao." })}
                placeholder="targetExitValue"
                prefix="$"
                value={form.landTargetExitValue}
                onChange={(event) => setForm((prev) => ({ ...prev, landTargetExitValue: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Entry price", es: "Precio de entrada", pt: "Preco de entrada" })}
                hint={t({ en: "Acquisition reference value.", es: "Valor de referencia de adquisicion.", pt: "Valor de referencia de aquisicao." })}
                tooltip={t({ en: "Base price used for return calculations.", es: "Precio base usado para calculos de retorno.", pt: "Preco base usado nos calculos de retorno." })}
                placeholder="entryPrice"
                prefix="$"
                value={form.landEntryPrice}
                onChange={(event) => setForm((prev) => ({ ...prev, landEntryPrice: event.target.value }))}
              />
              <GuidedSelectField
                label={t({ en: "Exit strategy", es: "Estrategia de salida", pt: "Estrategia de saida" })}
                hint={t({ en: "Choose disposal strategy at investment maturity.", es: "Selecciona la estrategia de salida al madurar la inversion.", pt: "Selecione a estrategia de saida na maturidade do investimento." })}
                tooltip={t({ en: "Expected monetization route when the land thesis reaches exit.", es: "Ruta esperada de monetizacion cuando la tesis del lote llegue a salida.", pt: "Rota esperada de monetizacao quando a tese do terreno chegar a saida." })}
                ariaLabel={t({ en: "Exit strategy help", es: "Ayuda de estrategia de salida", pt: "Ajuda da estrategia de saida" })}
                value={form.landExitStrategy}
                onChange={(event) => setForm((prev) => ({ ...prev, landExitStrategy: event.target.value }))}
              >
                <option className="bg-slate-900 text-slate-100" value="">
                  {t({ en: "Select strategy", es: "Selecciona estrategia", pt: "Selecione estrategia" })}
                </option>
                {exitStrategyOptions.map((option) => (
                  <option key={option.value} className="bg-slate-900 text-slate-100" value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </GuidedSelectField>
              <GuidedInputField
                label={t({ en: "Urban development potential", es: "Potencial urbanistico", pt: "Potencial urbanistico" })}
                hint={t({ en: "Short thesis on future development upside.", es: "Tesis corta sobre potencial de desarrollo futuro.", pt: "Tese curta sobre potencial de desenvolvimento futuro." })}
                tooltip={t({ en: "Supports qualitative valuation narrative.", es: "Soporta narrativa cualitativa de valorizacion.", pt: "Suporta narrativa qualitativa de valorizacao." })}
                placeholder="urbanDevelopmentPotential"
                value={form.landUrbanDevelopmentPotential}
                onChange={(event) => setForm((prev) => ({ ...prev, landUrbanDevelopmentPotential: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Road access", es: "Acceso vial", pt: "Acesso viario" })}
                hint={t({ en: "Optional road connectivity notes.", es: "Notas opcionales sobre conectividad vial.", pt: "Notas opcionais sobre conectividade viaria." })}
                tooltip={t({ en: "Extra operational context for development feasibility.", es: "Contexto operativo adicional para factibilidad de desarrollo.", pt: "Contexto operacional adicional para viabilidade de desenvolvimento." })}
                placeholder="roadAccess"
                value={form.landRoadAccess}
                onChange={(event) => setForm((prev) => ({ ...prev, landRoadAccess: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Utilities access", es: "Acceso a servicios", pt: "Acesso a servicos" })}
                hint={t({ en: "Optional notes on water, energy, sewage, telecom.", es: "Notas opcionales sobre agua, energia, alcantarillado, telecom.", pt: "Notas opcionais sobre agua, energia, esgoto, telecom." })}
                tooltip={t({ en: "Operational readiness indicator for land projects.", es: "Indicador de preparacion operativa para proyectos de lote.", pt: "Indicador de prontidao operacional para projetos de terreno." })}
                placeholder="utilitiesAccess"
                value={form.landUtilitiesAccess}
                onChange={(event) => setForm((prev) => ({ ...prev, landUtilitiesAccess: event.target.value }))}
              />
              <GuidedInputField
                label={t({ en: "Regulatory status", es: "Estado regulatorio", pt: "Status regulatorio" })}
                hint={t({ en: "Optional legal/regulatory checkpoint.", es: "Checkpoint legal/regulatorio opcional.", pt: "Checkpoint legal/regulatorio opcional." })}
                tooltip={t({ en: "Additional compliance context for admin review.", es: "Contexto adicional de cumplimiento para revision admin.", pt: "Contexto adicional de compliance para revisao admin." })}
                placeholder="regulatoryStatus"
                value={form.landRegulatoryStatus}
                onChange={(event) => setForm((prev) => ({ ...prev, landRegulatoryStatus: event.target.value }))}
              />
            </div>
          )}

          {typeValidation.state === "invalid" && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-rose-100">
              {typeValidation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {(formStatus === "validation-error" || validationErrors.length > 0) && (
        <Card className="space-y-2 border-rose-400/30 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-100">validation-error</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-rose-100">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        className={`space-y-1 ${
          continuationTone === "ready"
            ? "border-emerald-400/40 bg-emerald-500/10"
            : continuationTone === "error"
              ? "border-rose-400/40 bg-rose-500/10"
              : "border-amber-400/40 bg-amber-500/10"
        }`}
      >
        <p
          className={`text-sm ${
            continuationTone === "ready"
              ? "text-emerald-100"
              : continuationTone === "error"
                ? "text-rose-100"
                : "text-amber-100"
          }`}
        >
          {t({ en: "Current UI status", es: "Estado UI actual", pt: "Status atual da UI" })}: {formStatus}
        </p>
        <p
          className={`text-xs ${
            continuationTone === "ready"
              ? "text-emerald-100"
              : continuationTone === "error"
                ? "text-rose-100"
                : "text-amber-100"
          }`}
        >
          {continuationMessage}
        </p>
        {canContinueToMint && (
          <p className="text-sm text-cyan-200">
            {showMintSetup
              ? t({ en: "Mint setup enabled below in this same flow.", es: "Mint setup habilitado abajo en este mismo flujo.", pt: "Mint setup habilitado abaixo neste mesmo fluxo." })
              : t({ en: "Press Continue to mint to open step 2 in this same flow.", es: "Presiona Continuar a mint para abrir el paso 2 en este mismo flujo.", pt: "Pressione Continuar para mint para abrir o passo 2 neste mesmo fluxo." })}
          </p>
        )}
      </Card>

      <Card className="space-y-5 p-4 sm:p-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">
            {t({ en: "Mint seed data", es: "Datos semilla de mint", pt: "Dados base de mint" })}
          </p>
          <p className="max-w-3xl text-sm leading-6 text-white/60">
            {t({
              en: "Review the metadata snapshot that will feed the mint flow before opening deploy and reconciliation.",
              es: "Revisa el snapshot de metadata que alimentara el flujo de mint antes de abrir deploy y reconciliacion.",
              pt: "Revise o snapshot de metadata que vai alimentar o fluxo de mint antes de abrir deploy e reconciliacao."
            })}
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2 xl:gap-4">
          <GuidedInputField
            label={t({ en: "Mint quantity", es: "Cantidad de mint", pt: "Quantidade de mint" })}
            hint={t({ en: "Defines how many fractions can be minted from this asset.", es: "Define cuantas fracciones se pueden mintear desde este activo.", pt: "Define quantas fracoes podem ser mintadas a partir deste ativo." })}
            tooltip={t({ en: "For building assets this value is derived from total units. For other types you can adjust it here.", es: "Para activos building este valor se deriva del total de unidades. Para otros tipos puedes ajustarlo aqui.", pt: "Para ativos building este valor e derivado do total de unidades. Para outros tipos voce pode ajusta-lo aqui." })}
            ariaLabel={t({ en: "Mint quantity help", es: "Ayuda de cantidad de mint", pt: "Ajuda de quantidade de mint" })}
            type="number"
            min={1}
            value={form.assetType === "building_new" ? String(Math.max(0, mintQuantityValue)) : mintQuantity}
            readOnly={form.assetType === "building_new"}
            onChange={form.assetType === "building_new" ? undefined : (event) => setMintQuantity(event.target.value)}
          />
          <GuidedInputField
            label={t({ en: "Cover / URI", es: "Cover / URI", pt: "Cover / URI" })}
            hint={t({ en: "Read-only cover reference passed into mint metadata.", es: "Referencia de portada solo lectura que se pasa a la metadata de mint.", pt: "Referencia de capa somente leitura enviada para a metadata de mint." })}
            tooltip={t({ en: "This mirrors the current cover image selection used by the mint flow.", es: "Esto refleja la seleccion actual de imagen de portada usada por el flujo de mint.", pt: "Isto espelha a selecao atual de imagem de capa usada pelo fluxo de mint." })}
            ariaLabel={t({ en: "Cover URI help", es: "Ayuda de cover URI", pt: "Ajuda de cover URI" })}
            value={form.coverImage}
            readOnly
          />
          <GuidedInputField
            label={t({ en: "Name", es: "Nombre", pt: "Nome" })}
            hint={t({ en: "Read-only asset name that will seed mint metadata.", es: "Nombre del activo solo lectura que alimenta la metadata de mint.", pt: "Nome do ativo somente leitura que alimenta a metadata de mint." })}
            tooltip={t({ en: "This value comes from the identification section above.", es: "Este valor viene de la seccion de identificacion de arriba.", pt: "Este valor vem da secao de identificacao acima." })}
            ariaLabel={t({ en: "Mint name help", es: "Ayuda de nombre para mint", pt: "Ajuda de nome para mint" })}
            value={form.assetName}
            readOnly
          />
          <GuidedInputField
            label={t({ en: "Symbol", es: "Simbolo", pt: "Simbolo" })}
            hint={t({ en: "Read-only collection symbol reused in mint metadata.", es: "Simbolo de coleccion solo lectura reutilizado en la metadata de mint.", pt: "Simbolo de colecao somente leitura reutilizado na metadata de mint." })}
            tooltip={t({ en: "This value comes from the collection section and is reused by the mint setup.", es: "Este valor viene de la seccion de coleccion y se reutiliza en la configuracion de mint.", pt: "Este valor vem da secao de colecao e e reutilizado na configuracao de mint." })}
            ariaLabel={t({ en: "Mint symbol help", es: "Ayuda de simbolo para mint", pt: "Ajuda de simbolo para mint" })}
            value={form.collectionSymbol}
            readOnly
          />
        </div>
        {form.assetType === "building_new" ? (
          <p className="text-xs text-cyan-100/80">
            {t({
              en: "For building type, mint quantity is derived from totalUnits in Differential fields by type.",
              es: "Para tipo building, la cantidad de mint se deriva de totalUnits en Differential fields by type.",
              pt: "Para tipo building, a quantidade de mint e derivada de totalUnits em Differential fields by type."
            })}
          </p>
        ) : null}
        <div className="max-w-4xl">
          <GuidedTextareaField
            label={t({ en: "Description", es: "Descripcion", pt: "Descricao" })}
            hint={t({ en: "Read-only description snapshot used by the mint setup.", es: "Snapshot de descripcion solo lectura usado por la configuracion de mint.", pt: "Snapshot de descricao somente leitura usado pela configuracao de mint." })}
            tooltip={t({ en: "This mirrors the commercial description currently selected above.", es: "Esto refleja la descripcion comercial actualmente seleccionada arriba.", pt: "Isto reflete a descricao comercial atualmente selecionada acima." })}
            ariaLabel={t({ en: "Mint description help", es: "Ayuda de descripcion para mint", pt: "Ajuda de descricao para mint" })}
            className="min-h-[148px] max-w-4xl resize-y leading-6"
            value={form.shortDescription || form.longDescription}
            readOnly
          />
        </div>
      </Card>

      {showMintSetup ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">
                {t({ en: "Step 2: Mint setup", es: "Paso 2: Configuracion de mint", pt: "Passo 2: Configuracao de mint" })}
              </p>
              <p className="text-xs text-white/70">
                {t({ en: "Create Asset -> Continue to mint -> Deploy/Mint/Reconcile in one continuous module.", es: "Create Asset -> Continue to mint -> Deploy/Mint/Reconcile en un solo modulo continuo.", pt: "Create Asset -> Continue to mint -> Deploy/Mint/Reconcile em um unico modulo continuo." })}
              </p>
            </div>
            <Button
              className="min-h-11"
              variant="outline"
              onClick={() => {
                setShowMintSetup(false);
                setCreateAssetMessage("");
                setCreatedMarketplaceEntryId(null);
              }}
            >
              {t({ en: "Back to step 1", es: "Volver al paso 1", pt: "Voltar ao passo 1" })}
            </Button>
          </div>
          <CoreCandyMachinePanel
            prefill={{
              collectionName: form.collectionName || form.assetName || "Core CM Collection",
              assetNamePrefix: form.assetName || "Asset",
              internalCode: form.internalCode || "",
              assetUri: "",
              imageUrl: form.coverImage || "",
              quantity: mintQuantityValue > 0 ? mintQuantityValue : 1,
              description: form.shortDescription || form.longDescription || "",
              symbol: form.collectionSymbol || "",
              nftPriceUsd: deriveNftPriceUsd(form),
              nftPriceInputCurrency: priceInputCurrency,
              solUsdRate
            }}
            snapshotContext={{
              draftId,
              formSnapshot: snapshotFormData
            }}
            onSnapshotFinalized={(result) => {
              setSnapshotFinalize(result);
              setCreateAssetMessage("");
              setCreatedMarketplaceEntryId(null);
            }}
            onDeployCompleted={(result) => {
              setDeployCompletedData(result);
              setCreateAssetMessage("");
              setCreatedMarketplaceEntryId(null);
            }}
          />
          <div
            className={`space-y-2 rounded-xl border px-3 py-3 text-xs ${
              deployCompletedData
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border-amber-400/40 bg-amber-500/10 text-amber-100"
            }`}
          >
            <p className="font-semibold uppercase tracking-[0.12em]">
              {t({ en: "Create Asset Gate", es: "Gate Create Asset", pt: "Gate Create Asset" })}
            </p>
            <p>
              {deployCompletedData
                ? (
                  t({
                    en: "Deploy succeeded. You can continue with Create Asset without minting in this phase.",
                    es: "El deploy fue exitoso. Ya puedes continuar con Create Asset sin mintear en esta fase.",
                    pt: "O deploy foi bem-sucedido. Voce ja pode continuar com Create Asset sem mint nesta fase."
                  })
                )
                : t({
                  en: "Complete deploy to enable Create Asset.",
                  es: "Completa el deploy para habilitar Create Asset.",
                  pt: "Conclua o deploy para habilitar Create Asset."
                })}
            </p>
            {snapshotFinalize?.verificationError?.message && !deployCompletedData ? (
              <p>{snapshotFinalize.verificationError.message}</p>
            ) : null}
            {deployCompletedData ? (
              <p>
                {t({ en: "Candy Machine:", es: "Candy Machine:", pt: "Candy Machine:" })} {deployCompletedData.candyMachineAddress}
              </p>
            ) : null}
            {deployCompletedData ? (
              <p>
                {t({ en: "Collection:", es: "Collection:", pt: "Collection:" })} {deployCompletedData.collectionAddress}
              </p>
            ) : null}
            {createAssetMessage ? (
              <p className={createdMarketplaceEntryId ? "text-cyan-100" : "text-rose-100"}>{createAssetMessage}</p>
            ) : null}
            {createdMarketplaceEntryId ? (
              <Link className="text-cyan-200 underline underline-offset-2" href={`/marketplace/${createdMarketplaceEntryId}`} target="_blank">
                {t({ en: "Open marketplace entry", es: "Abrir entrada en marketplace", pt: "Abrir entrada no marketplace" })}
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#070b14]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2">
          <Link href="/admin/assets">
            <Button className="min-h-11" variant="ghost">
              {t({ en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
            </Button>
          </Link>
          {showMintSetup ? (
            <Button
              className="min-h-11"
              onClick={() => {
                void handleCreateAsset();
              }}
              disabled={!deployCompletedData || isCreatingMarketplaceEntry || Boolean(createdMarketplaceEntryId)}
            >
              {isCreatingMarketplaceEntry
                ? t({ en: "Creating...", es: "Creando...", pt: "Criando..." })
                : createdMarketplaceEntryId
                  ? t({ en: "Entry created", es: "Entrada creada", pt: "Entrada criada" })
                  : t({ en: "Create Asset", es: "Create Asset", pt: "Create Asset" })}
            </Button>
          ) : null}
          {!showMintSetup ? (
            <Button className="min-h-11" onClick={continueToMint}>
              {t({ en: "Continue to mint", es: "Continuar a mint", pt: "Continuar para mint" })}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
