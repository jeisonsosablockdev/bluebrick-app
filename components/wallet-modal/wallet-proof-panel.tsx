"use client";

import { motion, useReducedMotion } from "motion/react";

import { ReferralCodeSection } from "@/components/wallet-modal/referral-code-section";
import { PHANTOM_INSTALL_URL } from "@/components/wallet-modal/constants";
import { Button } from "@/components/ui/button";
import type { LocaleText } from "@/lib/i18n";
import { MOTION_FAST_OPACITY_TRANSITION, MOTION_GENTLE_TRANSITION, shouldUseReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { getWalletProofViewModel, type WalletProofPhase } from "@/lib/wallet-proof-view-model";

type Translate = (text: LocaleText) => string;

type WalletProofSessionState = {
  phase: WalletProofPhase;
  hasWalletSession: boolean;
  hasWalletSessionAdapterMismatch: boolean;
  hasFederatedSession: boolean;
  hasWalletAuthIntent: boolean;
  isWalletAuthInProgress: boolean;
};

type WalletProofConnectionState = {
  isConnected: boolean;
  isBusy: boolean;
  isFederatedLoginAvailable: boolean;
  isPhantomInstalled: boolean;
  walletConnectionStatusText: string | null;
  walletPublicKey: string | null;
};

type WalletProofReferralState = {
  code: string;
  isVisible: boolean;
  onChange: (nextValue: string) => void;
  onToggle: () => void;
};

type WalletProofActions = {
  primaryLabel: string;
  disconnectLabel: string;
  shouldShowWalletPrimaryAction: boolean;
  shouldShowDisconnectButton: boolean;
  onCopyAddress: () => void;
  onDisconnect: () => void;
  onStartFederatedLink: () => void;
  onStartWalletSignIn: () => void;
};

type WalletProofPanelProps = {
  t: Translate;
  actions: WalletProofActions;
  connection: WalletProofConnectionState;
  referral: WalletProofReferralState;
  session: WalletProofSessionState;
};

export function WalletProofPanel({
  t,
  actions,
  connection,
  referral,
  session
}: WalletProofPanelProps) {
  const {
    phase,
    hasWalletSession,
    hasWalletSessionAdapterMismatch,
    hasFederatedSession,
    hasWalletAuthIntent,
    isWalletAuthInProgress
  } = session;
  const {
    isConnected,
    isBusy,
    isFederatedLoginAvailable,
    isPhantomInstalled,
    walletConnectionStatusText,
    walletPublicKey
  } = connection;
  const {
    code: referralCode,
    isVisible: isReferralFieldVisible,
    onChange: onReferralChange,
    onToggle: onReferralToggle
  } = referral;
  const {
    primaryLabel: walletPrimaryLabel,
    disconnectLabel: walletDisconnectActionLabel,
    shouldShowWalletPrimaryAction,
    shouldShowDisconnectButton,
    onCopyAddress,
    onDisconnect,
    onStartFederatedLink,
    onStartWalletSignIn
  } = actions;
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = shouldUseReducedMotion(prefersReducedMotion);
  const viewModel = getWalletProofViewModel({
    t,
    phase,
    hasWalletSession,
    hasWalletSessionAdapterMismatch,
    isConnected
  });

  return (
    <motion.div
      className="space-y-4 rounded-[28px] border border-white/15 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-5"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? MOTION_FAST_OPACITY_TRANSITION : MOTION_GENTLE_TRANSITION}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/90">
          {viewModel.eyebrow}
        </p>
        <h3 className="text-xl font-semibold leading-tight text-white">
          {viewModel.title}
        </h3>
        <p className="text-sm leading-6 text-white/70">
          {viewModel.description}
        </p>
      </div>

      <div className="rounded-2xl border border-white/15 bg-slate-950/35 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
              {viewModel.selectedWalletLabel}
            </p>
            <p className="mt-1 font-mono text-sm text-white/[0.88]">
              {walletConnectionStatusText ?? viewModel.disconnectedWalletLabel}
            </p>
          </div>
          <motion.span
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              viewModel.statusTone === "progress"
                ? "border-white/[0.18] bg-white/[0.07] text-cyan-100"
                : viewModel.statusTone === "warning"
                  ? "border-amber-200/35 bg-amber-400/10 text-amber-100"
                : viewModel.statusTone === "active"
                  ? "border-white/[0.18] bg-white/[0.07] text-white/85"
                  : "border-white/15 bg-white/[0.08] text-white/75"
            )}
            animate={isWalletAuthInProgress && !shouldReduceMotion ? { opacity: [0.72, 1, 0.72] } : { opacity: 1 }}
            transition={isWalletAuthInProgress && !shouldReduceMotion ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : MOTION_FAST_OPACITY_TRANSITION}
          >
            {viewModel.statusLabel}
          </motion.span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label={viewModel.progressLabel}>
        {viewModel.steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border px-3 py-2 text-center text-xs font-semibold transition-colors",
              step.complete
                ? "border-white/[0.16] bg-white/[0.08] text-white/85"
                : step.active
                  ? "border-cyan-200/28 bg-white/[0.07] text-cyan-100 shadow-[inset_0_-1px_0_rgba(103,232,249,0.22)]"
                  : "border-white/10 bg-white/[0.04] text-white/55"
            )}
            aria-current={step.active ? "step" : undefined}
          >
            {step.active ? (
              shouldReduceMotion ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-px bg-cyan-100/70 shadow-[0_0_18px_rgba(103,232,249,0.72)]"
                />
              ) : (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-px bg-cyan-100/70 shadow-[0_0_18px_rgba(103,232,249,0.72)]"
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )
            ) : null}
            {step.complete ? (
              <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-px bg-white/35" />
            ) : null}
            <span className="relative z-10">{step.label}</span>
          </div>
        ))}
      </div>

      {!isPhantomInstalled ? (
        <p className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {t({
            en: "Phantom is not installed.",
            es: "Phantom no esta instalada.",
            pt: "A Phantom nao esta instalada."
          })}{" "}
          <a className="underline decoration-amber-200/70 underline-offset-2 hover:text-amber-100" href={PHANTOM_INSTALL_URL} target="_blank" rel="noreferrer">
            {t({ en: "Install Phantom", es: "Instalar Phantom", pt: "Instalar Phantom" })}
          </a>{" "}
          {t({ en: "and retry.", es: "y vuelve a intentarlo.", pt: "e tente novamente." })}
        </p>
      ) : null}

      <ReferralCodeSection
        inputId="wallet-referral-code"
        isVisible={isReferralFieldVisible}
        t={t}
        value={referralCode}
        onChange={onReferralChange}
        onToggle={onReferralToggle}
      />

      {shouldShowWalletPrimaryAction || shouldShowDisconnectButton ? (
        <div className="grid grid-cols-1 gap-3">
          {shouldShowWalletPrimaryAction ? (
            <Button onClick={onStartWalletSignIn} disabled={isBusy || !isPhantomInstalled} className="min-h-12 w-full px-5 text-center leading-snug">
              {walletPrimaryLabel}
            </Button>
          ) : null}

          {shouldShowDisconnectButton ? (
            <Button variant="outline" onClick={onDisconnect} disabled={phase === "disconnecting"} className="min-h-11 w-full px-5 text-center leading-snug">
              {walletDisconnectActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {hasWalletSession && !hasFederatedSession && isFederatedLoginAvailable ? (
        <Button variant="outline" onClick={onStartFederatedLink} disabled={isBusy} className="min-h-11 w-full">
          {t({
            en: "Link email sign-in",
            es: "Vincular ingreso por email",
            pt: "Vincular login por email"
          })}
        </Button>
      ) : null}

      {walletPublicKey && !hasWalletSessionAdapterMismatch && (hasWalletAuthIntent || hasWalletSession) ? (
        <Button variant="ghost" onClick={onCopyAddress} disabled={isWalletAuthInProgress} className="min-h-11 w-full border border-white/10 bg-white/10 hover:bg-white/15">
          {t({ en: "Copy Address", es: "Copiar direccion", pt: "Copiar endereco" })}
        </Button>
      ) : null}
    </motion.div>
  );
}
