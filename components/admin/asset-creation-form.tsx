"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import {
  CoreCandyMachinePanel
} from "@/components/admin/core-candy-machine-panel";
import { useAssetCreationFormState, useAssetImportJobs, useAssetUploadWorkflow } from "@/components/admin/asset-creation";
import type { AssetForm, AssetType, FileUploadField, TypeFormState } from "@/components/admin/asset-creation/types";
import {
  AssetCollectionSection,
  AssetCommercialDescriptionSection,
  AssetCreationIntroSection,
  AssetIdentificationSection,
  AssetImportSection,
  AssetLocationSection,
  AssetMediaSection,
  AssetTypeSelectionSection
} from "@/components/admin/asset-creation/sections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applyFinancialRule,
  mapImportRowToFormFields,
  suggestCollectionFromIdentity
} from "@/lib/admin/asset-form";
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

  if (form.assetType === "building_new" && form.buildingTotalUnits.trim()) {
    highlights.push(`Total units: ${form.buildingTotalUnits.trim()}`);
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
    importPreviewCount,
    importHeaders,
    importMessage,
    importSubmitting,
    importJob,
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
    setImportPreviewCount,
    setImportHeaders,
    setImportMessage,
    setImportSubmitting,
    setImportJob,
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
      if (!form.buildingDeveloperName.trim()) errors.push(t({ en: "developerName is required.", es: "developerName obligatorio.", pt: "developerName obrigatorio." }));
      if (!form.buildingProjectStage.trim()) errors.push(t({ en: "projectStage is required.", es: "projectStage obligatorio.", pt: "projectStage obrigatorio." }));
      if (!form.buildingEstimatedDeliveryDate.trim()) errors.push(t({ en: "estimatedDeliveryDate is required.", es: "estimatedDeliveryDate obligatorio.", pt: "estimatedDeliveryDate obrigatorio." }));
      if (Number(form.buildingFundingGoal || "0") <= 0) errors.push(t({ en: "fundingGoal must be greater than 0.", es: "fundingGoal debe ser mayor a 0.", pt: "fundingGoal deve ser maior que 0." }));
      if (Number(form.buildingNftCost || "0") <= 0) errors.push(t({ en: "nftCost must be greater than 0.", es: "nftCost debe ser mayor a 0.", pt: "nftCost deve ser maior que 0." }));
      if (Number(form.buildingTotalUnits || "0") <= 0) errors.push(t({ en: "totalUnits must be greater than 0.", es: "totalUnits debe ser mayor a 0.", pt: "totalUnits deve ser maior que 0." }));
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

  const applyFinancialSource = (source: "totalUnits" | "nftCost", nextValue: string) => {
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
  };

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

  const {
    previewImportFromText,
    enqueueImportFromText,
    onImportFileInput
  } = useAssetImportJobs({
    draftId,
    importText,
    importFileName,
    importJob,
    setImportSubmitting,
    setImportMessage,
    setImportJob,
    setImportHeaders,
    setImportPreviewCount,
    setImportFileName,
    t,
    onApplyImportedRow: applyImportedRow
  });

  const saveDraft = async () => {
    setFormStatus("saving");
    setValidationErrors([]);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setFormStatus("saved");
  };

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

    const payload = {
      entryId: normalizeMarketplaceEntryId(form.slug, form.internalCode || draftId),
      title: form.assetName.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      address: form.address.trim() || `${form.city.trim()}, ${form.country.trim()}`,
      imageUrl: form.coverImage.trim(),
      shortDescription: (form.shortDescription.trim() || form.longDescription.trim() || form.assetName.trim()),
      highlights: buildMarketplaceHighlights(form),
      investmentNotes: (form.investmentThesis.trim() || form.riskNotes.trim() || "").trim(),
      supplyTotal: mintQuantityValue > 0 ? mintQuantityValue : 1,
      nftPriceUsd,
      annualRoiPct,
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
      <AssetImportSection
        t={t}
        importFileName={importFileName}
        importText={importText}
        importPreviewCount={importPreviewCount}
        importHeaders={importHeaders}
        importMessage={importMessage}
        importSubmitting={importSubmitting}
        importJob={importJob}
        setImportText={setImportText}
        previewImportFromText={previewImportFromText}
        enqueueImportFromText={enqueueImportFromText}
        onImportFileInput={onImportFileInput}
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
                <Input placeholder="projectStage" value={form.buildingProjectStage} onChange={(event) => setForm((prev) => ({ ...prev, buildingProjectStage: event.target.value }))} />
                <Input placeholder="developerName" value={form.buildingDeveloperName} onChange={(event) => setForm((prev) => ({ ...prev, buildingDeveloperName: event.target.value }))} />
                <div className="space-y-1">
                  <p className="text-xs text-white/60">estimatedDeliveryDate</p>
                  <Input type="date" value={form.buildingEstimatedDeliveryDate} onChange={(event) => setForm((prev) => ({ ...prev, buildingEstimatedDeliveryDate: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/60">constructionStartDate</p>
                  <Input type="date" value={form.buildingConstructionStartDate} onChange={(event) => setForm((prev) => ({ ...prev, buildingConstructionStartDate: event.target.value }))} />
                </div>
                <Input placeholder="fundingGoal (fixed reference)" value={form.buildingFundingGoal} onChange={(event) => onFundingGoalChange(event.target.value)} />
                <Input placeholder="totalUnits" value={form.buildingTotalUnits} onChange={(event) => applyFinancialSource("totalUnits", event.target.value)} />
                <Input placeholder="nftCost" value={form.buildingNftCost} onChange={(event) => applyFinancialSource("nftCost", event.target.value)} />
                <Input placeholder="expectedAnnualReturn (%)" value={form.buildingExpectedAnnualReturn} onChange={(event) => setForm((prev) => ({ ...prev, buildingExpectedAnnualReturn: event.target.value }))} />
                <div className="space-y-1">
                  <p className="text-xs text-white/60">exitStrategy</p>
                  <select
                    className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none ring-0 focus:border-cyan-300/60"
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
                  </select>
                </div>
                <Input placeholder="projectDurationMonths" value={form.buildingProjectDurationMonths} onChange={(event) => setForm((prev) => ({ ...prev, buildingProjectDurationMonths: event.target.value }))} />
                <Input placeholder="licensesStatus (extra)" value={form.buildingLicensesStatus} onChange={(event) => setForm((prev) => ({ ...prev, buildingLicensesStatus: event.target.value }))} />
                <Input placeholder="fiduciaryStructure (extra)" value={form.buildingFiduciaryStructure} onChange={(event) => setForm((prev) => ({ ...prev, buildingFiduciaryStructure: event.target.value }))} />
                <Input placeholder="salesProgressPercent (extra)" value={form.buildingSalesProgressPercent} onChange={(event) => setForm((prev) => ({ ...prev, buildingSalesProgressPercent: event.target.value }))} />
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
              <Input placeholder="monthlyRentEstimate" value={form.rentalMonthlyRentEstimate} onChange={(event) => setForm((prev) => ({ ...prev, rentalMonthlyRentEstimate: event.target.value }))} />
              <Input placeholder="annualGrossIncome" value={form.rentalAnnualGrossIncome} onChange={(event) => setForm((prev) => ({ ...prev, rentalAnnualGrossIncome: event.target.value }))} />
              <Input placeholder="occupancyRate (0-100)" value={form.rentalOccupancyRate} onChange={(event) => setForm((prev) => ({ ...prev, rentalOccupancyRate: event.target.value }))} />
              <Input placeholder="leaseStartDate (YYYY-MM-DD)" value={form.rentalLeaseStartDate} onChange={(event) => setForm((prev) => ({ ...prev, rentalLeaseStartDate: event.target.value }))} />
              <Input placeholder="leaseEndDate (YYYY-MM-DD)" value={form.rentalLeaseEndDate} onChange={(event) => setForm((prev) => ({ ...prev, rentalLeaseEndDate: event.target.value }))} />
              <Input placeholder="tenantType" value={form.rentalTenantType} onChange={(event) => setForm((prev) => ({ ...prev, rentalTenantType: event.target.value }))} />
              <Input placeholder="propertyManager" value={form.rentalPropertyManager} onChange={(event) => setForm((prev) => ({ ...prev, rentalPropertyManager: event.target.value }))} />
              <Input placeholder="historicalYield" value={form.rentalHistoricalYield} onChange={(event) => setForm((prev) => ({ ...prev, rentalHistoricalYield: event.target.value }))} />
              <Input placeholder="maintenanceReserve" value={form.rentalMaintenanceReserve} onChange={(event) => setForm((prev) => ({ ...prev, rentalMaintenanceReserve: event.target.value }))} />
              <Input placeholder="currentTenant (extra)" value={form.rentalCurrentTenant} onChange={(event) => setForm((prev) => ({ ...prev, rentalCurrentTenant: event.target.value }))} />
              <Input placeholder="contractStatus (extra)" value={form.rentalContractStatus} onChange={(event) => setForm((prev) => ({ ...prev, rentalContractStatus: event.target.value }))} />
              <Input placeholder="paymentFrequency (extra)" value={form.rentalPaymentFrequency} onChange={(event) => setForm((prev) => ({ ...prev, rentalPaymentFrequency: event.target.value }))} />
            </div>
          )}

          {form.assetType === "land_lot" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="cadastralNumber" value={form.landCadastralNumber} onChange={(event) => setForm((prev) => ({ ...prev, landCadastralNumber: event.target.value }))} />
              <Input placeholder="landAreaM2" value={form.landAreaM2} onChange={(event) => setForm((prev) => ({ ...prev, landAreaM2: event.target.value }))} />
              <Input placeholder="landUse" value={form.landUse} onChange={(event) => setForm((prev) => ({ ...prev, landUse: event.target.value }))} />
              <Input placeholder="zoningClassification" value={form.landZoningClassification} onChange={(event) => setForm((prev) => ({ ...prev, landZoningClassification: event.target.value }))} />
              <Input placeholder="appreciationHorizonMonths" value={form.landAppreciationHorizonMonths} onChange={(event) => setForm((prev) => ({ ...prev, landAppreciationHorizonMonths: event.target.value }))} />
              <Input placeholder="targetExitValue" value={form.landTargetExitValue} onChange={(event) => setForm((prev) => ({ ...prev, landTargetExitValue: event.target.value }))} />
              <Input placeholder="entryPrice" value={form.landEntryPrice} onChange={(event) => setForm((prev) => ({ ...prev, landEntryPrice: event.target.value }))} />
              <div className="space-y-1">
                <p className="text-xs text-white/60">exitStrategy</p>
                <select
                  className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none ring-0 focus:border-cyan-300/60"
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
                </select>
              </div>
              <Input placeholder="urbanDevelopmentPotential" value={form.landUrbanDevelopmentPotential} onChange={(event) => setForm((prev) => ({ ...prev, landUrbanDevelopmentPotential: event.target.value }))} />
              <Input placeholder="roadAccess (extra)" value={form.landRoadAccess} onChange={(event) => setForm((prev) => ({ ...prev, landRoadAccess: event.target.value }))} />
              <Input placeholder="utilitiesAccess (extra)" value={form.landUtilitiesAccess} onChange={(event) => setForm((prev) => ({ ...prev, landUtilitiesAccess: event.target.value }))} />
              <Input placeholder="regulatoryStatus (extra)" value={form.landRegulatoryStatus} onChange={(event) => setForm((prev) => ({ ...prev, landRegulatoryStatus: event.target.value }))} />
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

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">
          {t({ en: "Mint seed data", es: "Datos semilla de mint", pt: "Dados base de mint" })}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-white/70">
            {t({ en: "Mint quantity", es: "Cantidad de mint", pt: "Quantidade de mint" })}
            {form.assetType === "building_new" ? (
              <Input type="number" min={1} value={String(Math.max(0, mintQuantityValue))} readOnly />
            ) : (
              <Input
                type="number"
                min={1}
                value={mintQuantity}
                onChange={(event) => setMintQuantity(event.target.value)}
              />
            )}
          </label>
          <label className="space-y-1 text-xs text-white/70">
            {t({ en: "Cover / URI", es: "Cover / URI", pt: "Cover / URI" })}
            <Input value={form.coverImage} readOnly />
          </label>
          <label className="space-y-1 text-xs text-white/70">
            {t({ en: "Name", es: "Nombre", pt: "Nome" })}
            <Input value={form.assetName} readOnly />
          </label>
          <label className="space-y-1 text-xs text-white/70">
            {t({ en: "Symbol", es: "Simbolo", pt: "Simbolo" })}
            <Input value={form.collectionSymbol} readOnly />
          </label>
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
        <label className="space-y-1 text-xs text-white/70">
          {t({ en: "Description", es: "Descripcion", pt: "Descricao" })}
          <textarea
            className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white"
            value={form.shortDescription || form.longDescription}
            readOnly
          />
        </label>
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
              symbol: form.collectionSymbol || ""
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
          <Button className="min-h-11" variant="outline" onClick={saveDraft}>
            {t({ en: "Save draft", es: "Guardar borrador", pt: "Salvar rascunho" })}
          </Button>
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
