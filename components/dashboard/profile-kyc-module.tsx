"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type KycStatus = "not_started" | "pending" | "verified" | "rejected";
type ComplianceStatus =
  | "pending_kyc"
  | "pending_aml"
  | "pending_review"
  | "fully_verified"
  | "restricted_aml"
  | "suspended";

type ProfileBundle = {
  walletPublicKey: string;
  username: string;
  bio: string;
  avatarUrl: string;
  kycStatus: KycStatus;
  complianceStatus: ComplianceStatus;
  rejectionReasonCode: string | null;
};

type ProfileKycModuleProps = {
  wallet: string;
};

type ProfileApiPayload = {
  ok?: boolean;
  data?: {
    walletPublicKey: string;
    username: string;
    bio: string;
    avatarUrl: string;
    kycStatus: KycStatus;
    complianceStatus: ComplianceStatus;
    rejectionReasonCode: string | null;
  };
  error?: {
    message?: string;
  };
};

type KycStatusApiPayload = {
  ok?: boolean;
  data?: {
    kycStatus: KycStatus;
    complianceStatus: ComplianceStatus;
    rejectionReasonCode: string | null;
  };
};

type StripeSessionApiPayload = {
  ok?: boolean;
  data?: {
    url: string;
  };
  error?: {
    message?: string;
  };
};

const KYC_STATUS_LABELS: Record<KycStatus, { en: string; es: string; pt: string }> = {
  not_started: { en: "Not started", es: "No iniciado", pt: "Nao iniciado" },
  pending: { en: "Pending", es: "Pendiente", pt: "Pendente" },
  verified: { en: "Verified", es: "Verificado", pt: "Verificado" },
  rejected: { en: "Rejected", es: "Rechazado", pt: "Rejeitado" }
};

const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, { en: string; es: string; pt: string }> = {
  pending_kyc: { en: "Pending KYC", es: "Pendiente KYC", pt: "Pendente KYC" },
  pending_aml: { en: "Pending AML", es: "Pendiente AML", pt: "Pendente AML" },
  pending_review: { en: "Pending review", es: "Pendiente revision", pt: "Pendente revisao" },
  fully_verified: { en: "Fully verified", es: "Totalmente verificado", pt: "Totalmente verificado" },
  restricted_aml: { en: "AML restricted", es: "AML restringido", pt: "AML restrito" },
  suspended: { en: "Suspended", es: "Suspendido", pt: "Suspenso" }
};

function kycBadgeClass(status: KycStatus): string {
  if (status === "verified") {
    return "bg-emerald-500/20 text-emerald-100";
  }

  if (status === "pending") {
    return "bg-indigo-500/20 text-indigo-100";
  }

  if (status === "rejected") {
    return "bg-rose-500/20 text-rose-100";
  }

  return "bg-slate-500/20 text-slate-100";
}

function complianceBadgeClass(status: ComplianceStatus): string {
  if (status === "fully_verified") {
    return "bg-emerald-500/20 text-emerald-100";
  }

  if (status === "restricted_aml" || status === "suspended") {
    return "bg-rose-500/20 text-rose-100";
  }

  if (status === "pending_review") {
    return "bg-amber-500/20 text-amber-100";
  }

  return "bg-indigo-500/20 text-indigo-100";
}

function LoadingState(): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
      </Card>
      <Card className="space-y-2">
        <div className="h-28 w-full animate-pulse rounded bg-white/10" />
      </Card>
    </div>
  );
}

export function ProfileKycModule({ wallet }: ProfileKycModuleProps): ReactElement {
  const { t } = useI18n();

  const [profile, setProfile] = useState<ProfileBundle | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [isStartingKyc, setIsStartingKyc] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const canStartKyc = useMemo(() => {
    if (!profile) {
      return false;
    }

    return profile.kycStatus !== "verified";
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(): Promise<void> {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [profileResponse, kycResponse] = await Promise.all([
          fetch("/api/protected/profile", { method: "GET", cache: "no-store" }),
          fetch("/api/protected/kyc/status", { method: "GET", cache: "no-store" })
        ]);

        const profilePayload = (await profileResponse.json()) as ProfileApiPayload;

        if (!profileResponse.ok || !profilePayload.data) {
          throw new Error(profilePayload.error?.message || "Could not load profile data.");
        }

        let kycStatus = profilePayload.data.kycStatus;
        let complianceStatus = profilePayload.data.complianceStatus;
        let rejectionReasonCode = profilePayload.data.rejectionReasonCode;

        if (kycResponse.ok) {
          const kycPayload = (await kycResponse.json()) as KycStatusApiPayload;

          if (kycPayload.data) {
            kycStatus = kycPayload.data.kycStatus;
            complianceStatus = kycPayload.data.complianceStatus;
            rejectionReasonCode = kycPayload.data.rejectionReasonCode;
          }
        }

        if (cancelled) {
          return;
        }

        const nextProfile: ProfileBundle = {
          walletPublicKey: profilePayload.data.walletPublicKey,
          username: profilePayload.data.username,
          bio: profilePayload.data.bio,
          avatarUrl: profilePayload.data.avatarUrl,
          kycStatus,
          complianceStatus,
          rejectionReasonCode
        };

        setProfile(nextProfile);
        setUsername(nextProfile.username);
        setBio(nextProfile.bio);
        setAvatarUrl(nextProfile.avatarUrl);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load profile data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (): Promise<void> => {
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/protected/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          bio,
          avatarUrl
        })
      });

      const payload = (await response.json()) as ProfileApiPayload;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Could not update profile.");
      }

      setProfile((current) => {
        if (!current) {
          return null;
        }

        return {
          ...current,
          username: payload.data?.username || current.username,
          bio: payload.data?.bio || current.bio,
          avatarUrl: payload.data?.avatarUrl || current.avatarUrl,
          kycStatus: payload.data?.kycStatus || current.kycStatus,
          complianceStatus: payload.data?.complianceStatus || current.complianceStatus,
          rejectionReasonCode: payload.data?.rejectionReasonCode || null
        };
      });
      setSaveSuccess(t({ en: "Profile updated successfully.", es: "Perfil actualizado correctamente.", pt: "Perfil atualizado com sucesso." }));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartKyc = async (): Promise<void> => {
    setIsStartingKyc(true);
    setKycError(null);

    try {
      const response = await fetch("/api/protected/kyc/stripe/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      const payload = (await response.json()) as StripeSessionApiPayload;

      if (!response.ok || !payload.data?.url) {
        throw new Error(payload.error?.message || "Could not start Stripe verification session.");
      }

      window.location.assign(payload.data.url);
    } catch (error) {
      setKycError(error instanceof Error ? error.message : "Could not start Stripe verification session.");
      setIsStartingKyc(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (loadError || !profile) {
    return (
      <Card className="space-y-3 border-rose-500/30 bg-rose-500/10">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Could not load your profile", es: "No se pudo cargar tu perfil", pt: "Nao foi possivel carregar seu perfil" })}</h2>
        <p className="text-sm text-white/80">{loadError || t({ en: "Try again in a few minutes.", es: "Intenta nuevamente en unos minutos.", pt: "Tente novamente em alguns minutos." })}</p>
        <Button className="min-h-11 w-full sm:w-auto" onClick={() => window.location.reload()}>
          {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">{t({ en: "Profile / My account", es: "Perfil / Mi cuenta", pt: "Perfil / Minha conta" })}</h2>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">{wallet}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-white/85">
            <span>{t({ en: "Username", es: "Usuario", pt: "Usuario" })}</span>
            <input
              className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white outline-none ring-offset-2 transition focus:border-white/35"
              maxLength={32}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t({ en: "username_123", es: "usuario_123", pt: "usuario_123" })}
              value={username}
            />
          </label>

          <label className="space-y-1 text-sm text-white/85">
            <span>{t({ en: "Avatar URL", es: "URL de avatar", pt: "URL do avatar" })}</span>
            <input
              className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white outline-none ring-offset-2 transition focus:border-white/35"
              maxLength={1024}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
            />
          </label>

          <label className="space-y-1 text-sm text-white/85 sm:col-span-2">
            <span>{t({ en: "Bio", es: "Bio", pt: "Bio" })}</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-offset-2 transition focus:border-white/35"
              maxLength={280}
              onChange={(event) => setBio(event.target.value)}
              placeholder={t({ en: "Tell the community who you are.", es: "Cuentale a la comunidad quien eres.", pt: "Conte para a comunidade quem voce e." })}
              value={bio}
            />
          </label>
        </div>

        {saveError && <p className="text-sm text-rose-200">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-emerald-200">{saveSuccess}</p>}

        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11 w-full sm:w-auto" disabled={isSaving} onClick={handleSave}>
            {isSaving ? t({ en: "Saving...", es: "Guardando...", pt: "Salvando..." }) : t({ en: "Save profile", es: "Guardar perfil", pt: "Salvar perfil" })}
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">{t({ en: "Compliance", es: "Cumplimiento", pt: "Compliance" })}</h3>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2 py-1 text-xs ${kycBadgeClass(profile.kycStatus)}`}>{t(KYC_STATUS_LABELS[profile.kycStatus])}</span>
            <span className={`rounded-full px-2 py-1 text-xs ${complianceBadgeClass(profile.complianceStatus)}`}>{t(COMPLIANCE_STATUS_LABELS[profile.complianceStatus])}</span>
          </div>
        </div>

        <p className="text-sm text-white/80">
          {t({
            en: "Identity verification is processed by Stripe Identity. This app does not store your identity documents.",
            es: "La verificacion de identidad se procesa en Stripe Identity. Esta app no almacena tus documentos de identidad.",
            pt: "A verificacao de identidade e processada no Stripe Identity. Este app nao armazena seus documentos de identidade."
          })}
        </p>

        {profile.rejectionReasonCode && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {t({ en: "Last rejection code", es: "Ultimo codigo de rechazo", pt: "Ultimo codigo de rejeicao" })}: {profile.rejectionReasonCode}
          </p>
        )}

        {kycError && <p className="text-sm text-rose-200">{kycError}</p>}

        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11 w-full sm:w-auto" disabled={isStartingKyc || !canStartKyc} onClick={handleStartKyc}>
            {isStartingKyc
              ? t({ en: "Opening verification...", es: "Abriendo verificacion...", pt: "Abrindo verificacao..." })
              : canStartKyc
                ? t({ en: "Start verification", es: "Iniciar verificacion", pt: "Iniciar verificacao" })
                : t({ en: "Already verified", es: "Ya verificado", pt: "Ja verificado" })}
          </Button>
        </div>
      </Card>
    </div>
  );
}
