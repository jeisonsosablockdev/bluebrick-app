"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type KycStatusKey = "not_started" | "pending" | "in_review" | "approved" | "rejected" | "requires_action";

type ProfileKycModuleProps = {
  wallet: string;
};

type UploadedDocument = {
  label: string;
  fileName: string;
  valid: boolean;
  message: string;
};

const KYC_STATUS_LABELS: Record<KycStatusKey, string> = {
  not_started: "No iniciado",
  pending: "Pendiente",
  in_review: "En revision",
  approved: "Aprobado",
  rejected: "Rechazado",
  requires_action: "Requiere accion"
};

const KYC_TIMELINE: Array<{ date: string; step: string; detail: string }> = [
  { date: "2026-02-10", step: "Registro", detail: "Cuenta creada con wallet conectada." },
  { date: "2026-02-12", step: "KYC iniciado", detail: "Usuario comenzo flujo de verificacion." },
  { date: "2026-02-14", step: "Documentos cargados", detail: "Identidad y residencia recibidos." },
  { date: "2026-02-16", step: "Revision interna", detail: "Analista en proceso de validacion." }
];

function parseKycStatus(value: string | null): KycStatusKey {
  if (value === "pending" || value === "in_review" || value === "approved" || value === "rejected" || value === "requires_action") {
    return value;
  }

  return "not_started";
}

function statusClassName(status: KycStatusKey): string {
  if (status === "approved") {
    return "bg-emerald-500/20 text-emerald-200";
  }

  if (status === "pending" || status === "in_review") {
    return "bg-indigo-500/20 text-indigo-200";
  }

  if (status === "requires_action") {
    return "bg-amber-500/20 text-amber-200";
  }

  if (status === "rejected") {
    return "bg-rose-500/20 text-rose-200";
  }

  return "bg-slate-500/20 text-slate-200";
}

function primaryCta(status: KycStatusKey): string {
  if (status === "not_started") {
    return "Iniciar KYC";
  }

  if (status === "pending") {
    return "Continuar verificacion";
  }

  if (status === "in_review") {
    return "Ver estado";
  }

  if (status === "approved") {
    return "Ver estado";
  }

  if (status === "rejected") {
    return "Reenviar documentos";
  }

  return "Continuar verificacion";
}

function secondaryCta(status: KycStatusKey): string | null {
  if (status === "requires_action") {
    return "Reenviar documentos";
  }

  if (status === "pending" || status === "in_review") {
    return "Ver estado";
  }

  return null;
}

function validateDocument(file: File): { valid: boolean; message: string } {
  const acceptedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = acceptedExtensions.some((extension) => lowerName.endsWith(extension));

  if (!hasValidExtension) {
    return { valid: false, message: "Formato no valido. Usa PDF, PNG o JPG." };
  }

  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, message: "Archivo excede 10MB." };
  }

  return { valid: true, message: "Documento valido para envio." };
}

function LoadingState(): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
      </Card>
      <Card className="space-y-2">
        <div className="h-40 w-full animate-pulse rounded bg-white/10" />
      </Card>
    </div>
  );
}

function EmptyState(): ReactElement {
  return (
    <Card className="space-y-2 border-dashed">
      <h2 className="text-lg font-semibold text-white">Perfil sin informacion completa</h2>
      <p className="text-sm text-white/70">
        Aun no hay datos de perfil cargados. Completa tu informacion para iniciar el proceso KYC.
      </p>
      <Button className="min-h-11 w-full sm:w-auto">Completar perfil</Button>
    </Card>
  );
}

function ErrorState(): ReactElement {
  return (
    <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
      <h2 className="text-lg font-semibold text-white">No se pudo cargar tu perfil</h2>
      <p className="text-sm text-white/75">Intenta nuevamente en unos minutos.</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline">
        Reintentar
      </Button>
    </Card>
  );
}

export function ProfileKycModule({ wallet }: ProfileKycModuleProps): ReactElement {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const kycStatus = parseKycStatus(searchParams.get("kyc"));
  const partialProfile = searchParams.get("partial") === "1";

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const isLoading = view === "loading";
  const isEmpty = view === "empty";
  const isError = view === "error";

  const checklist = useMemo(
    () => [
      { item: "Documento de identidad vigente", done: kycStatus === "approved" || kycStatus === "in_review" || kycStatus === "pending" },
      { item: "Prueba de residencia (<= 3 meses)", done: kycStatus === "approved" || kycStatus === "in_review" },
      { item: "Selfie o verificacion facial", done: kycStatus === "approved" || kycStatus === "in_review" },
      { item: "Declaracion de fondos / PEP", done: kycStatus === "approved" || (kycStatus !== "not_started" && !partialProfile) }
    ],
    [kycStatus, partialProfile]
  );

  const profileData = {
    fullName: partialProfile ? "" : "Camila Torres",
    email: partialProfile ? "" : "camila.torres@email.com",
    country: partialProfile ? "" : "Colombia",
    accountStatus: kycStatus === "approved" ? "Cuenta verificada" : "Cuenta en verificacion"
  };

  const showKycAlert = kycStatus !== "approved";

  const handleDocumentChange = (label: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validateDocument(file);
    setDocuments((current) => [{ label, fileName: file.name, valid: validation.valid, message: validation.message }, ...current]);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState />;
  }

  if (isEmpty) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Perfil / Mi cuenta</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/60">Wallet conectada</dt>
            <dd className="mt-1 font-medium text-white">{wallet}</dd>
          </div>
          <div>
            <dt className="text-white/60">Estado de cuenta</dt>
            <dd className="mt-1 font-medium text-white">{profileData.accountStatus}</dd>
          </div>
          <div>
            <dt className="text-white/60">Nombre completo</dt>
            <dd className="mt-1 font-medium text-white">{profileData.fullName || "No completado"}</dd>
          </div>
          <div>
            <dt className="text-white/60">Correo</dt>
            <dd className="mt-1 font-medium text-white">{profileData.email || "No completado"}</dd>
          </div>
          <div>
            <dt className="text-white/60">Pais / residencia</dt>
            <dd className="mt-1 font-medium text-white">{profileData.country || "No completado"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">Estado de KYC</h3>
          <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(kycStatus)}`}>{KYC_STATUS_LABELS[kycStatus]}</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Checklist de requisitos KYC</p>
          <ul className="space-y-2">
            {checklist.map((entry) => (
              <li key={entry.item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${entry.done ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-600/40 text-slate-200"}`}>
                  {entry.done ? "OK" : "..."}
                </span>
                <span className="text-white/85">{entry.item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Carga de documentos</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
              Documento de identidad
              <input className="mt-2 block w-full text-xs" onChange={handleDocumentChange("Documento de identidad")} type="file" />
            </label>
            <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
              Prueba de residencia
              <input className="mt-2 block w-full text-xs" onChange={handleDocumentChange("Prueba de residencia")} type="file" />
            </label>
          </div>
          <p className="text-xs text-white/60">Solo PDF/JPG/PNG. Tamano maximo: 10MB por archivo.</p>
          {documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map((doc, index) => (
                <li key={`${doc.fileName}-${index}`} className={`rounded-lg border px-3 py-2 text-sm ${doc.valid ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-rose-400/30 bg-rose-500/10 text-rose-100"}`}>
                  <p className="font-medium">
                    {doc.label}: {doc.fileName}
                  </p>
                  <p className="text-xs">{doc.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11">{primaryCta(kycStatus)}</Button>
          {secondaryCta(kycStatus) && (
            <Button className="min-h-11" variant="outline">
              {secondaryCta(kycStatus)}
            </Button>
          )}
        </div>
      </Card>

      {showKycAlert && (
        <Card className="space-y-2 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm text-amber-100">
            Algunas acciones de inversion, stake o claim pueden estar bloqueadas hasta completar y aprobar el proceso KYC.
          </p>
        </Card>
      )}

      <Card className="space-y-2">
        <h3 className="text-base font-semibold text-white">Timeline del proceso KYC</h3>
        <ul className="space-y-2">
          {KYC_TIMELINE.map((step) => (
            <li key={`${step.date}-${step.step}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <p className="font-medium text-white">{step.step}</p>
              <p className="text-white/70">
                {step.date} · {step.detail}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
