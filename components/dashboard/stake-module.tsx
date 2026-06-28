"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  deserializeLegacyVersionedTransaction,
  serializeLegacyVersionedTransaction
} from "@/lib/solana-kit/compat/web3-transactions";

type RemoteStakeState = "disabled_unsupported" | "ready_to_stake" | "ready_to_unstake" | "sync_pending";
type LocalStakeState = RemoteStakeState | "pending_stake" | "pending_unstake" | "action_error";

type StakeAssetResponse = {
  assetAddress: string;
  propertyId: string;
  propertyTitle: string;
  collectionAddress: string;
  candyMachineAddress: string;
  displayName: string;
  imageUrl: string | null;
  visibleState: RemoteStakeState;
  action: "Stake" | "Unstake" | null;
  isFrozen: boolean;
  syncPending: boolean;
};

type StakeAssetsPayload = {
  ok?: boolean;
  data?: {
    walletPublicKey: string;
    items: StakeAssetResponse[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type PreparedStakePayload = {
  ok?: boolean;
  data?: {
    attemptId: string;
    idempotencyKey: string;
    transactionBase64: string;
  };
  error?: {
    code?: string;
    message?: string;
    recoverable?: boolean;
  };
};

type SubmittedStakePayload = {
  ok?: boolean;
  data?: {
    attemptId: string;
    txSignature: string;
  };
  error?: {
    code?: string;
    message?: string;
    recoverable?: boolean;
  };
};

type LocalAssetState = {
  localState: LocalStakeState;
  errorMessage?: string | null;
  expectedResolvedState?: RemoteStakeState | null;
};

class StakeActionClientError extends Error {
  readonly code: string | null;
  readonly recoverable: boolean;

  constructor(message: string, input?: { code?: string; recoverable?: boolean }) {
    super(message);
    this.name = "StakeActionClientError";
    this.code = input?.code ?? null;
    this.recoverable = input?.recoverable ?? false;
  }
}

const STAKE_SYNC_POLL_INTERVAL_MS = 4_000;
const STAKE_SYNC_POLL_TIMEOUT_MS = 120_000;

function fromBase64(base64Value: string): Uint8Array {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

async function parseResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

function createStakeActionClientError(
  payload: PreparedStakePayload | SubmittedStakePayload,
  fallbackMessage: string
): StakeActionClientError {
  return new StakeActionClientError(payload.error?.message ?? fallbackMessage, {
    code: payload.error?.code,
    recoverable: payload.error?.recoverable
  });
}

async function fetchStakeAssets(): Promise<StakeAssetResponse[]> {
  const response = await fetch("/api/protected/stake/assets", {
    method: "GET",
    cache: "no-store"
  });
  const payload = await parseResponse<StakeAssetsPayload>(response);

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "Could not load stake assets.");
  }

  return payload.data.items;
}

function statusClassName(state: LocalStakeState): string {
  if (state === "ready_to_stake") {
    return "bg-emerald-500/20 text-emerald-200";
  }

  if (state === "ready_to_unstake") {
    return "bg-cyan-500/20 text-cyan-200";
  }

  if (state === "pending_stake" || state === "pending_unstake" || state === "sync_pending") {
    return "bg-indigo-500/20 text-indigo-200";
  }

  return "bg-rose-500/20 text-rose-200";
}

function statusLabel(state: LocalStakeState, t: ReturnType<typeof useI18n>["t"]): string {
  if (state === "ready_to_stake") {
    return t({ en: "Ready to stake", es: "Listo para stake", pt: "Pronto para stake" });
  }

  if (state === "ready_to_unstake") {
    return t({ en: "Ready to unstake", es: "Listo para unstake", pt: "Pronto para unstake" });
  }

  if (state === "pending_stake") {
    return t({ en: "Stake pending", es: "Stake pendiente", pt: "Stake pendente" });
  }

  if (state === "pending_unstake") {
    return t({ en: "Unstake pending", es: "Unstake pendiente", pt: "Unstake pendente" });
  }

  if (state === "sync_pending") {
    return t({ en: "Sync pending", es: "Sincronizacion pendiente", pt: "Sincronizacao pendente" });
  }

  if (state === "disabled_unsupported") {
    return t({ en: "Unsupported", es: "No soportado", pt: "Nao suportado" });
  }

  return t({ en: "Action error", es: "Error de accion", pt: "Erro de acao" });
}

function actionLabel(state: LocalStakeState): "Stake" | "Unstake" | null {
  if (state === "ready_to_stake") {
    return "Stake";
  }

  if (state === "ready_to_unstake") {
    return "Unstake";
  }

  return null;
}

function isProcessingStakeState(state: LocalStakeState): boolean {
  return state === "pending_stake" || state === "pending_unstake" || state === "sync_pending";
}

function processingLabel(state: LocalStakeState, t: ReturnType<typeof useI18n>["t"]): string {
  if (state === "sync_pending") {
    return t({
      en: "Syncing profile...",
      es: "Sincronizando perfil...",
      pt: "Sincronizando perfil..."
    });
  }

  return t({ en: "Processing...", es: "Procesando...", pt: "Processando..." });
}

function reconcileLocalAssetStatesWithRemoteAssets(
  current: Record<string, LocalAssetState>,
  remoteAssets: StakeAssetResponse[]
): Record<string, LocalAssetState> {
  const remoteByAsset = new Map(remoteAssets.map((asset) => [asset.assetAddress, asset]));
  let changed = false;
  const next = { ...current };

  for (const [assetAddress, local] of Object.entries(current)) {
    const remote = remoteByAsset.get(assetAddress);

    if (!remote) {
      delete next[assetAddress];
      changed = true;
      continue;
    }

    if (!isProcessingStakeState(local.localState) || remote.visibleState === "sync_pending") {
      continue;
    }

    const expected = local.expectedResolvedState ?? null;
    if (!expected || remote.visibleState === expected || remote.visibleState === "disabled_unsupported") {
      delete next[assetAddress];
      changed = true;
    }
  }

  return changed ? next : current;
}

function reasonLabel(
  asset: StakeAssetResponse,
  state: LocalStakeState,
  errorMessage: string | null | undefined,
  t: ReturnType<typeof useI18n>["t"]
): string {
  if (state === "ready_to_stake") {
    return t({
      en: "Asset is eligible and can be frozen from this wallet.",
      es: "El activo es elegible y puede congelarse desde esta wallet.",
      pt: "O ativo e elegivel e pode ser congelado por esta wallet."
    });
  }

  if (state === "ready_to_unstake") {
    return t({
      en: "Asset is currently frozen and can be unfrozen from this wallet.",
      es: "El activo esta congelado actualmente y puede descongelarse desde esta wallet.",
      pt: "O ativo esta congelado e pode ser descongelado por esta wallet."
    });
  }

  if (state === "pending_stake" || state === "pending_unstake") {
    return t({
      en: "Wallet confirmation is in progress. Duplicate actions remain blocked.",
      es: "La confirmacion de wallet esta en curso. Las acciones duplicadas siguen bloqueadas.",
      pt: "A confirmacao da wallet esta em andamento. Acoes duplicadas seguem bloqueadas."
    });
  }

  if (state === "sync_pending") {
    return t({
      en: "On-chain action succeeded, but profile persistence is still syncing.",
      es: "La accion on-chain ya fue exitosa, pero la persistencia de perfil sigue sincronizando.",
      pt: "A acao on-chain foi concluida, mas a persistencia do perfil ainda esta sincronizando."
    });
  }

  if (state === "disabled_unsupported") {
    return t({
      en: "This BRIDS NFT is owned by your wallet but does not expose owner freeze / unfreeze.",
      es: "Este NFT de BRIDS esta en tu wallet pero no expone freeze / unfreeze para owner.",
      pt: "Este NFT da BRIDS esta na sua wallet mas nao expoe freeze / unfreeze para owner."
    });
  }

  return errorMessage
    ?? t({
      en: "The last action failed. Review the wallet or network error and retry.",
      es: "La ultima accion fallo. Revisa el error de wallet o red e intenta de nuevo.",
      pt: "A ultima acao falhou. Revise o erro da wallet ou da rede e tente novamente."
    });
}

function isWalletUserRejectedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("user rejected") || message.includes("rejected the request");
}

function isRecoverableBlockhashError(error: unknown): boolean {
  return error instanceof StakeActionClientError && error.code === "BLOCKHASH_EXPIRED" && error.recoverable;
}

function StakeInlineSpinner(props: { reduceMotion: boolean }): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={props.reduceMotion
        ? "inline-block h-4 w-4 rounded-full border border-current"
        : "inline-block h-4 w-4 animate-spin rounded-full border border-current border-t-transparent"}
    />
  );
}

function StakeConfirmModal(props: {
  asset: StakeAssetResponse;
  action: "Stake" | "Unstake";
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}): ReactElement {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label={t({ en: "Close confirmation", es: "Cerrar confirmacion", pt: "Fechar confirmacao" })}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={props.busy ? undefined : props.onClose}
        type="button"
      />

      <section className="glass-modal-surface relative mx-auto mt-10 w-[92%] max-w-lg rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Confirm action", es: "Confirmar accion", pt: "Confirmar acao" })}: {props.action}
        </h2>
        <p className="mt-2 text-sm text-white/75">
          {t({ en: "You are about to execute", es: "Vas a ejecutar", pt: "Voce vai executar" })}{" "}
          <span className="font-semibold text-white">{props.action}</span>{" "}
          {t({ en: "for", es: "para", pt: "para" })}{" "}
          <span className="font-semibold text-white">{props.asset.displayName}</span>.
        </p>
        <p className="mt-2 break-all font-mono text-xs text-white/60">{props.asset.assetAddress}</p>

        <Card className="mt-4 space-y-2 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm text-amber-100">
            {t({
              en: "Stake maps to freeze and Unstake maps to unfreeze on-chain.",
              es: "Stake se mapea a freeze y Unstake se mapea a unfreeze on-chain.",
              pt: "Stake corresponde a freeze e Unstake corresponde a unfreeze on-chain."
            })}
          </p>
          <p className="text-sm text-amber-100">
            {t({
              en: "The wallet signature is required and duplicate actions remain blocked while the state is resolving.",
              es: "La firma de wallet es obligatoria y las acciones duplicadas siguen bloqueadas mientras el estado se resuelve.",
              pt: "A assinatura da wallet e obrigatoria e acoes duplicadas seguem bloqueadas enquanto o estado e resolvido."
            })}
          </p>
        </Card>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button className="min-h-11" disabled={props.busy} variant="ghost" onClick={props.onClose}>
            {t({ en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
          </Button>
          <Button className="min-h-11" disabled={props.busy} variant="primary" onClick={props.onConfirm}>
            {props.busy
              ? t({ en: "Processing...", es: "Procesando...", pt: "Processando..." })
              : `${t({ en: "Confirm", es: "Confirmar", pt: "Confirmar" })} ${props.action}`}
          </Button>
        </div>
      </section>
    </div>
  );
}

function StakeProcessingOverlay(props: {
  assetName: string;
  action: "Stake" | "Unstake";
}): ReactElement {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const processingDescription = props.action === "Stake"
    ? t({
        en: "Wait for your wallet to show the confirmation window, then sign to complete the NFT lock.",
        es: "Espera a que tu wallet muestre la ventana de confirmacion y firma para completar el bloqueo del NFT.",
        pt: "Aguarde a wallet mostrar a janela de confirmacao e assine para concluir o bloqueio do NFT."
      })
    : t({
        en: "Wait for your wallet to show the confirmation window, then sign to complete the NFT unlock.",
        es: "Espera a que tu wallet muestre la ventana de confirmacion y firma para completar el desbloqueo del NFT.",
        pt: "Aguarde a wallet mostrar a janela de confirmacao e assine para concluir o desbloqueio do NFT."
      });

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-live="assertive"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/72 px-4 py-6 backdrop-blur-md"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="status"
      transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
    >
      <motion.div
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-cyan-300/25 bg-slate-950/90 p-6 text-center shadow-[0_28px_90px_rgba(8,47,73,0.5)]"
        initial={{ scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 10 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: "easeOut" }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10">
          <span
            aria-hidden="true"
            className={shouldReduceMotion
              ? "h-8 w-8 rounded-full border-2 border-cyan-200"
              : "h-8 w-8 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent"}
          />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
          {t({ en: "Processing on-chain action", es: "Procesando accion on-chain", pt: "Processando acao on-chain" })}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {props.action} {props.assetName}
        </h2>
        <p className="mt-3 text-sm text-white/70">
          {processingDescription}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function StakeModule(): ReactElement {
  const { t } = useI18n();
  const { connected, publicKey, signTransaction } = useWallet();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [remoteAssets, setRemoteAssets] = useState<StakeAssetResponse[]>([]);
  const [assetStateById, setAssetStateById] = useState<Record<string, LocalAssetState>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<StakeAssetResponse | null>(null);
  const [submittingAssetId, setSubmittingAssetId] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<"Stake" | "Unstake" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionErrorNotice, setActionErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLoading(true);
      setFetchError(null);

      try {
        const items = await fetchStakeAssets();

        if (!cancelled) {
          setRemoteAssets(items);
          setAssetStateById((current) => reconcileLocalAssetStatesWithRemoteAssets(current, items));
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error
              ? error.message
              : t({
                  en: "Could not load the stake inventory.",
                  es: "No se pudo cargar el inventario de stake.",
                  pt: "Nao foi possivel carregar o inventario de stake."
                })
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const effectiveAssets = useMemo(() => {
    return remoteAssets.map((asset) => {
      const local = assetStateById[asset.assetAddress];
      return {
        ...asset,
        effectiveState: local?.localState ?? asset.visibleState,
        localErrorMessage: local?.errorMessage ?? null
      };
    });
  }, [assetStateById, remoteAssets]);

  const selectedAction = useMemo(() => {
    if (!selectedAsset) {
      return null;
    }

    const local = assetStateById[selectedAsset.assetAddress];
    return actionLabel(local?.localState ?? selectedAsset.visibleState);
  }, [assetStateById, selectedAsset]);

  const processingAsset = useMemo(() => {
    if (!submittingAssetId) {
      return null;
    }

    return remoteAssets.find((asset) => asset.assetAddress === submittingAssetId) ?? null;
  }, [remoteAssets, submittingAssetId]);

  const hasSyncPendingAsset = useMemo(() => {
    return effectiveAssets.some((asset) => asset.effectiveState === "sync_pending");
  }, [effectiveAssets]);

  useEffect(() => {
    if (!hasSyncPendingAsset) {
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      if (Date.now() - startedAt > STAKE_SYNC_POLL_TIMEOUT_MS) {
        window.clearInterval(interval);
        return;
      }

      void fetchStakeAssets()
        .then((items) => {
          if (cancelled) {
            return;
          }

          setRemoteAssets(items);
          setAssetStateById((current) => reconcileLocalAssetStatesWithRemoteAssets(current, items));
        })
        .catch((error) => {
          console.warn(JSON.stringify({
            event: "Stake sync polling failed",
            errorMessage: error instanceof Error ? error.message : "Unknown stake sync polling error"
          }));
        });
    }, STAKE_SYNC_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [hasSyncPendingAsset]);

  async function reloadAssets(): Promise<void> {
    const items = await fetchStakeAssets();
    setRemoteAssets(items);
    setAssetStateById((current) => reconcileLocalAssetStatesWithRemoteAssets(current, items));
  }

  async function handleConfirm(asset: StakeAssetResponse, action: "Stake" | "Unstake"): Promise<void> {
    if (!connected || !publicKey || !signTransaction) {
      setAssetStateById((current) => ({
        ...current,
        [asset.assetAddress]: {
          localState: "action_error",
          errorMessage: t({
            en: "Connect the owner wallet before signing this action.",
            es: "Conecta la wallet owner antes de firmar esta accion.",
            pt: "Conecte a wallet owner antes de assinar esta acao."
          })
        }
      }));
      setSelectedAsset(null);
      return;
    }

    const optimisticState: LocalStakeState = action === "Stake" ? "pending_stake" : "pending_unstake";
    const expectedResolvedState: RemoteStakeState = action === "Stake" ? "ready_to_unstake" : "ready_to_stake";
    setSubmittingAssetId(asset.assetAddress);
    setSubmittingAction(action);
    setActionErrorNotice(null);
    setNotice(null);
    setAssetStateById((current) => ({
      ...current,
      [asset.assetAddress]: {
        localState: optimisticState,
        errorMessage: null,
        expectedResolvedState
      }
    }));

    try {
      const prepareResponse = await fetch("/api/protected/stake/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetAddress: asset.assetAddress,
          action: action === "Stake" ? "stake" : "unstake"
        })
      });
      const prepared = await parseResponse<PreparedStakePayload>(prepareResponse);

      if (!prepareResponse.ok || !prepared.data) {
        throw createStakeActionClientError(prepared, "Could not prepare stake action.");
      }

      const unsignedTransaction = deserializeLegacyVersionedTransaction(fromBase64(prepared.data.transactionBase64));
      const signedTransaction = await signTransaction(unsignedTransaction);

      const submitResponse = await fetch("/api/protected/stake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: prepared.data.attemptId,
          idempotencyKey: prepared.data.idempotencyKey,
          signedTransactionBase64: toBase64(serializeLegacyVersionedTransaction(signedTransaction))
        })
      });
      const submitted = await parseResponse<SubmittedStakePayload>(submitResponse);

      if (!submitResponse.ok || !submitted.data) {
        throw createStakeActionClientError(submitted, "Could not submit stake action.");
      }

      setAssetStateById((current) => ({
        ...current,
        [asset.assetAddress]: {
          localState: "sync_pending",
          errorMessage: null,
          expectedResolvedState
        }
      }));
      setNotice(
        t({
          en: `Transaction submitted for ${asset.displayName}. Profile sync is pending.`,
          es: `La transaccion fue enviada para ${asset.displayName}. La sincronizacion del perfil sigue pendiente.`,
          pt: `A transacao foi enviada para ${asset.displayName}. A sincronizacao do perfil ainda esta pendente.`
        })
      );
      setSelectedAsset(null);
      void reloadAssets().catch((reloadError) => {
        setFetchError(
          reloadError instanceof Error
            ? reloadError.message
            : t({
                en: "Could not refresh the stake inventory after submission.",
                es: "No se pudo refrescar el inventario de stake despues del envio.",
                pt: "Nao foi possivel atualizar o inventario de stake apos o envio."
              })
        );
      });
    } catch (error) {
      if (isRecoverableBlockhashError(error)) {
        setAssetStateById((current) => {
          const next = { ...current };
          delete next[asset.assetAddress];
          return next;
        });
        setActionErrorNotice(
          t({
            en: "The signing window expired before Solana accepted the transaction. Try again so your wallet can sign a fresh transaction.",
            es: "La ventana de firma expiro antes de que Solana aceptara la transaccion. Intenta de nuevo para que tu wallet firme una transaccion fresca.",
            pt: "A janela de assinatura expirou antes de Solana aceitar a transacao. Tente novamente para a wallet assinar uma transacao nova."
          })
        );
        setSelectedAsset(null);
        return;
      }

      const errorMessage = isWalletUserRejectedError(error)
        ? t({
            en: "Signature request canceled in wallet.",
            es: "Cancelaste la solicitud de firma en la wallet.",
            pt: "Voce cancelou a solicitacao de assinatura na wallet."
          })
        : error instanceof Error
          ? error.message
          : t({
              en: "Could not complete the stake action.",
              es: "No se pudo completar la accion de stake.",
              pt: "Nao foi possivel concluir a acao de stake."
            });

      setAssetStateById((current) => ({
        ...current,
        [asset.assetAddress]: {
          localState: "action_error",
          errorMessage
        }
      }));
      setSelectedAsset(null);
    } finally {
      setSubmittingAssetId(null);
      setSubmittingAction(null);
    }
  }

  return (
    <div className="relative w-full max-w-[calc(100vw-2rem)] min-w-0 overflow-x-clip lg:max-w-full space-y-4">
      <div
        aria-busy={Boolean(submittingAssetId)}
        className={submittingAssetId
          ? "pointer-events-none w-full max-w-full min-w-0 space-y-4 opacity-60 blur-[2px] transition duration-200"
          : "w-full max-w-full min-w-0 space-y-4 transition duration-200"}
      >
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Fractions eligible for Stake / Unstake", es: "Fracciones elegibles para Stake / Unstake", pt: "Frações elegiveis para Stake / Unstake" })}
        </h2>
        <p className="text-sm text-white/70">
          {t({
            en: "Only BRIDS NFTs currently owned by the connected wallet appear in this list.",
            es: "Solo los NFTs de BRIDS actualmente poseidos por la wallet conectada aparecen en esta lista.",
            pt: "Somente NFTs da BRIDS atualmente possuidos pela wallet conectada aparecem nesta lista."
          })}
        </p>
      </article>

      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5 border-amber-400/30 bg-amber-500/5">
        <p className="text-sm text-amber-100">
          {t({
            en: "Important note: staked assets remain transfer-restricted while they are frozen on-chain.",
            es: "Nota importante: los activos en stake mantienen restriccion de transferencia mientras siguen congelados on-chain.",
            pt: "Nota importante: ativos em stake mantem restricao de transferencia enquanto seguem congelados on-chain."
          })}
        </p>
      </article>

      {!connected || !publicKey || !signTransaction ? (
        <article className="marketplace-depth-card space-y-2 rounded-2xl p-5 border-cyan-400/30 bg-cyan-500/5">
          <p className="text-sm text-cyan-100">
            {t({
              en: "Connect the owner wallet to sign Stake / Unstake actions.",
              es: "Conecta la wallet owner para firmar acciones de Stake / Unstake.",
              pt: "Conecte a wallet owner para assinar acoes de Stake / Unstake."
            })}
          </p>
        </article>
      ) : null}

      {notice ? (
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5 border-emerald-400/30 bg-emerald-500/5">
          <p className="text-sm font-semibold text-emerald-200">
            {t({ en: "Action submitted", es: "Accion enviada", pt: "Acao enviada" })}
          </p>
          <p className="text-sm text-emerald-100">{notice}</p>
        </article>
      ) : null}

      {actionErrorNotice ? (
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm font-semibold text-amber-200">
            {t({ en: "Action needs retry", es: "La accion necesita reintento", pt: "A acao precisa de nova tentativa" })}
          </p>
          <p className="text-sm text-amber-100">{actionErrorNotice}</p>
        </article>
      ) : null}

      {fetchError ? (
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5 border-rose-400/30 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-200">
            {t({ en: "Load error", es: "Error de carga", pt: "Erro de carga" })}
          </p>
          <p className="text-sm text-rose-100">{fetchError}</p>
        </article>
      ) : null}

      {loading ? (
        <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
          <div className="h-5 w-56 animate-pulse rounded bg-white/10" />
          <div className="h-20 animate-pulse rounded bg-white/10" />
        </article>
      ) : null}

      {!loading && !fetchError && effectiveAssets.length === 0 ? (
        <article className="marketplace-depth-card space-y-2 rounded-2xl p-5 border-dashed">
          <h2 className="text-lg font-semibold text-white">
            {t({ en: "No eligible BRIDS NFTs", es: "No hay NFTs BRIDS elegibles", pt: "Nao ha NFTs BRIDS elegiveis" })}
          </h2>
          <p className="text-sm text-white/75">
            {t({
              en: "This surface only lists BRIDS NFTs currently owned by the connected wallet and validated from the server-side inventory.",
              es: "Esta superficie solo lista NFTs de BRIDS actualmente poseidos por la wallet conectada y validados desde el inventario server-side.",
              pt: "Esta superficie lista apenas NFTs da BRIDS atualmente possuidos pela wallet conectada e validados a partir do inventario server-side."
            })}
          </p>
        </article>
      ) : null}

      <div className="grid w-full max-w-full min-w-0 gap-3 md:grid-cols-2">
        {effectiveAssets.map((asset) => {
          const availableAction = actionLabel(asset.effectiveState);
          const busy = submittingAssetId === asset.assetAddress;
          const processing = busy || isProcessingStakeState(asset.effectiveState);

          return (
            <article key={asset.assetAddress} className="marketplace-depth-card w-full max-w-full min-w-0 space-y-3 overflow-hidden rounded-2xl p-4 sm:p-5">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-white">{asset.propertyTitle}</p>
                  <p className="break-words text-xs text-white/60">{asset.displayName}</p>
                  <p className="break-all font-mono text-xs text-white/50">{asset.assetAddress}</p>
                </div>
                <span className={`inline-flex w-fit max-w-full items-center gap-1.5 self-start whitespace-normal rounded-full px-2 py-1 text-left text-xs ${statusClassName(asset.effectiveState)}`}>
                  {processing ? <StakeInlineSpinner reduceMotion={shouldReduceMotion} /> : null}
                  {statusLabel(asset.effectiveState, t)}
                </span>
              </div>

              <p className="text-sm text-white/70">
                {reasonLabel(asset, asset.effectiveState, asset.localErrorMessage, t)}
              </p>

              {availableAction && !processing ? (
                <Button
                  className="min-h-11 w-full max-w-full"
                  disabled={busy}
                  variant={availableAction === "Stake" ? "primary" : "outline"}
                  onClick={() => setSelectedAsset(asset)}
                >
                  {availableAction}
                </Button>
              ) : processing ? (
                <Button className="min-h-11 w-full max-w-full gap-2" disabled variant="ghost">
                  <StakeInlineSpinner reduceMotion={shouldReduceMotion} />
                  {processingLabel(asset.effectiveState, t)}
                </Button>
              ) : (
                <Button className="min-h-11 w-full max-w-full" disabled variant="ghost">
                  {t({ en: "No action available", es: "Sin accion disponible", pt: "Sem acao disponivel" })}
                </Button>
              )}
            </article>
          );
        })}
      </div>

      {selectedAsset && selectedAction ? (
        <StakeConfirmModal
          action={selectedAction}
          asset={selectedAsset}
          busy={submittingAssetId === selectedAsset.assetAddress}
          onClose={() => setSelectedAsset(null)}
          onConfirm={() => void handleConfirm(selectedAsset, selectedAction)}
        />
      ) : null}

      </div>

      <AnimatePresence>
        {processingAsset && submittingAction ? (
          <StakeProcessingOverlay
            action={submittingAction}
            assetName={processingAsset.displayName}
            key={`${processingAsset.assetAddress}-${submittingAction}`}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
