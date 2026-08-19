/**
 * features/navigation/domain/nav-modal-types.ts
 *
 * Tipos e interfaces del dominio de la feature Navigation.
 * Sin dependencias de React ni de frameworks externos.
 */

import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import type { PostAuthOnboardingReward } from "@/lib/post-auth-decision";
import type { LocaleText } from "@/lib/i18n";

export type ActionPhase = "idle" | "connecting" | "signing" | "verifying" | "disconnecting";

export type MessageSigner = (message: Uint8Array) => Promise<Uint8Array>;

export type NavEntry = {
  href: string;
  label: string;
};

export type Translate = (text: LocaleText) => string;

export type ProtectedProfileResponse = {
  ok?: boolean;
  data?: {
    firstName: string | null;
    email: string | null;
    phone: string | null;
    onboardingReward?: PostAuthOnboardingReward | null;
  };
};

export type { MessageSignerWalletAdapter };
