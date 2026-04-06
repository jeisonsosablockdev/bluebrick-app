"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COUNTRIES } from "@/lib/countries";
import { TOUR_STEP_IDS } from "@/components/dashboard/quick-tour-overlay";

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
};

type ProfileKycModuleProps = {
  walletPublicKey: string;
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
  const { t } = useI18n();
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
  const [isEditing, setIsEditing] = useState(false);

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
  const connectedWalletAddress = wallet?.adapter?.publicKey?.toBase58() ?? profile?.walletPublicKey ?? walletPublicKey;
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
          rejectionReasonCode
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
          phone
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
          rejectionReasonCode: payload.data?.rejectionReasonCode ?? null
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
          walletPublicKey: profile.walletPublicKey || walletPublicKey,
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
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80">
            {t({ en: "Wallet linked", es: "Wallet vinculada", pt: "Wallet vinculada" })}
          </span>
        </div>

        <div className="space-y-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">
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

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
          <div className="space-y-3">
            <label className="space-y-1 text-sm text-white/85">
              <span>{t({ en: "Username", es: "Usuario", pt: "Usuario" })}</span>
              <input
                className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing
                  ? "border border-white/15 bg-black/30 text-white focus:border-white/35"
                  : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                maxLength={32}
                readOnly={!isEditing}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t({ en: "username_123", es: "usuario_123", pt: "usuario_123" })}
                value={username}
              />
              {isEditing && !profile.username.trim() && username.trim() ? (
                <p className="text-xs text-cyan-200">
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
            </label>

            <div id={TOUR_STEP_IDS.NAME_EMAIL} className="grid gap-3 sm:grid-cols-2 scroll-mt-28">
              <label className="space-y-1 text-sm text-white/85">
                <span>{t({ en: "First name", es: "Nombre", pt: "Nome" })}</span>
                <input
                  className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing ? "border border-white/15 bg-black/30 text-white focus:border-white/35" : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                  maxLength={100}
                  readOnly={!isEditing}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder={t({ en: "John", es: "Juan", pt: "Joao" })}
                  value={firstName}
                />
              </label>

              <label className="space-y-1 text-sm text-white/85">
                <span>{t({ en: "Last name", es: "Apellido", pt: "Sobrenome" })}</span>
                <input
                  className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing ? "border border-white/15 bg-black/30 text-white focus:border-white/35" : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                  maxLength={100}
                  readOnly={!isEditing}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder={t({ en: "Doe", es: "Perez", pt: "Silva" })}
                  value={lastName}
                />
              </label>
            </div>

            <div id={TOUR_STEP_IDS.PHONE} className="grid gap-3 sm:grid-cols-2 scroll-mt-28">
              <label className="space-y-1 text-sm text-white/85">
                <span>{t({ en: "Email", es: "Correo electronico", pt: "E-mail" })}</span>
                <input
                  className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing ? "border border-white/15 bg-black/30 text-white focus:border-white/35" : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                  maxLength={255}
                  type="email"
                  readOnly={!isEditing}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  value={email}
                />
              </label>

              <label className="space-y-1 text-sm text-white/85">
                <span>{t({ en: "Phone", es: "Telefono", pt: "Telefone" })}</span>
                <div className="flex w-full items-center">
                  <select
                    className={`min-h-11 w-[110px] rounded-l-xl border-r-0 px-2 text-sm outline-none transition focus:z-10 focus:ring-1 focus:ring-white/35 ${isEditing ? "border border-white/15 bg-black/30 text-white" : "border border-white/10 bg-black/20 text-white/70"}`}
                    disabled={!isEditing}
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
                    className={`min-h-11 w-full rounded-r-xl px-3 text-sm outline-none transition focus:z-10 focus:ring-1 focus:ring-white/35 ${isEditing ? "border border-l-white/10 border-white/15 bg-black/30 text-white" : "border border-l-white/5 border-white/10 bg-black/20 text-white/70"}`}
                    maxLength={30}
                    readOnly={!isEditing}
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
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-white/85">
                <span>{t({ en: "Country", es: "Pais", pt: "Pais" })}</span>
                <select
                  className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing ? "border border-white/15 bg-black/30 text-white focus:border-white/35" : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                  disabled={!isEditing}
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
              </label>

              {(() => {
                const selectedCountryInfo = COUNTRIES.find((c) => c.code === country);
                if (selectedCountryInfo?.divisions) {
                  return (
                    <label className="space-y-1 text-sm text-white/85">
                      <span>{selectedCountryInfo.divisionLabel ? t(selectedCountryInfo.divisionLabel) : t({ en: "State/Province", es: "Estado/Provincia", pt: "Estado/Província" })}</span>
                      <select
                        className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing ? "border border-white/15 bg-black/30 text-white focus:border-white/35" : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                        disabled={!isEditing}
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
                    </label>
                  );
                }
                return (
                  <label className="space-y-1 text-sm text-white/85">
                    <span>{t({ en: "State/Province", es: "Estado/Provincia", pt: "Estado/Província" })}</span>
                    <input
                      className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing ? "border border-white/15 bg-black/30 text-white focus:border-white/35" : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                      maxLength={100}
                      readOnly={!isEditing}
                      onChange={(event) => setStateProvince(event.target.value)}
                      placeholder={t({ en: "Optional", es: "Opcional", pt: "Opcional" })}
                      value={stateProvince}
                    />
                  </label>
                );
              })()}
            </div>

            <label id={TOUR_STEP_IDS.ADDRESS} className="space-y-1 text-sm text-white/85 scroll-mt-28">
              <span>{t({ en: "Address", es: "Direccion", pt: "Endereco" })}</span>
              <input
                className={`min-h-11 w-full rounded-xl px-3 text-sm outline-none ring-offset-2 transition ${isEditing ? "border border-white/15 bg-black/30 text-white focus:border-white/35" : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                maxLength={500}
                readOnly={!isEditing}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={t({ en: "123 Street Ave.", es: "Calle 123", pt: "Rua 123" })}
                value={address}
              />
            </label>

            <label id={TOUR_STEP_IDS.BIO} className="space-y-1 text-sm text-white/85 scroll-mt-28">
              <span>{t({ en: "Bio", es: "Bio", pt: "Bio" })}</span>
              <textarea
                className={`min-h-24 w-full rounded-xl px-3 py-2 text-sm outline-none ring-offset-2 transition ${isEditing
                  ? "border border-white/15 bg-black/30 text-white focus:border-white/35"
                  : "border border-white/10 bg-black/20 text-white/70 focus:border-white/10"}`}
                maxLength={280}
                readOnly={!isEditing}
                onChange={(event) => setBio(event.target.value)}
                placeholder={t({ en: "Tell the community who you are.", es: "Cuentale a la comunidad quien eres.", pt: "Conte para a comunidade quem voce e." })}
                value={bio}
              />
            </label>
          </div>

          <div className="glass-surface w-full space-y-3 bg-transparent p-4 text-center md:w-[260px] md:justify-self-end">
            <div className="flex items-center justify-center">
              <div className="h-28 w-28 overflow-hidden rounded-2xl border border-white/20 bg-black/35">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t({ en: "Profile avatar preview", es: "Vista previa del avatar", pt: "Pre-visualizacao do avatar" })}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/avatars/default-user.svg";
                  }}
                  src={selectedAvatarPreviewUrl}
                />
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
      </Card>

      <Card id={TOUR_STEP_IDS.KYC} className="space-y-3 scroll-mt-28">
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
