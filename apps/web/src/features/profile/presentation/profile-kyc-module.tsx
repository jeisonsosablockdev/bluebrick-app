"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useI18n } from "@/components/i18n/locale-provider";
import { PwaCapabilityCard } from "@/components/pwa/pwa-capability-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COUNTRIES } from "@/lib/countries";
import { TOUR_STEP_IDS } from "@/features/profile/presentation/quick-tour-overlay";
import {
  formatOnboardingRewardRemainingWindow,
  formatUsdByLocale,
  ONBOARDING_REWARD_STATUS_LABELS,
  type OnboardingRewardStatus
} from "@/lib/onboarding-reward-copy";

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
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  stateProvince: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  kycStatus: KycStatus;
  complianceStatus: ComplianceStatus;
  rejectionReasonCode: string | null;
  onboardingReward: OnboardingRewardSnapshot | null;
};

type OnboardingRewardSnapshot = {
  status: OnboardingRewardStatus;
  rewardAmountUsdSnapshot: number;
  qualificationDeadlineAt: string;
  profileCompletedAt: string | null;
  kycSubmittedAt: string | null;
  kycReviewGraceDeadlineAt: string | null;
  kycVerifiedAt: string | null;
  earnedAt: string | null;
  consumedAt: string | null;
  expiredAt: string | null;
  nextDeadlineAt: string | null;
  remainingSeconds: number | null;
  shouldShowReminder: boolean;
  canUseInCheckout: boolean;
};

type ProfileKycModuleProps = {
  walletPublicKey?: string;
};

type ProfileApiPayload = {
  ok?: boolean;
  data?: {
    walletPublicKey: string;
    username: string;
    bio: string;
    avatarUrl: string;
    firstName: string | null;
    lastName: string | null;
    country: string | null;
    stateProvince: string | null;
    email: string | null;
    address: string | null;
    phone: string | null;
    kycStatus: KycStatus;
    complianceStatus: ComplianceStatus;
    rejectionReasonCode: string | null;
    onboardingReward?: OnboardingRewardSnapshot | null;
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

type WalletAvatarNftItem = {
  assetId: string;
  name: string;
  symbol: string | null;
  imageUrl: string;
};

type WalletAvatarCatalogApiPayload = {
  ok?: boolean;
  data?: {
    walletPublicKey: string;
    items: WalletAvatarNftItem[];
  };
  error?: {
    message?: string;
  };
};

type WalletStandardAccountDescriptor = {
  address: string;
  label?: string;
};

type WalletAdapterWithStandardAccounts = {
  wallet: {
    accounts: readonly WalletStandardAccountDescriptor[];
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

function onboardingRewardBadgeClass(status: OnboardingRewardSnapshot["status"]): string {
  if (status === "earned" || status === "consumed") {
    return "bg-emerald-500/20 text-emerald-100";
  }

  if (status === "expired") {
    return "bg-rose-500/20 text-rose-100";
  }

  if (status === "reserved") {
    return "bg-cyan-500/20 text-cyan-100";
  }

  return "bg-amber-500/20 text-amber-100";
}

function LoadingState(): ReactElement {
  return (
    <div className="space-y-4">
      <article className="marketplace-depth-card no-hover-lift space-y-2 rounded-2xl p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
      </article>
      <article className="marketplace-depth-card no-hover-lift space-y-2 rounded-2xl p-5">
        <div className="h-28 w-full animate-pulse rounded bg-white/10" />
      </article>
    </div>
  );
}

function resolveAvatarPreviewUrl(input: string): string {
  const trimmed = input.trim();
  return trimmed || "/avatars/default-user.svg";
}

function truncateAssetId(assetId: string): string {
  if (assetId.length <= 12) {
    return assetId;
  }

  return `${assetId.slice(0, 6)}...${assetId.slice(-6)}`;
}

function toUsernameToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "")
    .replace(/^[_.-]+|[_.-]+$/g, "");
}

function isWalletAdapterWithStandardAccounts(adapter: unknown): adapter is WalletAdapterWithStandardAccounts {
  if (!adapter || typeof adapter !== "object" || !("wallet" in adapter)) {
    return false;
  }

  const walletCandidate = (adapter as { wallet?: unknown }).wallet;

  if (!walletCandidate || typeof walletCandidate !== "object" || !("accounts" in walletCandidate)) {
    return false;
  }

  return Array.isArray((walletCandidate as { accounts?: unknown }).accounts);
}

function getWalletAccountLabel(adapter: unknown, walletAddress: string): string | null {
  if (!isWalletAdapterWithStandardAccounts(adapter)) {
    return null;
  }

  const normalizedAddress = walletAddress.trim();
  const account =
    adapter.wallet.accounts.find((candidate) => candidate.address === normalizedAddress) ?? adapter.wallet.accounts[0];
  const label = account?.label?.trim();

  return label || null;
}

function buildWalletSuggestedUsername({
  walletPublicKey,
  providerName,
  accountLabel
}: {
  walletPublicKey: string;
  providerName: string | null;
  accountLabel: string | null;
}): string {
  const accountToken = toUsernameToken(accountLabel ?? "").slice(0, 32);

  if (accountToken.length >= 3) {
    return accountToken;
  }

  const providerToken = toUsernameToken(providerName ?? "wallet").slice(0, 12) || "wallet";
  const suffix = walletPublicKey.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toLowerCase() || "user";
  const candidate = `${providerToken}_${suffix}`.slice(0, 32);

  if (candidate.length >= 3) {
    return candidate;
  }

  return `wallet_${suffix}`.slice(0, 32);
}

export function ProfileKycModule({ walletPublicKey }: ProfileKycModuleProps): ReactElement {
  const { locale, t } = useI18n();
  const { wallet } = useWallet();

  const [profile, setProfile] = useState<ProfileBundle | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!profile?.firstName || !profile?.country || !profile?.email);

  const [isStartingKyc, setIsStartingKyc] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [walletAvatarOptions, setWalletAvatarOptions] = useState<WalletAvatarNftItem[]>([]);
  const [isLoadingWalletAvatars, setIsLoadingWalletAvatars] = useState(false);
  const [walletAvatarError, setWalletAvatarError] = useState<string | null>(null);
  const [hasLoadedWalletAvatars, setHasLoadedWalletAvatars] = useState(false);

  const canStartKyc = useMemo(() => {
    if (!profile) {
      return false;
    }

    return profile.kycStatus !== "verified";
  }, [profile]);

  const hasUnsavedChanges = useMemo(() => {
    if (!profile) {
      return false;
    }

    return (
      username !== profile.username ||
      bio !== profile.bio ||
      avatarUrl !== profile.avatarUrl ||
      firstName !== (profile.firstName || "") ||
      lastName !== (profile.lastName || "") ||
      country !== (profile.country || "") ||
      stateProvince !== (profile.stateProvince || "") ||
      email !== (profile.email || "") ||
      address !== (profile.address || "") ||
      phone !== (profile.phone || "")
    );
  }, [avatarUrl, bio, profile, username, firstName, lastName, country, stateProvince, email, address, phone]);

  const selectedAvatarPreviewUrl = useMemo(() => resolveAvatarPreviewUrl(avatarUrl), [avatarUrl]);
  const walletProviderName = wallet?.adapter?.name ?? null;
  const connectedWalletAddress = wallet?.adapter?.publicKey?.toBase58() ?? profile?.walletPublicKey ?? walletPublicKey ?? "";
  const walletAccountLabel = useMemo(
    () => getWalletAccountLabel(wallet?.adapter, connectedWalletAddress),
    [connectedWalletAddress, wallet?.adapter]
  );

  const loadWalletAvatarOptions = async (): Promise<void> => {
    setWalletAvatarError(null);
    setIsLoadingWalletAvatars(true);

    try {
      const response = await fetch("/api/protected/profile/nft-avatars?limit=24", {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as WalletAvatarCatalogApiPayload;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Could not load NFT avatars from wallet.");
      }

      setWalletAvatarOptions(Array.isArray(payload.data.items) ? payload.data.items : []);
      setHasLoadedWalletAvatars(true);
    } catch (error) {
      setWalletAvatarError(error instanceof Error ? error.message : "Could not load NFT avatars from wallet.");
    } finally {
      setIsLoadingWalletAvatars(false);
    }
  };

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
          firstName: profilePayload.data.firstName,
          lastName: profilePayload.data.lastName,
          country: profilePayload.data.country,
          stateProvince: profilePayload.data.stateProvince,
          email: profilePayload.data.email,
          address: profilePayload.data.address,
          phone: profilePayload.data.phone,
          kycStatus,
          complianceStatus,
          rejectionReasonCode,
          onboardingReward: profilePayload.data.onboardingReward ?? null
        };

        setProfile(nextProfile);
        setUsername(nextProfile.username);
        setBio(nextProfile.bio);
        setAvatarUrl(nextProfile.avatarUrl);
        setFirstName(nextProfile.firstName || "");
        setLastName(nextProfile.lastName || "");
        setCountry(nextProfile.country || "");
        setStateProvince(nextProfile.stateProvince || "");
        setEmail(nextProfile.email || "");
        setAddress(nextProfile.address || "");
        setPhone(nextProfile.phone || "");
        setIsEditing(false);
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

  useEffect(() => {
    if (!isEditing || hasLoadedWalletAvatars || isLoadingWalletAvatars) {
      return;
    }

    void loadWalletAvatarOptions();
  }, [hasLoadedWalletAvatars, isEditing, isLoadingWalletAvatars]);

  const handleSave = async (): Promise<void> => {
    if (!hasUnsavedChanges) {
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);

    try {
      let submitPhone = phone.trim();
      // If the phone is just the country code, treat it as empty
      if (submitPhone.startsWith("+")) {
        const justNumbers = submitPhone.replace(/[^\d]/g, "");
        if (justNumbers.length <= 4) {
          // It's likely just a country code (e.g. +1, +57) with no actual number
          // But to be safe, let's strictly check against COUNTRIES
          const matchedCountry = COUNTRIES.find((c) => submitPhone.startsWith(c.dialCode));
          if (matchedCountry && submitPhone === matchedCountry.dialCode) {
            submitPhone = "";
          }
        }
      }

      const response = await fetch("/api/protected/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          bio,
          avatarUrl,
          firstName,
          lastName,
          country,
          stateProvince,
          email,
          address,
          phone: submitPhone
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
          username: payload.data?.username ?? current.username,
          bio: payload.data?.bio ?? current.bio,
          avatarUrl: payload.data?.avatarUrl ?? current.avatarUrl,
          firstName: payload.data?.firstName ?? current.firstName,
          lastName: payload.data?.lastName ?? current.lastName,
          country: payload.data?.country ?? current.country,
          stateProvince: payload.data?.stateProvince ?? current.stateProvince,
          email: payload.data?.email ?? current.email,
          address: payload.data?.address ?? current.address,
          phone: payload.data?.phone ?? current.phone,
          kycStatus: payload.data?.kycStatus ?? current.kycStatus,
          complianceStatus: payload.data?.complianceStatus ?? current.complianceStatus,
          rejectionReasonCode: payload.data?.rejectionReasonCode ?? null,
          onboardingReward: payload.data?.onboardingReward ?? current.onboardingReward
        };
      });
      setIsEditing(false);
      setSaveSuccess(t({ en: "Profile updated successfully.", es: "Perfil actualizado correctamente.", pt: "Perfil atualizado com sucesso." }));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditing = (): void => {
    setSaveError(null);
    setSaveSuccess(null);
    if (profile && !profile.username.trim() && !username.trim()) {
      setUsername(
        buildWalletSuggestedUsername({
          walletPublicKey: profile.walletPublicKey || walletPublicKey || connectedWalletAddress,
          providerName: walletProviderName,
          accountLabel: walletAccountLabel
        })
      );
    }
    setIsEditing(true);
  };

  const handleCancelEditing = (): void => {
    if (!profile) {
      return;
    }

    setUsername(profile.username);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl);
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setCountry(profile.country || "");
    setStateProvince(profile.stateProvince || "");
    setEmail(profile.email || "");
    setAddress(profile.address || "");
    setPhone(profile.phone || "");
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(false);
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
      <article className="marketplace-depth-card no-hover-lift space-y-3 rounded-2xl p-5 border-rose-500/30 bg-rose-500/10">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Could not load your profile", es: "No se pudo cargar tu perfil", pt: "Nao foi possivel carregar seu perfil" })}</h2>
        <p className="text-sm text-white/80">{loadError || t({ en: "Try again in a few minutes.", es: "Intenta nuevamente en unos minutos.", pt: "Tente novamente em alguns minutos." })}</p>
        <Button className="min-h-11 w-full sm:w-auto" onClick={() => window.location.reload()}>
          {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
        </Button>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      <article className="marketplace-depth-card no-hover-lift space-y-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">{t({ en: "Profile / My account", es: "Perfil / Mi cuenta", pt: "Perfil / Minha conta" })}</h2>
            <p className={`text-xs ${isEditing ? "text-amber-100" : "text-white/70"}`}>
              {isEditing
                ? hasUnsavedChanges
                  ? t({ en: "You have unsaved changes.", es: "Tienes cambios sin guardar.", pt: "Voce tem alteracoes nao salvas." })
                  : t({ en: "Editing mode enabled.", es: "Modo edicion activado.", pt: "Modo de edicao ativado." })
                : t({
                  en: "Viewing mode. Click edit profile to update your data.",
                  es: "Modo vista. Haz clic en editar perfil para actualizar tus datos.",
                  pt: "Modo visualizacao. Clique em editar perfil para atualizar seus dados."
                })}
            </p>
          </div>
          <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-xs font-medium text-emerald-100">
            {t({ en: "Wallet linked", es: "Wallet vinculada", pt: "Wallet vinculada" })}
          </span>
        </div>

        <div className="relative space-y-2 rounded-2xl bg-[linear-gradient(145deg,rgba(34,211,238,0.15)_0%,rgba(8,145,178,0.05)_100%)] p-4 sm:p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            {t({
              en: "Registered wallet for this profile",
              es: "Wallet registrada para este perfil",
              pt: "Wallet registrada para este perfil"
            })}
          </p>
          <p className="break-all font-mono text-xs text-white sm:text-sm">{profile.walletPublicKey || walletPublicKey}</p>
          <p className="text-xs text-white/75">
            {t({
              en: "This is the on-chain address associated with your account data.",
              es: "Esta es la direccion on-chain asociada a los datos de tu cuenta.",
              pt: "Este e o endereco on-chain associado aos dados da sua conta."
            })}
          </p>
        </div>

        <PwaCapabilityCard audience="wallet-profile" />

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
          <div className="marketplace-depth-card no-hover-lift space-y-5 rounded-2xl p-5 md:p-6">
              <div className="space-y-1 text-sm">
                <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                  {t({ en: "Username", es: "Usuario", pt: "Usuario" })}
                </span>
                {isEditing ? (
                  <>
                    <input
                      className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                      maxLength={32}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder={t({ en: "username_123", es: "usuario_123", pt: "usuario_123" })}
                      value={username}
                    />
                    {!profile.username.trim() && username.trim() ? (
                      <p className="text-xs text-cyan-200 mt-1">
                        {walletAccountLabel
                          ? t({
                            en: "Loaded from your connected wallet account label. You can edit it before saving.",
                            es: "Cargado desde la etiqueta de cuenta de tu wallet conectada. Puedes editarlo antes de guardar.",
                            pt: "Carregado do rotulo da conta da wallet conectada. Voce pode editar antes de salvar."
                          })
                          : t({
                            en: "Suggested from connected wallet. You can edit it before saving.",
                            es: "Sugerido desde la wallet conectada. Puedes editarlo antes de guardar.",
                            pt: "Sugerido da wallet conectada. Voce pode editar antes de salvar."
                          })}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-white text-[15px] py-1.5">{username || "—"}</p>
                )}
              </div>

            <div id={TOUR_STEP_IDS.NAME_EMAIL} className="grid gap-3 sm:grid-cols-2 scroll-mt-28">
              <div className="space-y-1 text-sm">
                <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                  {t({ en: "First name", es: "Nombre", pt: "Nome" })}
                </span>
                {isEditing ? (
                  <input
                    className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                    maxLength={100}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder={t({ en: "John", es: "Juan", pt: "Joao" })}
                    value={firstName}
                  />
                ) : (
                  <p className="text-white text-[15px] py-1.5">{firstName || "—"}</p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                  {t({ en: "Last name", es: "Apellido", pt: "Sobrenome" })}
                </span>
                {isEditing ? (
                  <input
                    className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                    maxLength={100}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder={t({ en: "Doe", es: "Perez", pt: "Silva" })}
                    value={lastName}
                  />
                ) : (
                  <p className="text-white text-[15px] py-1.5">{lastName || "—"}</p>
                )}
              </div>
            </div>

            <div id={TOUR_STEP_IDS.PHONE} className="grid gap-3 sm:grid-cols-2 scroll-mt-28">
              <div className="space-y-1 text-sm">
                <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                  {t({ en: "Email", es: "Correo electronico", pt: "E-mail" })}
                </span>
                {isEditing ? (
                  <input
                    className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                    maxLength={255}
                    type="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    value={email}
                  />
                ) : (
                  <p className="text-white text-[15px] py-1.5">{email || "—"}</p>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                  {t({ en: "Phone", es: "Telefono", pt: "Telefone" })}
                </span>
                {isEditing ? (
                  <div className="flex w-full items-center gap-1.5">
                    <select
                      className="min-h-11 w-[110px] rounded-xl px-2 text-sm outline-none transition focus:z-10 focus:bg-black/50 bg-black/30 text-white border-none"
                      onChange={(event) => {
                        const newCode = event.target.value;
                        const oldCodeMatch = COUNTRIES.find((c) => phone.startsWith(c.dialCode));
                        const numberPart = oldCodeMatch ? phone.slice(oldCodeMatch.dialCode.length).trim() : phone.trim();
                        setPhone(newCode + " " + numberPart);
                      }}
                      value={COUNTRIES.find((c) => phone.startsWith(c.dialCode))?.dialCode || "+1"}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.dialCode}>
                          {c.dialCode} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition focus:z-10 focus:bg-black/50 bg-black/30 text-white border-none"
                      maxLength={30}
                      onChange={(event) => {
                        const currentDialCode = COUNTRIES.find((c) => phone.startsWith(c.dialCode))?.dialCode || "+1";
                        setPhone(currentDialCode + " " + event.target.value);
                      }}
                      placeholder="(555) 000-0000"
                      value={(() => {
                        const oldCodeMatch = COUNTRIES.find((c) => phone.startsWith(c.dialCode));
                        return oldCodeMatch ? phone.slice(oldCodeMatch.dialCode.length).trim() : phone;
                      })()}
                    />
                  </div>
                ) : (
                  <p className="text-white text-[15px] py-1.5">{phone || "—"}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 text-sm">
                <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                  {t({ en: "Country", es: "Pais", pt: "Pais" })}
                </span>
                {isEditing ? (
                  <select
                    className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                    onChange={(event) => {
                      const newCountry = event.target.value;
                      setCountry(newCountry);
                      setStateProvince("");
                      const info = COUNTRIES.find((c) => c.code === newCountry);
                      if (info && (!phone || phone.trim() === "")) setPhone(info.dialCode + " ");
                    }}
                    value={country}
                  >
                    <option value="">{t({ en: "Select", es: "Seleccionar", pt: "Selecionar" })}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {t({ en: c.nameEn, es: c.nameEs, pt: c.namePt })}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white text-[15px] py-1.5">
                    {country ? t({ en: COUNTRIES.find(c => c.code === country)?.nameEn || country, es: COUNTRIES.find(c => c.code === country)?.nameEs || country, pt: COUNTRIES.find(c => c.code === country)?.namePt || country }) : "—"}
                  </p>
                )}
              </div>

              {(() => {
                const selectedCountryInfo = COUNTRIES.find((c) => c.code === country);
                if (selectedCountryInfo?.divisions) {
                  return (
                    <div className="space-y-1 text-sm">
                      <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                        {selectedCountryInfo.divisionLabel ? t(selectedCountryInfo.divisionLabel) : t({ en: "State/Province", es: "Estado/Provincia", pt: "Estado/Província" })}
                      </span>
                      {isEditing ? (
                        <select
                          className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                          onChange={(event) => setStateProvince(event.target.value)}
                          value={stateProvince}
                        >
                          <option value="">{t({ en: "Select", es: "Seleccionar", pt: "Selecionar" })}</option>
                          {selectedCountryInfo.divisions.map((d) => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-white text-[15px] py-1.5">
                          {stateProvince ? selectedCountryInfo.divisions.find(d => d.code === stateProvince)?.name || stateProvince : "—"}
                        </p>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="space-y-1 text-sm">
                    <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                      {t({ en: "State/Province", es: "Estado/Provincia", pt: "Estado/Província" })}
                    </span>
                    {isEditing ? (
                      <input
                        className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                        maxLength={100}
                        onChange={(event) => setStateProvince(event.target.value)}
                        placeholder={t({ en: "Optional", es: "Opcional", pt: "Opcional" })}
                        value={stateProvince}
                      />
                    ) : (
                      <p className="text-white text-[15px] py-1.5">{stateProvince || "—"}</p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div id={TOUR_STEP_IDS.ADDRESS} className="space-y-1 text-sm scroll-mt-28">
              <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                {t({ en: "Address", es: "Direccion", pt: "Endereco" })}
              </span>
              {isEditing ? (
                <input
                  className="min-h-11 w-full rounded-xl px-3 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                  maxLength={500}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder={t({ en: "123 Street Ave.", es: "Calle 123", pt: "Rua 123" })}
                  value={address}
                />
              ) : (
                <p className="text-white text-[15px] py-1.5">{address || "—"}</p>
              )}
            </div>

            <div id={TOUR_STEP_IDS.BIO} className="space-y-1 text-sm scroll-mt-28">
              <span className={isEditing ? "text-white/85" : "text-cyan-300 font-medium"}>
                {t({ en: "Bio", es: "Bio", pt: "Bio" })}
              </span>
              {isEditing ? (
                <textarea
                  className="min-h-24 w-full rounded-xl px-3 py-2 text-sm outline-none transition bg-black/30 text-white focus:bg-black/50 border-none"
                  maxLength={280}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder={t({ en: "Tell the community who you are.", es: "Cuentale a la comunidad quien eres.", pt: "Conte para a comunidade quem voce e." })}
                  value={bio}
                />
              ) : (
                <p className="text-white text-[15px] py-1.5 whitespace-pre-wrap">{bio || "—"}</p>
              )}
            </div>
          </div>

          <div className="marketplace-depth-card no-hover-lift w-full space-y-3 rounded-2xl p-4 text-center md:w-[260px] md:justify-self-end">
            <div className="flex items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-violet-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-14 w-14 text-white"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {selectedAvatarPreviewUrl && selectedAvatarPreviewUrl !== "/avatars/default-user.svg" && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    alt={t({ en: "Profile avatar preview", es: "Vista previa del avatar", pt: "Pre-visualizacao do avatar" })}
                    className="absolute inset-0 h-full w-full bg-slate-900 object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    src={selectedAvatarPreviewUrl}
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">
                {t({ en: "Profile avatar", es: "Avatar del perfil", pt: "Avatar do perfil" })}
              </p>
              <p className="text-xs text-white/70">
                {isEditing
                  ? t({
                    en: "Choose an Fraction image from your connected wallet or use the default avatar.",
                    es: "Elige una imagen Fracción de tu wallet conectada o usa el avatar por defecto.",
                    pt: "Escolha uma imagem Fração da wallet conectada ou use o avatar padrao."
                  })
                  : t({
                    en: "Click edit profile to change your avatar.",
                    es: "Haz clic en editar perfil para cambiar tu avatar.",
                    pt: "Clique em editar perfil para alterar seu avatar."
                  })}
              </p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="min-h-11 w-full sm:w-auto"
                disabled={isLoadingWalletAvatars}
                onClick={() => {
                  void loadWalletAvatarOptions();
                }}
                variant="ghost"
              >
                {isLoadingWalletAvatars
                  ? t({ en: "Loading Fraction avatars...", es: "Cargando avatares Fracción...", pt: "Carregando avatares Fração..." })
                  : t({ en: "Reload wallet Fractions", es: "Recargar Fracciones de wallet", pt: "Recarregar Frações da wallet" })}
              </Button>

              <Button
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setAvatarUrl("")}
                variant="outline"
              >
                {t({ en: "Use default avatar", es: "Usar avatar por defecto", pt: "Usar avatar padrao" })}
              </Button>
            </div>

            {walletAvatarError && <p className="text-sm text-rose-200">{walletAvatarError}</p>}

            {!isLoadingWalletAvatars && walletAvatarOptions.length === 0 ? (
              <p className="text-sm text-white/70">
                {t({
                  en: "No Fraction images were found in your wallet.",
                  es: "No se encontraron imagenes Fracción en tu wallet.",
                  pt: "Nenhuma imagem Fração foi encontrada na sua wallet."
                })}
              </p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {walletAvatarOptions.map((item) => {
                const isSelected = avatarUrl === item.imageUrl;

                return (
                  <button
                    className={`min-h-11 rounded-xl border p-2 text-left transition ${isSelected
                      ? "border-cyan-300 bg-cyan-500/15"
                      : "border-white/10 bg-black/30 hover:border-white/25"}`}
                    key={`${item.assetId}-${item.imageUrl}`}
                    onClick={() => {
                      setAvatarUrl(item.imageUrl);
                      setSaveError(null);
                      setSaveSuccess(null);
                    }}
                    type="button"
                  >
                    <div className="mb-2 h-20 w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "/avatars/default-user.svg";
                        }}
                        src={item.imageUrl}
                      />
                    </div>
                    <p className="truncate text-sm font-medium text-white">{item.name}</p>
                    <p className="truncate font-mono text-xs text-white/60">{truncateAssetId(item.assetId)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {saveError && <p className="text-sm text-rose-200">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-emerald-200">{saveSuccess}</p>}

        <div id={TOUR_STEP_IDS.EDIT_BUTTON} className="flex flex-wrap gap-2 scroll-mt-28">
          {isEditing ? (
            <>
              <Button className="min-h-11 w-full sm:w-auto" disabled={isSaving} onClick={handleCancelEditing} variant="ghost">
                {t({ en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
              </Button>
              <Button className="min-h-11 w-full sm:w-auto" disabled={isSaving || !hasUnsavedChanges} onClick={handleSave}>
                {isSaving
                  ? t({ en: "Saving...", es: "Guardando...", pt: "Salvando..." })
                  : t({ en: "Save changes", es: "Guardar cambios", pt: "Salvar alteracoes" })}
              </Button>
            </>
          ) : (
            <Button id="profile-edit-button" className="min-h-11 w-full sm:w-auto" onClick={handleStartEditing} variant="outline">
              {t({ en: "Edit profile", es: "Editar perfil", pt: "Editar perfil" })}
            </Button>
          )}
        </div>
      </article>

      {profile.onboardingReward ? (
        <article className="marketplace-depth-card no-hover-lift space-y-3 rounded-2xl p-5 border-emerald-400/25 bg-emerald-500/8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                {t({ en: "Onboarding reward", es: "Beneficio de onboarding", pt: "Benefício de onboarding" })}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {t({
                  en: `Complete your profile and unlock ${formatUsdByLocale(profile.onboardingReward.rewardAmountUsdSnapshot, locale)} USD`,
                  es: `Completa tu perfil y desbloquea ${formatUsdByLocale(profile.onboardingReward.rewardAmountUsdSnapshot, locale)} USD`,
                  pt: `Complete seu perfil e desbloqueie ${formatUsdByLocale(profile.onboardingReward.rewardAmountUsdSnapshot, locale)} USD`
                })}
              </h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${onboardingRewardBadgeClass(profile.onboardingReward.status)}`}>
              {t(ONBOARDING_REWARD_STATUS_LABELS[profile.onboardingReward.status])}
            </span>
          </div>

          <p className="text-sm text-white/80">
            {profile.onboardingReward.status === "earned"
              ? t({
                  en: "Your reward is ready and will apply as a one-time discount in checkout.",
                  es: "Tu beneficio ya está listo y se aplicará una sola vez como descuento en checkout.",
                  pt: "Seu benefício já está pronto e será aplicado uma única vez no checkout."
                })
              : profile.onboardingReward.status === "pending_review"
                ? t({
                    en: "Your KYC is under review. If Stripe verifies it inside the allowed review window, the benefit is earned automatically.",
                    es: "Tu KYC está en revisión. Si Stripe lo verifica dentro de la ventana permitida, el beneficio se gana automáticamente.",
                    pt: "Seu KYC está em revisão. Se a Stripe verificar dentro da janela permitida, o benefício é ganho automaticamente."
                  })
                : profile.onboardingReward.status === "expired"
                  ? t({
                      en: "This benefit expired before the full profile + KYC flow was completed.",
                      es: "Este beneficio expiró antes de completar el flujo de perfil + KYC.",
                      pt: "Este benefício expirou antes da conclusão do fluxo de perfil + KYC."
                    })
                  : t({
                      en: "Finish the remaining onboarding steps to convert this into a one-time checkout discount.",
                      es: "Completa los pasos restantes del onboarding para convertirlo en un descuento único de checkout.",
                      pt: "Conclua as etapas restantes do onboarding para transformar isso em um desconto único no checkout."
                    })}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="marketplace-depth-card no-hover-lift rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">{t({ en: "Status", es: "Estado", pt: "Status" })}</p>
              <p className="mt-1 text-sm font-medium text-white">{t(ONBOARDING_REWARD_STATUS_LABELS[profile.onboardingReward.status])}</p>
            </div>
            <div className="marketplace-depth-card no-hover-lift rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">{t({ en: "Amount", es: "Monto", pt: "Valor" })}</p>
              <p className="mt-1 text-sm font-medium text-white">{formatUsdByLocale(profile.onboardingReward.rewardAmountUsdSnapshot, locale)}</p>
            </div>
            <div className="marketplace-depth-card no-hover-lift rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">{t({ en: "Window", es: "Ventana", pt: "Janela" })}</p>
              <p className="mt-1 text-sm font-medium text-white">
                {formatOnboardingRewardRemainingWindow(profile.onboardingReward.remainingSeconds, locale)
                  ?? t({ en: "Closed", es: "Cerrada", pt: "Encerrada" })}
              </p>
            </div>
            <div className="marketplace-depth-card no-hover-lift rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">{t({ en: "Usage", es: "Uso", pt: "Uso" })}</p>
              <p className="mt-1 text-sm font-medium text-white">
                {profile.onboardingReward.consumedAt
                  ? t({ en: "Used", es: "Usado", pt: "Usado" })
                  : profile.onboardingReward.canUseInCheckout
                    ? t({ en: "Available in checkout", es: "Disponible en checkout", pt: "Disponível no checkout" })
                    : t({ en: "Pending", es: "Pendiente", pt: "Pendente" })}
              </p>
            </div>
          </div>
        </article>
      ) : null}

      <article id={TOUR_STEP_IDS.KYC} className="marketplace-depth-card no-hover-lift space-y-3 rounded-2xl p-5 scroll-mt-28">
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
      </article>
    </div>
  );
}
