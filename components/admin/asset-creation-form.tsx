"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import Link from "next/link";

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

const assetTypeOptions: Array<{ value: Exclude<AssetType, "">; title: string; subtitle: string }> = [
  { value: "building_new", title: "Edificio nuevo", subtitle: "Activo en fase de desarrollo o entrega." },
  { value: "rental_property", title: "Propiedad en renta", subtitle: "Activo enfocado en flujo de renta recurrente." },
  { value: "land_lot", title: "Lote de engorde", subtitle: "Activo con tesis de valorizacion futura." }
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
  const [form, setForm] = useState<AssetForm>(initialForm);
  const [formStatus, setFormStatus] = useState<FormStatus>("draft");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const requiredErrors = useMemo(() => {
    const errors: string[] = [];

    if (!form.assetType) {
      errors.push("Debes seleccionar tipo de activo.");
    }
    if (!form.assetName.trim()) {
      errors.push("Nombre del activo es obligatorio.");
    }
    if (!form.country.trim() || !form.city.trim()) {
      errors.push("Ciudad y pais son obligatorios.");
    }
    if (!form.coverImage.trim()) {
      errors.push("Cover image es obligatoria.");
    }
    if (!form.collectionName.trim()) {
      errors.push("Collection name es obligatorio para continuar.");
    }

    return errors;
  }, [form]);

  const typeValidation = useMemo<{ state: TypeFormState; errors: string[] }>(() => {
    if (!form.assetType) {
      return { state: "incomplete", errors: ["Selecciona un tipo de activo para validar campos diferenciales."] };
    }

    const errors: string[] = [];

    if (form.assetType === "building_new") {
      if (!form.buildingDeveloperName.trim()) errors.push("developerName obligatorio.");
      if (!form.buildingProjectStage.trim()) errors.push("projectStage obligatorio.");
      if (!form.buildingEstimatedDeliveryDate.trim()) errors.push("estimatedDeliveryDate obligatorio.");
      if (Number(form.buildingFundingGoal || "0") <= 0) errors.push("fundingGoal debe ser mayor a 0.");
    }

    if (form.assetType === "rental_property") {
      const occupancy = Number(form.rentalOccupancyRate || "0");
      if (Number(form.rentalMonthlyRentEstimate || "0") <= 0) errors.push("monthlyRentEstimate debe ser mayor a 0.");
      if (occupancy < 0 || occupancy > 100) errors.push("occupancyRate debe estar entre 0 y 100.");
      if (form.rentalLeaseStartDate && form.rentalLeaseEndDate && form.rentalLeaseStartDate > form.rentalLeaseEndDate) {
        errors.push("leaseStartDate no puede ser mayor a leaseEndDate.");
      }
    }

    if (form.assetType === "land_lot") {
      if (Number(form.landAreaM2 || "0") <= 0) errors.push("landAreaM2 debe ser mayor a 0.");
      if (Number(form.landAppreciationHorizonMonths || "0") <= 0) errors.push("appreciationHorizonMonths debe ser mayor a 0.");
      if (Number(form.landEntryPrice || "0") <= 0) errors.push("entryPrice debe ser mayor a 0.");
      if (!form.landUse.trim()) errors.push("landUse es obligatorio.");
    }

    if (errors.length > 0) {
      return { state: "invalid", errors };
    }

    return { state: "valid", errors: [] };
  }, [form]);

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
        <h2 className="text-lg font-semibold text-white">Crear activo tokenizable</h2>
        <p className="text-sm text-white/75">
          Crea el registro maestro del activo. Regla: una coleccion por activo y no se habilita mint sin activo definido.
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Paso inicial: seleccion de tipo</p>
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
                <p className="font-medium text-white">{option.title}</p>
                <p className="text-xs text-white/70">{option.subtitle}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Identificacion</p>
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
        <p className="text-sm font-semibold text-white">Ubicacion</p>
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
        <p className="text-sm font-semibold text-white">Descripcion comercial</p>
        <div className="grid gap-3">
          <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="shortDescription" value={form.shortDescription} onChange={(event) => setForm((prev) => ({ ...prev, shortDescription: event.target.value }))} />
          <textarea className="min-h-24 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="longDescription" value={form.longDescription} onChange={(event) => setForm((prev) => ({ ...prev, longDescription: event.target.value }))} />
          <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="investmentThesis" value={form.investmentThesis} onChange={(event) => setForm((prev) => ({ ...prev, investmentThesis: event.target.value }))} />
          <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="riskNotes" value={form.riskNotes} onChange={(event) => setForm((prev) => ({ ...prev, riskNotes: event.target.value }))} />
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Media y documentos</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            coverImage (obligatoria)
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("coverImage")} />
            <p className="mt-1 text-xs text-white/60">{form.coverImage || "Sin archivo"}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            galleryImages[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("galleryImages")} />
            <p className="mt-1 text-xs text-white/60">{form.galleryImages.join(", ") || "Sin archivos"}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            brochureFile
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("brochureFile")} />
            <p className="mt-1 text-xs text-white/60">{form.brochureFile || "Sin archivo"}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            legalDocs[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("legalDocs")} />
            <p className="mt-1 text-xs text-white/60">{form.legalDocs.join(", ") || "Sin archivos"}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            financialDocs[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("financialDocs")} />
            <p className="mt-1 text-xs text-white/60">{form.financialDocs.join(", ") || "Sin archivos"}</p>
          </label>
          <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
            propertyImages[]
            <input className="mt-2 block w-full text-xs" type="file" onChange={onFileInput("propertyImages")} />
            <p className="mt-1 text-xs text-white/60">{form.propertyImages.join(", ") || "Sin archivos"}</p>
          </label>
        </div>
        <Input placeholder="videoUrl opcional" value={form.videoUrl} onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))} />
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Relacion NFT / Coleccion</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="collectionName (obligatorio para continuar)" value={form.collectionName} onChange={(event) => setForm((prev) => ({ ...prev, collectionName: event.target.value }))} />
          <Input placeholder="collectionSymbol" value={form.collectionSymbol} onChange={(event) => setForm((prev) => ({ ...prev, collectionSymbol: event.target.value }))} />
          <Input placeholder="metadataBaseName" value={form.metadataBaseName} onChange={(event) => setForm((prev) => ({ ...prev, metadataBaseName: event.target.value }))} />
          <Input placeholder="metadataBaseUri opcional" value={form.metadataBaseUri} onChange={(event) => setForm((prev) => ({ ...prev, metadataBaseUri: event.target.value }))} />
        </div>
      </Card>

      {form.assetType && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Campos diferenciales por tipo</p>
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
        <p className="text-sm text-cyan-100">Estado UI actual: {formStatus}</p>
        <p className="text-xs text-cyan-100">
          Reglas: no se puede continuar sin tipo de activo. No se puede avanzar al mint sin activo y coleccion definidos.
        </p>
        {canContinueToMint && (
          <Link className="text-sm text-cyan-200 underline" href="/admin/mint">
            Ir a consola de mint
          </Link>
        )}
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#070b14]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-end gap-2">
          <Link href="/admin/assets">
            <Button className="min-h-11" variant="ghost">
              Cancelar
            </Button>
          </Link>
          <Button className="min-h-11" variant="outline" onClick={saveDraft}>
            Guardar borrador
          </Button>
          <Button className="min-h-11" onClick={continueToMint}>
            Continuar a mint
          </Button>
        </div>
      </div>
    </div>
  );
}
