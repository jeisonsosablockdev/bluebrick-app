"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";
import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applyFinancialRule,
  mapImportRowToFormFields,
  parseTabularText,
  parseTextFileToTabularRows,
  suggestCollectionFromIdentity
} from "@/lib/admin/asset-form";
import {
  parseCollectionName,
  parseCollectionSymbol,
  parseExitStrategy
} from "@/lib/admin/asset-compatibility-validation";
import {
  type AssetUploadCategory,
  type FinalizeResponse,
  uploadAssetFileViaSignedUrl
} from "@/lib/admin/asset-upload-client";

type AssetType = "building_new" | "rental_property" | "land_lot" | "";
type FormStatus = "draft" | "saving" | "saved" | "validation-error";
type TypeFormState = "incomplete" | "valid" | "invalid";
type FileUploadField = "coverImage" | "galleryImages" | "brochureFile" | "legalDocs" | "financialDocs" | "propertyImages";
type UploadFieldUiState = {
  uploading: boolean;
  message: string;
  error: string;
};

type ImportJobState =
  | "queued"
  | "processing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "delayed";

type ImportJobErrorItem = {
  row: number | null;
  column: string | null;
  code: string;
  message: string;
};

type ImportJobTracker = {
  importJobId: string;
  statusUrl: string;
  state: ImportJobState;
  delayed: boolean;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  warningsCount: number;
  errorReportUrl: string | null;
  errors: ImportJobErrorItem[];
  error: string;
};

type AssetForm = {
  assetType: AssetType;
  assetName: string;
  slug: string;
  internalCode: string;
  country: string;
  state: string;
  city: string;
  address: string;
  geoLat: string;
  geoLng: string;
  shortDescription: string;
  longDescription: string;
  investmentThesis: string;
  riskNotes: string;
  coverImage: string;
  galleryImages: string[];
  videoUrl: string;
  brochureFile: string;
  legalDocs: string[];
  financialDocs: string[];
  propertyImages: string[];
  collectionName: string;
  collectionSymbol: string;
  buildingProjectStage: string;
  buildingDeveloperName: string;
  buildingEstimatedDeliveryDate: string;
  buildingConstructionStartDate: string;
  buildingTotalUnits: string;
  buildingFundingGoal: string;
  buildingNftCost: string;
  buildingExpectedAnnualReturn: string;
  buildingExitStrategy: string;
  buildingProjectDurationMonths: string;
  buildingLicensesStatus: string;
  buildingFiduciaryStructure: string;
  buildingSalesProgressPercent: string;
  rentalMonthlyRentEstimate: string;
  rentalAnnualGrossIncome: string;
  rentalOccupancyRate: string;
  rentalLeaseStartDate: string;
  rentalLeaseEndDate: string;
  rentalTenantType: string;
  rentalPropertyManager: string;
  rentalHistoricalYield: string;
  rentalMaintenanceReserve: string;
  rentalCurrentTenant: string;
  rentalContractStatus: string;
  rentalPaymentFrequency: string;
  landCadastralNumber: string;
  landAreaM2: string;
  landUse: string;
  landZoningClassification: string;
  landAppreciationHorizonMonths: string;
  landTargetExitValue: string;
  landEntryPrice: string;
  landExitStrategy: string;
  landUrbanDevelopmentPotential: string;
  landRoadAccess: string;
  landUtilitiesAccess: string;
  landRegulatoryStatus: string;
};

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

const initialForm: AssetForm = {
  assetType: "",
  assetName: "",
  slug: "",
  internalCode: "",
  country: "",
  state: "",
  city: "",
  address: "",
  geoLat: "",
  geoLng: "",
  shortDescription: "",
  longDescription: "",
  investmentThesis: "",
  riskNotes: "",
  coverImage: "",
  galleryImages: [],
  videoUrl: "",
  brochureFile: "",
  legalDocs: [],
  financialDocs: [],
  propertyImages: [],
  collectionName: "",
  collectionSymbol: "",
  buildingProjectStage: "",
  buildingDeveloperName: "",
  buildingEstimatedDeliveryDate: "",
  buildingConstructionStartDate: "",
  buildingTotalUnits: "",
  buildingFundingGoal: "",
  buildingNftCost: "",
  buildingExpectedAnnualReturn: "",
  buildingExitStrategy: "",
  buildingProjectDurationMonths: "",
  buildingLicensesStatus: "",
  buildingFiduciaryStructure: "",
  buildingSalesProgressPercent: "",
  rentalMonthlyRentEstimate: "",
  rentalAnnualGrossIncome: "",
  rentalOccupancyRate: "",
  rentalLeaseStartDate: "",
  rentalLeaseEndDate: "",
  rentalTenantType: "",
  rentalPropertyManager: "",
  rentalHistoricalYield: "",
  rentalMaintenanceReserve: "",
  rentalCurrentTenant: "",
  rentalContractStatus: "",
  rentalPaymentFrequency: "",
  landCadastralNumber: "",
  landAreaM2: "",
  landUse: "",
  landZoningClassification: "",
  landAppreciationHorizonMonths: "",
  landTargetExitValue: "",
  landEntryPrice: "",
  landExitStrategy: "",
  landUrbanDevelopmentPotential: "",
  landRoadAccess: "",
  landUtilitiesAccess: "",
  landRegulatoryStatus: ""
};

const initialUploadState: Record<FileUploadField, UploadFieldUiState> = {
  coverImage: { uploading: false, message: "", error: "" },
  galleryImages: { uploading: false, message: "", error: "" },
  brochureFile: { uploading: false, message: "", error: "" },
  legalDocs: { uploading: false, message: "", error: "" },
  financialDocs: { uploading: false, message: "", error: "" },
  propertyImages: { uploading: false, message: "", error: "" }
};

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

function fieldToUploadCategory(field: FileUploadField): AssetUploadCategory {
  if (field === "propertyImages") {
    return "propertyImage";
  }

  if (field === "brochureFile") {
    return "brochureFile";
  }

  if (field === "legalDocs") {
    return "legalDoc";
  }

  if (field === "financialDocs") {
    return "financialDoc";
  }

  return "galleryImage";
}

function updateListField(current: string[], fileNames: string[]): string[] {
  const merged = [...fileNames, ...current];
  const unique = Array.from(new Set(merged.map((name) => name.trim()).filter(Boolean)));
  return unique.slice(0, 20);
}

function parseImportJobState(value: unknown): ImportJobState {
  if (
    value === "queued" ||
    value === "processing" ||
    value === "completed" ||
    value === "completed_with_errors" ||
    value === "failed" ||
    value === "delayed"
  ) {
    return value;
  }

  return "queued";
}

function isTerminalImportJobState(state: ImportJobState): boolean {
  return state === "completed" || state === "completed_with_errors" || state === "failed";
}

function toSafeNonNegativeNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
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

export function AssetCreationForm(): ReactElement {
  const { t } = useI18n();
  const [draftId] = useState<string>(() => createDraftId());
  const [form, setForm] = useState<AssetForm>(initialForm);
  const [formStatus, setFormStatus] = useState<FormStatus>("draft");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [collectionNameManual, setCollectionNameManual] = useState(false);
  const [collectionSymbolManual, setCollectionSymbolManual] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importPreviewCount, setImportPreviewCount] = useState(0);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importMessage, setImportMessage] = useState<string>("");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importJob, setImportJob] = useState<ImportJobTracker | null>(null);
  const [dragTargetField, setDragTargetField] = useState<FileUploadField | null>(null);
  const [uploadState, setUploadState] = useState<Record<FileUploadField, UploadFieldUiState>>(initialUploadState);
  const [uploadRefs, setUploadRefs] = useState<Record<FileUploadField, string[]>>({
    coverImage: [],
    galleryImages: [],
    brochureFile: [],
    legalDocs: [],
    financialDocs: [],
    propertyImages: []
  });

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
    return errors;
  }, [form, t]);

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
  }, [form.internalCode, form.slug, collectionNameManual, collectionSymbolManual]);

  const patchUploadState = (field: FileUploadField, patch: Partial<UploadFieldUiState>) => {
    setUploadState((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...patch
      }
    }));
  };

  const applySuccessfulUploads = (field: FileUploadField, uploaded: FinalizeResponse[]) => {
    if (uploaded.length === 0) {
      return;
    }

    const cdnUrls = uploaded.map((item) => item.cdnUrl);
    const fileRefIds = uploaded.map((item) => item.fileRefId);

    setUploadRefs((prev) => ({
      ...prev,
      [field]: updateListField(prev[field], fileRefIds)
    }));

    if (field === "coverImage" || field === "brochureFile") {
      const firstUrl = cdnUrls[0];
      if (!firstUrl) {
        return;
      }

      setForm((prev) => ({ ...prev, [field]: firstUrl }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: updateListField(prev[field], cdnUrls) }));
  };

  const applyFilesToField = async (field: FileUploadField, files: File[]) => {
    if (files.length === 0) {
      return;
    }

    patchUploadState(field, {
      uploading: true,
      error: "",
      message: t({ en: "Uploading...", es: "Subiendo...", pt: "Enviando..." })
    });

    const uploaded: FinalizeResponse[] = [];
    const failed: string[] = [];
    const category = fieldToUploadCategory(field);
    const previousSingleFieldCdnUrl = (field === "coverImage" || field === "brochureFile")
      ? form[field].trim()
      : "";

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (!file) {
        continue;
      }

      patchUploadState(field, {
        message: t({
          en: `Uploading ${index + 1}/${files.length}: ${file.name}`,
          es: `Subiendo ${index + 1}/${files.length}: ${file.name}`,
          pt: `Enviando ${index + 1}/${files.length}: ${file.name}`
        })
      });

      try {
        const result = await uploadAssetFileViaSignedUrl({
          file,
          category,
          draftId,
          previousCdnUrl: previousSingleFieldCdnUrl || null
        });
        uploaded.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown upload error.";
        failed.push(`${file.name}: ${message}`);
      }
    }

    applySuccessfulUploads(field, uploaded);

    patchUploadState(field, {
      uploading: false,
      message: uploaded.length > 0
        ? t({
          en: `${uploaded.length} file(s) uploaded.`,
          es: `${uploaded.length} archivo(s) subidos.`,
          pt: `${uploaded.length} arquivo(s) enviados.`
        })
        : "",
      error: failed.join(" | ")
    });
  };

  const onFileInput = (field: FileUploadField) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      void applyFilesToField(field, Array.from(files));
      event.target.value = "";
    };

  const onFileDragOver = (field: FileUploadField) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (dragTargetField !== field) {
        setDragTargetField(field);
      }
    };

  const onFileDragLeave = (field: FileUploadField) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
        return;
      }
      if (dragTargetField === field) {
        setDragTargetField(null);
      }
    };

  const onFileDrop = (field: FileUploadField) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragTargetField(null);
      const files = Array.from(event.dataTransfer.files ?? []);
      void applyFilesToField(field, files);
    };

  const uploadFieldValue = (field: FileUploadField): string => {
    if (field === "coverImage") return form.coverImage;
    if (field === "brochureFile") return form.brochureFile;
    if (field === "galleryImages") return form.galleryImages.join(", ");
    if (field === "legalDocs") return form.legalDocs.join(", ");
    if (field === "financialDocs") return form.financialDocs.join(", ");
    return form.propertyImages.join(", ");
  };

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

  const setTrackedImportJobFromStatus = useCallback((
    input: {
      importJobId: string;
      statusUrl: string;
      state: unknown;
      delayed?: unknown;
      totalRows?: unknown;
      processedRows?: unknown;
      failedRows?: unknown;
      warningsCount?: unknown;
      errorReportUrl?: unknown;
    }
  ) => {
    const parsedState = parseImportJobState(input.state);
    const parsedErrorReportUrl = typeof input.errorReportUrl === "string" ? input.errorReportUrl : null;

    setImportJob((prev) => {
      if (prev && prev.importJobId === input.importJobId) {
        return {
          ...prev,
          state: parsedState,
          delayed: Boolean(input.delayed),
          totalRows: toSafeNonNegativeNumber(input.totalRows),
          processedRows: toSafeNonNegativeNumber(input.processedRows),
          failedRows: toSafeNonNegativeNumber(input.failedRows),
          warningsCount: toSafeNonNegativeNumber(input.warningsCount),
          errorReportUrl: parsedErrorReportUrl,
          error: ""
        };
      }

      return {
        importJobId: input.importJobId,
        statusUrl: input.statusUrl,
        state: parsedState,
        delayed: Boolean(input.delayed),
        totalRows: toSafeNonNegativeNumber(input.totalRows),
        processedRows: toSafeNonNegativeNumber(input.processedRows),
        failedRows: toSafeNonNegativeNumber(input.failedRows),
        warningsCount: toSafeNonNegativeNumber(input.warningsCount),
        errorReportUrl: parsedErrorReportUrl,
        errors: [],
        error: ""
      };
    });
  }, []);

  const fetchImportJobErrors = useCallback(async (input: {
    importJobId: string;
    errorReportUrl: string;
  }) => {
    try {
      const separator = input.errorReportUrl.includes("?") ? "&" : "?";
      const response = await fetch(`${input.errorReportUrl}${separator}limit=10&offset=0`, {
        method: "GET",
        cache: "no-store"
      });

      const payload = await response.json().catch(() => null) as {
        errors?: Array<{
          row?: unknown;
          column?: unknown;
          code?: unknown;
          message?: unknown;
        }>;
      } | null;

      if (!response.ok) {
        throw new Error(readApiErrorMessage(payload, "Could not fetch import errors."));
      }

      const mappedErrors: ImportJobErrorItem[] = Array.isArray(payload?.errors)
        ? payload.errors.map((item) => ({
          row: typeof item.row === "number" ? item.row : null,
          column: typeof item.column === "string" ? item.column : null,
          code: typeof item.code === "string" ? item.code : "UNKNOWN",
          message: typeof item.message === "string" ? item.message : "Unknown error"
        }))
        : [];

      setImportJob((prev) => {
        if (!prev || prev.importJobId !== input.importJobId) {
          return prev;
        }

        return {
          ...prev,
          errors: mappedErrors
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not fetch import errors.";
      setImportJob((prev) => {
        if (!prev || prev.importJobId !== input.importJobId) {
          return prev;
        }

        return {
          ...prev,
          error: message
        };
      });
    }
  }, []);

  const pollImportJobStatus = useCallback(async (input: {
    importJobId: string;
    statusUrl: string;
  }) => {
    const response = await fetch(input.statusUrl, {
      method: "GET",
      cache: "no-store"
    });

    const payload = await response.json().catch(() => null) as {
      importJobId?: unknown;
      state?: unknown;
      delayed?: unknown;
      totalRows?: unknown;
      processedRows?: unknown;
      failedRows?: unknown;
      warningsCount?: unknown;
      errorReportUrl?: unknown;
      error?: {
        message?: unknown;
      };
    } | null;

    if (!response.ok) {
      throw new Error(readApiErrorMessage(payload, "Could not fetch import job status."));
    }

    const responseJobId = typeof payload?.importJobId === "string" ? payload.importJobId : input.importJobId;
    setTrackedImportJobFromStatus({
      importJobId: responseJobId,
      statusUrl: input.statusUrl,
      state: payload?.state,
      delayed: payload?.delayed,
      totalRows: payload?.totalRows,
      processedRows: payload?.processedRows,
      failedRows: payload?.failedRows,
      warningsCount: payload?.warningsCount,
      errorReportUrl: payload?.errorReportUrl
    });

    const parsedState = parseImportJobState(payload?.state);
    const parsedErrorReportUrl = typeof payload?.errorReportUrl === "string" ? payload.errorReportUrl : null;

    if ((parsedState === "completed_with_errors" || parsedState === "failed") && parsedErrorReportUrl) {
      await fetchImportJobErrors({
        importJobId: responseJobId,
        errorReportUrl: parsedErrorReportUrl
      });
    }
  }, [fetchImportJobErrors, setTrackedImportJobFromStatus]);

  const enqueueImportJobRequest = useCallback(async (request: {
    csvText?: string;
    file?: File;
    fileName?: string;
    mimeType?: string;
  }) => {
    setImportSubmitting(true);
    setImportMessage(
      t({
        en: "Creating async import job...",
        es: "Creando job de importacion asincrona...",
        pt: "Criando job de importacao assincrona..."
      })
    );

    try {
      let response: Response;

      if (request.file) {
        const formData = new FormData();
        formData.set("file", request.file);
        formData.set("draftId", draftId);
        formData.set("idempotencyKey", `${draftId}:${request.file.name}:${request.file.size}:${request.file.lastModified}`);

        response = await fetch("/api/admin/assets/import-jobs", {
          method: "POST",
          body: formData
        });
      } else {
        response = await fetch("/api/admin/assets/import-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draftId,
            fileName: request.fileName ?? "pasted-import.csv",
            mimeType: request.mimeType ?? "text/csv",
            csvText: request.csvText ?? ""
          })
        });
      }

      const payload = await response.json().catch(() => null) as {
        importJobId?: unknown;
        statusUrl?: unknown;
        state?: unknown;
        error?: {
          message?: unknown;
        };
      } | null;

      if (!response.ok) {
        throw new Error(readApiErrorMessage(payload, "Could not create import job."));
      }

      const importJobId = typeof payload?.importJobId === "string" ? payload.importJobId : "";
      const statusUrl = typeof payload?.statusUrl === "string" ? payload.statusUrl : "";

      if (!importJobId || !statusUrl) {
        throw new Error("Import job response is missing required fields.");
      }

      setTrackedImportJobFromStatus({
        importJobId,
        statusUrl,
        state: payload?.state
      });

      setImportMessage(
        t({
          en: "Import job created. Validating rows in background...",
          es: "Job de importacion creado. Validando filas en segundo plano...",
          pt: "Job de importacao criado. Validando linhas em segundo plano..."
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create import job.";
      setImportMessage(message);
    } finally {
      setImportSubmitting(false);
    }
  }, [draftId, setTrackedImportJobFromStatus, t]);

  useEffect(() => {
    if (!importJob?.importJobId || !importJob.statusUrl) {
      return;
    }

    if (isTerminalImportJobState(importJob.state)) {
      return;
    }

    const trackedJobId = importJob.importJobId;
    const trackedStatusUrl = importJob.statusUrl;
    let active = true;

    const tick = async () => {
      if (!active) {
        return;
      }

      try {
        await pollImportJobStatus({
          importJobId: trackedJobId,
          statusUrl: trackedStatusUrl
        });
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : "Could not fetch import job status.";
        setImportJob((prev) => {
          if (!prev || prev.importJobId !== trackedJobId) {
            return prev;
          }

          return {
            ...prev,
            error: message
          };
        });
      }
    };

    void tick();
    const intervalId = setInterval(() => {
      void tick();
    }, 2500);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [importJob?.importJobId, importJob?.statusUrl, importJob?.state, pollImportJobStatus]);

  const previewImportFromText = () => {
    const parsed = parseTabularText(importText);
    setImportHeaders(parsed.headers);
    setImportPreviewCount(parsed.rows.length);
    if (parsed.rows.length > 0) {
      applyImportedRow(parsed.rows[0] ?? {});
      setImportMessage(t({
        en: "Imported preview row into the form.",
        es: "Se importo la fila de vista previa al formulario.",
        pt: "Linha de pre-visualizacao importada para o formulario."
      }));
    } else {
      setImportMessage(t({
        en: "No valid rows found in pasted content.",
        es: "No se encontraron filas validas en el contenido pegado.",
        pt: "Nenhuma linha valida encontrada no conteudo colado."
      }));
    }
  };

  const enqueueImportFromText = async () => {
    const parsed = parseTabularText(importText);
    setImportHeaders(parsed.headers);
    setImportPreviewCount(parsed.rows.length);

    if (parsed.rows.length === 0) {
      setImportMessage(t({
        en: "No valid rows found in pasted content.",
        es: "No se encontraron filas validas en el contenido pegado.",
        pt: "Nenhuma linha valida encontrada no conteudo colado."
      }));
      return;
    }

    applyImportedRow(parsed.rows[0] ?? {});
    await enqueueImportJobRequest({
      csvText: importText,
      fileName: importFileName || "pasted-import.csv",
      mimeType: "text/csv"
    });
  };

  const onImportFileInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportFileName(file.name);
      const text = await file.text();
      const parsed = parseTextFileToTabularRows(file.name, text);
      setImportHeaders(parsed.headers);
      setImportPreviewCount(parsed.rows.length);

      if (parsed.rows.length > 0) {
        applyImportedRow(parsed.rows[0] ?? {});
        await enqueueImportJobRequest({ file });
      } else {
        setImportMessage(t({
          en: "File parsed but no rows were detected.",
          es: "Se proceso el archivo pero no se detectaron filas.",
          pt: "Arquivo processado, mas nenhuma linha foi detectada."
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown import error.";
      setImportMessage(message);
    } finally {
      event.target.value = "";
    }
  };

  const saveDraft = async () => {
    setFormStatus("saving");
    setValidationErrors([]);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setFormStatus("saved");
  };

  const continueToMint = async () => {
    if (!canContinueToMint) {
      setValidationErrors([...requiredErrors, ...typeValidation.errors, ...compatibilityErrors]);
      setFormStatus("validation-error");
      return;
    }

    setFormStatus("saving");
    await new Promise((resolve) => setTimeout(resolve, 350));
    setFormStatus("saved");
  };

  return (
    <div className="space-y-4 pb-24">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Create tokenizable asset", es: "Crear activo tokenizable", pt: "Criar ativo tokenizavel" })}</h2>
        <p className="text-sm text-white/75">
          {t({
            en: "Create the master asset record. Rule: one collection per asset, and mint cannot be enabled without a defined asset.",
            es: "Crea el registro maestro del activo. Regla: una coleccion por activo y no se habilita mint sin activo definido.",
            pt: "Crie o registro mestre do ativo. Regra: uma colecao por ativo, e o mint nao e habilitado sem ativo definido."
          })}
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Initial step: type selection", es: "Paso inicial: seleccion de tipo", pt: "Passo inicial: selecao de tipo" })}</p>
        <div className="grid gap-3 md:grid-cols-3">
          {assetTypeOptions.map((option) => {
            const active = form.assetType === option.value;
            return (
              <button
                key={option.value}
                className={`rounded-xl border p-3 text-left ${active ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}
                onClick={() => setForm((prev) => ({ ...prev, assetType: option.value }))}
                type="button"
              >
                <p className="font-medium text-white">{t(option.title)}</p>
                <p className="text-xs text-white/70">{t(option.subtitle)}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Identification", es: "Identificacion", pt: "Identificacao" })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="assetName" value={form.assetName} onChange={(event) => setForm((prev) => ({ ...prev, assetName: event.target.value }))} />
          <Input placeholder="slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <Input placeholder="internalCode" value={form.internalCode} onChange={(event) => setForm((prev) => ({ ...prev, internalCode: event.target.value }))} />
        </div>
        <p className="text-xs text-white/60">
          {t({
            en: "Commercial asset status is derived from on-chain state and is not manually selected here.",
            es: "El estado comercial del activo se deriva del estado on-chain y no se selecciona manualmente aqui.",
            pt: "O status comercial do ativo e derivado do estado on-chain e nao e selecionado manualmente aqui."
          })}
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Location", es: "Ubicacion", pt: "Localizacao" })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="country" value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
          <Input placeholder="state" value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
          <Input placeholder="city" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
          <Input placeholder="address" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
          <Input placeholder="geoLat (opcional)" value={form.geoLat} onChange={(event) => setForm((prev) => ({ ...prev, geoLat: event.target.value }))} />
          <Input placeholder="geoLng (opcional)" value={form.geoLng} onChange={(event) => setForm((prev) => ({ ...prev, geoLng: event.target.value }))} />
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Commercial description", es: "Descripcion comercial", pt: "Descricao comercial" })}</p>
        <div className="grid gap-3">
          <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="shortDescription" value={form.shortDescription} onChange={(event) => setForm((prev) => ({ ...prev, shortDescription: event.target.value }))} />
          <textarea className="min-h-24 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="longDescription" value={form.longDescription} onChange={(event) => setForm((prev) => ({ ...prev, longDescription: event.target.value }))} />
          <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="investmentThesis" value={form.investmentThesis} onChange={(event) => setForm((prev) => ({ ...prev, investmentThesis: event.target.value }))} />
          <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="riskNotes" value={form.riskNotes} onChange={(event) => setForm((prev) => ({ ...prev, riskNotes: event.target.value }))} />
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Media and documents", es: "Media y documentos", pt: "Midia e documentos" })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            {t({ en: "coverImage (required)", es: "coverImage (obligatoria)", pt: "coverImage (obrigatoria)" })}
            <div
              className={`mt-2 rounded-xl border border-dashed p-3 transition ${
                dragTargetField === "coverImage"
                  ? "border-cyan-300/70 bg-cyan-500/10"
                  : "border-white/20 bg-slate-900/50"
              }`}
              onDragOver={onFileDragOver("coverImage")}
              onDragLeave={onFileDragLeave("coverImage")}
              onDrop={onFileDrop("coverImage")}
            >
              <input id="upload-coverImage" className="sr-only" type="file" onChange={onFileInput("coverImage")} />
              <p className="text-xs text-white/60">{t({ en: "Drag and drop file here", es: "Arrastra y suelta archivo aqui", pt: "Arraste e solte arquivo aqui" })}</p>
              <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-coverImage">
                {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
              </label>
            </div>
            <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{form.coverImage || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
            {renderUploadFieldFeedback("coverImage")}
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            galleryImages[]
            <div
              className={`mt-2 rounded-xl border border-dashed p-3 transition ${
                dragTargetField === "galleryImages"
                  ? "border-cyan-300/70 bg-cyan-500/10"
                  : "border-white/20 bg-slate-900/50"
              }`}
              onDragOver={onFileDragOver("galleryImages")}
              onDragLeave={onFileDragLeave("galleryImages")}
              onDrop={onFileDrop("galleryImages")}
            >
              <input id="upload-galleryImages" className="sr-only" type="file" multiple onChange={onFileInput("galleryImages")} />
              <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
              <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-galleryImages">
                {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
              </label>
            </div>
            <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("galleryImages") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
            {renderUploadFieldFeedback("galleryImages")}
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            brochureFile
            <div
              className={`mt-2 rounded-xl border border-dashed p-3 transition ${
                dragTargetField === "brochureFile"
                  ? "border-cyan-300/70 bg-cyan-500/10"
                  : "border-white/20 bg-slate-900/50"
              }`}
              onDragOver={onFileDragOver("brochureFile")}
              onDragLeave={onFileDragLeave("brochureFile")}
              onDrop={onFileDrop("brochureFile")}
            >
              <input id="upload-brochureFile" className="sr-only" type="file" onChange={onFileInput("brochureFile")} />
              <p className="text-xs text-white/60">{t({ en: "Drag and drop file here", es: "Arrastra y suelta archivo aqui", pt: "Arraste e solte arquivo aqui" })}</p>
              <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-brochureFile">
                {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
              </label>
            </div>
            <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{form.brochureFile || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
            {renderUploadFieldFeedback("brochureFile")}
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            legalDocs[]
            <div
              className={`mt-2 rounded-xl border border-dashed p-3 transition ${
                dragTargetField === "legalDocs"
                  ? "border-cyan-300/70 bg-cyan-500/10"
                  : "border-white/20 bg-slate-900/50"
              }`}
              onDragOver={onFileDragOver("legalDocs")}
              onDragLeave={onFileDragLeave("legalDocs")}
              onDrop={onFileDrop("legalDocs")}
            >
              <input id="upload-legalDocs" className="sr-only" type="file" multiple onChange={onFileInput("legalDocs")} />
              <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
              <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-legalDocs">
                {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
              </label>
            </div>
            <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("legalDocs") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
            {renderUploadFieldFeedback("legalDocs")}
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            financialDocs[]
            <div
              className={`mt-2 rounded-xl border border-dashed p-3 transition ${
                dragTargetField === "financialDocs"
                  ? "border-cyan-300/70 bg-cyan-500/10"
                  : "border-white/20 bg-slate-900/50"
              }`}
              onDragOver={onFileDragOver("financialDocs")}
              onDragLeave={onFileDragLeave("financialDocs")}
              onDrop={onFileDrop("financialDocs")}
            >
              <input id="upload-financialDocs" className="sr-only" type="file" multiple onChange={onFileInput("financialDocs")} />
              <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
              <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-financialDocs">
                {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
              </label>
            </div>
            <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("financialDocs") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
            {renderUploadFieldFeedback("financialDocs")}
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            propertyImages[]
            <div
              className={`mt-2 rounded-xl border border-dashed p-3 transition ${
                dragTargetField === "propertyImages"
                  ? "border-cyan-300/70 bg-cyan-500/10"
                  : "border-white/20 bg-slate-900/50"
              }`}
              onDragOver={onFileDragOver("propertyImages")}
              onDragLeave={onFileDragLeave("propertyImages")}
              onDrop={onFileDrop("propertyImages")}
            >
              <input id="upload-propertyImages" className="sr-only" type="file" multiple onChange={onFileInput("propertyImages")} />
              <p className="text-xs text-white/60">{t({ en: "Drag and drop files here", es: "Arrastra y suelta archivos aqui", pt: "Arraste e solte arquivos aqui" })}</p>
              <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20" htmlFor="upload-propertyImages">
                {t({ en: "Choose files", es: "Elegir archivos", pt: "Escolher arquivos" })}
              </label>
            </div>
            <p className="mt-1 max-h-16 overflow-y-auto break-all pr-1 text-xs leading-relaxed text-white/60">{uploadFieldValue("propertyImages") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
            {renderUploadFieldFeedback("propertyImages")}
          </label>
        </div>
        <Input placeholder={t({ en: "videoUrl optional", es: "videoUrl opcional", pt: "videoUrl opcional" })} value={form.videoUrl} onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))} />
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">{t({ en: "NFT / Collection relationship", es: "Relacion NFT / Coleccion", pt: "Relacao NFT / Colecao" })}</p>
          <Button
            className="min-h-11"
            variant="ghost"
            onClick={() => {
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
            }}
          >
            {t({ en: "Reset suggested values", es: "Resetear valores sugeridos", pt: "Resetar valores sugeridos" })}
          </Button>
        </div>
        <p className="text-xs text-white/60">
          {t({
            en: "collectionName and collectionSymbol are auto-suggested from slug + internalCode. You can override manually.",
            es: "collectionName y collectionSymbol se sugieren automaticamente desde slug + internalCode. Puedes sobreescribirlos manualmente.",
            pt: "collectionName e collectionSymbol sao sugeridos automaticamente por slug + internalCode. Voce pode sobrescrever manualmente."
          })}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder={t({ en: "collectionName (required to continue)", es: "collectionName (obligatorio para continuar)", pt: "collectionName (obrigatorio para continuar)" })}
            value={form.collectionName}
            onChange={(event) => {
              setCollectionNameManual(true);
              setForm((prev) => ({ ...prev, collectionName: event.target.value }));
            }}
          />
          <Input
            placeholder="collectionSymbol"
            value={form.collectionSymbol}
            onChange={(event) => {
              setCollectionSymbolManual(true);
              setForm((prev) => ({ ...prev, collectionSymbol: event.target.value }));
            }}
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Quick import (CSV or paste from Excel)", es: "Importacion rapida (CSV o pegado desde Excel)", pt: "Importacao rapida (CSV ou colar do Excel)" })}</p>
        <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          <p>{t({ en: "Import file (.csv, .txt, .tsv)", es: "Importar archivo (.csv, .txt, .tsv)", pt: "Importar arquivo (.csv, .txt, .tsv)" })}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input id="quick-import-file" className="sr-only" type="file" accept=".csv,.txt,.tsv" onChange={onImportFileInput} />
            <label
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              htmlFor="quick-import-file"
            >
              {t({ en: "Choose file", es: "Elegir archivo", pt: "Escolher arquivo" })}
            </label>
            <p className="text-xs text-white/60">
              {importFileName || t({ en: "No file selected", es: "Sin archivo seleccionado", pt: "Nenhum arquivo selecionado" })}
            </p>
          </div>
        </div>
        <textarea
          className="min-h-24 resize-none appearance-none rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white"
          placeholder={t({
            en: "Paste cells copied from Excel (tabular content with header row).",
            es: "Pega celdas copiadas desde Excel (contenido tabular con fila de encabezados).",
            pt: "Cole celulas copiadas do Excel (conteudo tabular com linha de cabecalho)."
          })}
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button className="min-h-11" disabled={importSubmitting} variant="outline" onClick={previewImportFromText}>
            {t({ en: "Preview and apply first row", es: "Previsualizar y aplicar primera fila", pt: "Pre-visualizar e aplicar primeira linha" })}
          </Button>
          <Button className="min-h-11" disabled={importSubmitting} onClick={() => void enqueueImportFromText()}>
            {importSubmitting
              ? t({ en: "Queueing import...", es: "Encolando importacion...", pt: "Enfileirando importacao..." })
              : t({ en: "Queue async import", es: "Encolar importacion async", pt: "Enfileirar importacao async" })}
          </Button>
          <p className="text-xs text-white/60">
            {t({ en: "Columns detected", es: "Columnas detectadas", pt: "Colunas detectadas" })}: {importHeaders.length}
          </p>
          <p className="text-xs text-white/60">
            {t({ en: "Rows detected", es: "Filas detectadas", pt: "Linhas detectadas" })}: {importPreviewCount}
          </p>
        </div>
        {importMessage && <p className="text-xs text-cyan-100">{importMessage}</p>}
        {importJob && (
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/5 p-3 text-xs text-cyan-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {t({ en: "Import job", es: "Import job", pt: "Import job" })}: {importJob.importJobId}
              </p>
              <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-wide">
                {importJob.state}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cyan-100/90">
              <p>
                {t({ en: "processed", es: "procesadas", pt: "processadas" })}: {importJob.processedRows}/{importJob.totalRows}
              </p>
              <p>
                {t({ en: "failed", es: "fallidas", pt: "falhas" })}: {importJob.failedRows}
              </p>
              <p>
                {t({ en: "warnings", es: "advertencias", pt: "avisos" })}: {importJob.warningsCount}
              </p>
            </div>
            {importJob.delayed && (
              <p className="mt-2 text-[11px] text-amber-200">
                {t({
                  en: "Import is delayed. Worker retry is active.",
                  es: "La importacion esta demorada. El worker sigue reintentando.",
                  pt: "A importacao esta atrasada. O worker segue tentando."
                })}
              </p>
            )}
            {importJob.error && (
              <p className="mt-2 text-[11px] text-rose-200">{importJob.error}</p>
            )}
            {importJob.errors.length > 0 && (
              <div className="mt-2 space-y-1 text-[11px]">
                <p className="font-semibold text-rose-100">
                  {t({ en: "Top import errors", es: "Errores principales", pt: "Erros principais" })}
                </p>
                {importJob.errors.slice(0, 5).map((error, index) => (
                  <p key={`${error.code}-${error.row ?? "na"}-${index}`} className="text-rose-100/90">
                    {error.row !== null ? `#${error.row} ` : ""}{error.column ? `${error.column}: ` : ""}{error.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

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
          <Link className="text-sm text-cyan-200 underline" href="/admin/mint">
            {t({ en: "Go to mint console", es: "Ir a consola de mint", pt: "Ir para console de mint" })}
          </Link>
        )}
      </Card>

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
          <Button className="min-h-11" onClick={continueToMint}>
            {t({ en: "Continue to mint", es: "Continuar a mint", pt: "Continuar para mint" })}
          </Button>
        </div>
      </div>
    </div>
  );
}
