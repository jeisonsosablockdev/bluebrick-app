"use client";

import { useSearchParams } from "next/navigation";
import type { ChangeEvent, ReactElement } from "react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
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

const KYC_STATUS_LABELS: Record<KycStatusKey, { en: string; es: string; pt: string }> = {
  not_started: { en: "Not started", es: "No iniciado", pt: "Nao iniciado" },
  pending: { en: "Pending", es: "Pendiente", pt: "Pendente" },
  in_review: { en: "In review", es: "En revision", pt: "Em revisao" },
  approved: { en: "Approved", es: "Aprobado", pt: "Aprovado" },
  rejected: { en: "Rejected", es: "Rechazado", pt: "Rejeitado" },
  requires_action: { en: "Requires action", es: "Requiere accion", pt: "Requer acao" }
};

const KYC_TIMELINE: Array<{ date: string; step: { en: string; es: string; pt: string }; detail: { en: string; es: string; pt: string } }> = [
  {
    date: "2026-02-10",
    step: { en: "Registration", es: "Registro", pt: "Registro" },
    detail: {
      en: "Account created with connected wallet.",
      es: "Cuenta creada con wallet conectada.",
      pt: "Conta criada com wallet conectada."
    }
  },
  {
    date: "2026-02-12",
    step: { en: "KYC started", es: "KYC iniciado", pt: "KYC iniciado" },
    detail: {
      en: "User started verification flow.",
      es: "Usuario comenzo flujo de verificacion.",
      pt: "Usuario iniciou fluxo de verificacao."
    }
  },
  {
    date: "2026-02-14",
    step: { en: "Documents uploaded", es: "Documentos cargados", pt: "Documentos enviados" },
    detail: {
      en: "Identity and residency documents received.",
      es: "Identidad y residencia recibidos.",
      pt: "Identidade e residencia recebidas."
    }
  },
  {
    date: "2026-02-16",
    step: { en: "Internal review", es: "Revision interna", pt: "Revisao interna" },
    detail: {
      en: "Analyst is validating the case.",
      es: "Analista en proceso de validacion.",
      pt: "Analista em processo de validacao."
    }
  }
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

function primaryCta(status: KycStatusKey, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "not_started") {
    return t({ en: "Start KYC", es: "Iniciar KYC", pt: "Iniciar KYC" });
  }

  if (status === "pending") {
    return t({ en: "Continue verification", es: "Continuar verificacion", pt: "Continuar verificacao" });
  }

  if (status === "in_review") {
    return t({ en: "View status", es: "Ver estado", pt: "Ver status" });
  }

  if (status === "approved") {
    return t({ en: "View status", es: "Ver estado", pt: "Ver status" });
  }

  if (status === "rejected") {
    return t({ en: "Resubmit documents", es: "Reenviar documentos", pt: "Reenviar documentos" });
  }

  return t({ en: "Continue verification", es: "Continuar verificacion", pt: "Continuar verificacao" });
}

function secondaryCta(status: KycStatusKey, t: ReturnType<typeof useI18n>["t"]): string | null {
  if (status === "requires_action") {
    return t({ en: "Resubmit documents", es: "Reenviar documentos", pt: "Reenviar documentos" });
  }

  if (status === "pending" || status === "in_review") {
    return t({ en: "View status", es: "Ver estado", pt: "Ver status" });
  }

  return null;
}

function validateDocument(file: File, t: ReturnType<typeof useI18n>["t"]): { valid: boolean; message: string } {
  const acceptedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = acceptedExtensions.some((extension) => lowerName.endsWith(extension));

  if (!hasValidExtension) {
    return {
      valid: false,
      message: t({ en: "Invalid format. Use PDF, PNG or JPG.", es: "Formato no valido. Usa PDF, PNG o JPG.", pt: "Formato invalido. Use PDF, PNG ou JPG." })
    };
  }

  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      message: t({ en: "File exceeds 10MB.", es: "Archivo excede 10MB.", pt: "Arquivo excede 10MB." })
    };
  }

  return {
    valid: true,
    message: t({ en: "Document is valid for upload.", es: "Documento valido para envio.", pt: "Documento valido para envio." })
  };
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

function EmptyState({ t }: { t: ReturnType<typeof useI18n>["t"] }): ReactElement {
  return (
    <Card className="space-y-2 border-dashed">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Profile without complete information", es: "Perfil sin informacion completa", pt: "Perfil sem informacao completa" })}</h2>
      <p className="text-sm text-white/70">
        {t({ en: "There is no profile data loaded yet. Complete your information to start KYC.", es: "Aun no hay datos de perfil cargados. Completa tu informacion para iniciar el proceso KYC.", pt: "Ainda nao ha dados de perfil carregados. Complete suas informacoes para iniciar o processo KYC." })}
      </p>
      <Button className="min-h-11 w-full sm:w-auto">{t({ en: "Complete profile", es: "Completar perfil", pt: "Completar perfil" })}</Button>
    </Card>
  );
}

function ErrorState({ t }: { t: ReturnType<typeof useI18n>["t"] }): ReactElement {
  return (
    <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Could not load your profile", es: "No se pudo cargar tu perfil", pt: "Nao foi possivel carregar seu perfil" })}</h2>
      <p className="text-sm text-white/75">{t({ en: "Try again in a few minutes.", es: "Intenta nuevamente en unos minutos.", pt: "Tente novamente em alguns minutos." })}</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline">
        {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
      </Button>
    </Card>
  );
}

export function ProfileKycModule({ wallet }: ProfileKycModuleProps): ReactElement {
  const { t } = useI18n();
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
      {
        item: t({ en: "Valid identity document", es: "Documento de identidad vigente", pt: "Documento de identidade valido" }),
        done: kycStatus === "approved" || kycStatus === "in_review" || kycStatus === "pending"
      },
      {
        item: t({ en: "Proof of address (<= 3 months)", es: "Prueba de residencia (<= 3 meses)", pt: "Comprovante de residencia (<= 3 meses)" }),
        done: kycStatus === "approved" || kycStatus === "in_review"
      },
      {
        item: t({ en: "Selfie or face verification", es: "Selfie o verificacion facial", pt: "Selfie ou verificacao facial" }),
        done: kycStatus === "approved" || kycStatus === "in_review"
      },
      {
        item: t({ en: "Funds declaration / PEP", es: "Declaracion de fondos / PEP", pt: "Declaracao de fundos / PEP" }),
        done: kycStatus === "approved" || (kycStatus !== "not_started" && !partialProfile)
      }
    ],
    [kycStatus, partialProfile, t]
  );

  const profileData = {
    fullName: partialProfile ? "" : "Camila Torres",
    email: partialProfile ? "" : "camila.torres@email.com",
    country: partialProfile ? "" : "Colombia",
    accountStatus:
      kycStatus === "approved"
        ? t({ en: "Verified account", es: "Cuenta verificada", pt: "Conta verificada" })
        : t({ en: "Account in verification", es: "Cuenta en verificacion", pt: "Conta em verificacao" })
  };

  const showKycAlert = kycStatus !== "approved";

  const handleDocumentChange = (label: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validateDocument(file, t);
    setDocuments((current) => [{ label, fileName: file.name, valid: validation.valid, message: validation.message }, ...current]);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState t={t} />;
  }

  if (isEmpty) {
    return <EmptyState t={t} />;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Profile / My account", es: "Perfil / Mi cuenta", pt: "Perfil / Minha conta" })}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/60">{t({ en: "Connected wallet", es: "Wallet conectada", pt: "Wallet conectada" })}</dt>
            <dd className="mt-1 font-medium text-white">{wallet}</dd>
          </div>
          <div>
            <dt className="text-white/60">{t({ en: "Account status", es: "Estado de cuenta", pt: "Status da conta" })}</dt>
            <dd className="mt-1 font-medium text-white">{profileData.accountStatus}</dd>
          </div>
          <div>
            <dt className="text-white/60">{t({ en: "Full name", es: "Nombre completo", pt: "Nome completo" })}</dt>
            <dd className="mt-1 font-medium text-white">
              {profileData.fullName || t({ en: "Not completed", es: "No completado", pt: "Nao completado" })}
            </dd>
          </div>
          <div>
            <dt className="text-white/60">{t({ en: "Email", es: "Correo", pt: "Email" })}</dt>
            <dd className="mt-1 font-medium text-white">
              {profileData.email || t({ en: "Not completed", es: "No completado", pt: "Nao completado" })}
            </dd>
          </div>
          <div>
            <dt className="text-white/60">{t({ en: "Country / residency", es: "Pais / residencia", pt: "Pais / residencia" })}</dt>
            <dd className="mt-1 font-medium text-white">
              {profileData.country || t({ en: "Not completed", es: "No completado", pt: "Nao completado" })}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">{t({ en: "KYC status", es: "Estado de KYC", pt: "Status de KYC" })}</h3>
          <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(kycStatus)}`}>{t(KYC_STATUS_LABELS[kycStatus])}</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-white">{t({ en: "KYC requirements checklist", es: "Checklist de requisitos KYC", pt: "Checklist de requisitos KYC" })}</p>
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
          <p className="text-sm font-medium text-white">{t({ en: "Document upload", es: "Carga de documentos", pt: "Upload de documentos" })}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
              {t({ en: "Identity document", es: "Documento de identidad", pt: "Documento de identidade" })}
              <input
                className="mt-2 block w-full text-xs"
                onChange={handleDocumentChange(t({ en: "Identity document", es: "Documento de identidad", pt: "Documento de identidade" }))}
                type="file"
              />
            </label>
            <label className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
              {t({ en: "Proof of address", es: "Prueba de residencia", pt: "Comprovante de residencia" })}
              <input
                className="mt-2 block w-full text-xs"
                onChange={handleDocumentChange(t({ en: "Proof of address", es: "Prueba de residencia", pt: "Comprovante de residencia" }))}
                type="file"
              />
            </label>
          </div>
          <p className="text-xs text-white/60">{t({ en: "Only PDF/JPG/PNG. Maximum size: 10MB per file.", es: "Solo PDF/JPG/PNG. Tamano maximo: 10MB por archivo.", pt: "Somente PDF/JPG/PNG. Tamanho maximo: 10MB por arquivo." })}</p>
          {documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map((doc, index) => (
                <li
                  key={`${doc.fileName}-${index}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${doc.valid ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-rose-400/30 bg-rose-500/10 text-rose-100"}`}
                >
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
          <Button className="min-h-11">{primaryCta(kycStatus, t)}</Button>
          {secondaryCta(kycStatus, t) && (
            <Button className="min-h-11" variant="outline">
              {secondaryCta(kycStatus, t)}
            </Button>
          )}
        </div>
      </Card>

      {showKycAlert && (
        <Card className="space-y-2 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm text-amber-100">
            {t({
              en: "Some investment, stake or claim actions can remain blocked until KYC is completed and approved.",
              es: "Algunas acciones de inversion, stake o claim pueden estar bloqueadas hasta completar y aprobar el proceso KYC.",
              pt: "Algumas acoes de investimento, stake ou claim podem ficar bloqueadas ate completar e aprovar o processo KYC."
            })}
          </p>
        </Card>
      )}

      <Card className="space-y-2">
        <h3 className="text-base font-semibold text-white">{t({ en: "KYC process timeline", es: "Timeline del proceso KYC", pt: "Timeline do processo KYC" })}</h3>
        <ul className="space-y-2">
          {KYC_TIMELINE.map((step) => (
            <li key={`${step.date}-${step.step.es}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <p className="font-medium text-white">{t(step.step)}</p>
              <p className="text-white/70">
                {step.date} · {t(step.detail)}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
