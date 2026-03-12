"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AssetType = "building_new" | "rental_property" | "land_lot" | "";
type AssetStatus = "draft" | "published" | "paused" | "sold_out" | "closed";
type FormStatus = "draft" | "saving" | "saved" | "validation-error";
type TypeFormState = "incomplete" | "valid" | "invalid";

type AssetForm = {
  assetType: AssetType;
  assetName: string;
  slug: string;
  internalCode: string;
  status: AssetStatus;
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
  metadataBaseName: string;
  metadataBaseUri: string;
  buildingProjectStage: string;
  buildingDeveloperName: string;
  buildingEstimatedDeliveryDate: string;
  buildingConstructionStartDate: string;
  buildingTotalUnits: string;
  buildingFundingGoal: string;
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

const initialForm: AssetForm = {
  assetType: "",
  assetName: "",
  slug: "",
  internalCode: "",
  status: "draft",
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
  metadataBaseName: "",
  metadataBaseUri: "",
  buildingProjectStage: "",
  buildingDeveloperName: "",
  buildingEstimatedDeliveryDate: "",
  buildingConstructionStartDate: "",
  buildingTotalUnits: "",
  buildingFundingGoal: "",
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

function updateListField(current: string[], fileName: string): string[] {
  return [fileName, ...current].slice(0, 6);
}

export function AssetCreationForm(): ReactElement {
  const { t } = useI18n();
  const [form, setForm] = useState<AssetForm>(initialForm);
  const [formStatus, setFormStatus] = useState<FormStatus>("draft");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    if (!form.collectionName.trim()) {
      errors.push(t({ en: "Collection name is required to continue.", es: "Collection name es obligatorio para continuar.", pt: "Collection name e obrigatorio para continuar." }));
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

  const canContinueToMint = requiredErrors.length === 0 && typeValidation.state === "valid";

  const onFileInput = (field: "coverImage" | "galleryImages" | "brochureFile" | "legalDocs" | "financialDocs" | "propertyImages") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      if (field === "coverImage" || field === "brochureFile") {
        setForm((prev) => ({ ...prev, [field]: file.name }));
        return;
      }

      setForm((prev) => ({ ...prev, [field]: updateListField(prev[field], file.name) }));
    };

  const saveDraft = async () => {
    setFormStatus("saving");
    setValidationErrors([]);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setFormStatus("saved");
  };

  const continueToMint = async () => {
    if (!canContinueToMint) {
      setValidationErrors([...requiredErrors, ...typeValidation.errors]);
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
          <select
            className="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-slate-100"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as AssetStatus }))}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="paused">paused</option>
            <option value="sold_out">sold_out</option>
            <option value="closed">closed</option>
          </select>
        </div>
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
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("coverImage")} />
            <p className="mt-1 text-xs text-white/60">{form.coverImage || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            galleryImages[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("galleryImages")} />
            <p className="mt-1 text-xs text-white/60">{form.galleryImages.join(", ") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            brochureFile
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("brochureFile")} />
            <p className="mt-1 text-xs text-white/60">{form.brochureFile || t({ en: "No file", es: "Sin archivo", pt: "Sem arquivo" })}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            legalDocs[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("legalDocs")} />
            <p className="mt-1 text-xs text-white/60">{form.legalDocs.join(", ") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            financialDocs[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("financialDocs")} />
            <p className="mt-1 text-xs text-white/60">{form.financialDocs.join(", ") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            propertyImages[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("propertyImages")} />
            <p className="mt-1 text-xs text-white/60">{form.propertyImages.join(", ") || t({ en: "No files", es: "Sin archivos", pt: "Sem arquivos" })}</p>
          </label>
        </div>
        <Input placeholder={t({ en: "videoUrl optional", es: "videoUrl opcional", pt: "videoUrl opcional" })} value={form.videoUrl} onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))} />
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "NFT / Collection relationship", es: "Relacion NFT / Coleccion", pt: "Relacao NFT / Colecao" })}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder={t({ en: "collectionName (required to continue)", es: "collectionName (obligatorio para continuar)", pt: "collectionName (obrigatorio para continuar)" })} value={form.collectionName} onChange={(event) => setForm((prev) => ({ ...prev, collectionName: event.target.value }))} />
          <Input placeholder="collectionSymbol" value={form.collectionSymbol} onChange={(event) => setForm((prev) => ({ ...prev, collectionSymbol: event.target.value }))} />
          <Input placeholder="metadataBaseName" value={form.metadataBaseName} onChange={(event) => setForm((prev) => ({ ...prev, metadataBaseName: event.target.value }))} />
          <Input placeholder={t({ en: "metadataBaseUri optional", es: "metadataBaseUri opcional", pt: "metadataBaseUri opcional" })} value={form.metadataBaseUri} onChange={(event) => setForm((prev) => ({ ...prev, metadataBaseUri: event.target.value }))} />
        </div>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="projectStage" value={form.buildingProjectStage} onChange={(event) => setForm((prev) => ({ ...prev, buildingProjectStage: event.target.value }))} />
              <Input placeholder="developerName" value={form.buildingDeveloperName} onChange={(event) => setForm((prev) => ({ ...prev, buildingDeveloperName: event.target.value }))} />
              <Input placeholder="estimatedDeliveryDate (YYYY-MM-DD)" value={form.buildingEstimatedDeliveryDate} onChange={(event) => setForm((prev) => ({ ...prev, buildingEstimatedDeliveryDate: event.target.value }))} />
              <Input placeholder="constructionStartDate" value={form.buildingConstructionStartDate} onChange={(event) => setForm((prev) => ({ ...prev, buildingConstructionStartDate: event.target.value }))} />
              <Input placeholder="totalUnits" value={form.buildingTotalUnits} onChange={(event) => setForm((prev) => ({ ...prev, buildingTotalUnits: event.target.value }))} />
              <Input placeholder="fundingGoal" value={form.buildingFundingGoal} onChange={(event) => setForm((prev) => ({ ...prev, buildingFundingGoal: event.target.value }))} />
              <Input placeholder="expectedAnnualReturn" value={form.buildingExpectedAnnualReturn} onChange={(event) => setForm((prev) => ({ ...prev, buildingExpectedAnnualReturn: event.target.value }))} />
              <Input placeholder="exitStrategy" value={form.buildingExitStrategy} onChange={(event) => setForm((prev) => ({ ...prev, buildingExitStrategy: event.target.value }))} />
              <Input placeholder="projectDurationMonths" value={form.buildingProjectDurationMonths} onChange={(event) => setForm((prev) => ({ ...prev, buildingProjectDurationMonths: event.target.value }))} />
              <Input placeholder="licensesStatus (extra)" value={form.buildingLicensesStatus} onChange={(event) => setForm((prev) => ({ ...prev, buildingLicensesStatus: event.target.value }))} />
              <Input placeholder="fiduciaryStructure (extra)" value={form.buildingFiduciaryStructure} onChange={(event) => setForm((prev) => ({ ...prev, buildingFiduciaryStructure: event.target.value }))} />
              <Input placeholder="salesProgressPercent (extra)" value={form.buildingSalesProgressPercent} onChange={(event) => setForm((prev) => ({ ...prev, buildingSalesProgressPercent: event.target.value }))} />
            </div>
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
              <Input placeholder="exitStrategy" value={form.landExitStrategy} onChange={(event) => setForm((prev) => ({ ...prev, landExitStrategy: event.target.value }))} />
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

      <Card className="space-y-1 border-cyan-400/30 bg-cyan-500/5">
        <p className="text-sm text-cyan-100">{t({ en: "Current UI status", es: "Estado UI actual", pt: "Status atual da UI" })}: {formStatus}</p>
        <p className="text-xs text-cyan-100">
          {t({
            en: "Rules: cannot continue without asset type. Cannot advance to mint without defined asset and collection.",
            es: "Reglas: no se puede continuar sin tipo de activo. No se puede avanzar al mint sin activo y coleccion definidos.",
            pt: "Regras: nao e possivel continuar sem tipo de ativo. Nao e possivel avancar para mint sem ativo e colecao definidos."
          })}
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
