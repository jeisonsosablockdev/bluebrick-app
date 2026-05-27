"use client";

import { useWallet } from "@solana/wallet-adapter-react";
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
    message?: string;
  };
};

type SubmittedStakePayload = {
  ok?: boolean;
  data?: {
    attemptId: string;
    txSignature: string;
  };
  error?: {
    message?: string;
  };
};

type LocalAssetState = {
  localState: LocalStakeState;
  errorMessage?: string | null;
};

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
        <p className="mt-2 text-xs text-white/60">{props.asset.assetAddress}</p>

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

export function StakeModule(): ReactElement {
  const { t } = useI18n();
  const { connected, publicKey, signTransaction } = useWallet();
  const [remoteAssets, setRemoteAssets] = useState<StakeAssetResponse[]>([]);
  const [assetStateById, setAssetStateById] = useState<Record<string, LocalAssetState>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<StakeAssetResponse | null>(null);
  const [submittingAssetId, setSubmittingAssetId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      setLoading(true);
      setFetchError(null);

      try {
        const response = await fetch("/api/protected/stake/assets", {
          method: "GET",
          cache: "no-store"
        });
        const payload = await parseResponse<StakeAssetsPayload>(response);

        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message ?? "Could not load stake assets.");
        }

        if (!cancelled) {
          setRemoteAssets(payload.data.items);
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

  async function reloadAssets(): Promise<void> {
    const response = await fetch("/api/protected/stake/assets", {
      method: "GET",
      cache: "no-store"
    });
    const payload = await parseResponse<StakeAssetsPayload>(response);

    if (!response.ok || !payload.data) {
      throw new Error(payload.error?.message ?? "Could not reload stake assets.");
    }

    setRemoteAssets(payload.data.items);
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
    setSubmittingAssetId(asset.assetAddress);
    setAssetStateById((current) => ({
      ...current,
      [asset.assetAddress]: {
        localState: optimisticState,
        errorMessage: null
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
        throw new Error(prepared.error?.message ?? "Could not prepare stake action.");
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
        throw new Error(submitted.error?.message ?? "Could not submit stake action.");
      }

      setAssetStateById((current) => ({
        ...current,
        [asset.assetAddress]: {
          localState: "sync_pending",
          errorMessage: null
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
      await reloadAssets();
    } catch (error) {
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
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
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
      </Card>

      <Card className="space-y-2 border-amber-400/30 bg-amber-500/5">
        <p className="text-sm text-amber-100">
          {t({
            en: "Important note: staked assets remain transfer-restricted while they are frozen on-chain.",
            es: "Nota importante: los activos en stake mantienen restriccion de transferencia mientras siguen congelados on-chain.",
            pt: "Nota importante: ativos em stake mantem restricao de transferencia enquanto seguem congelados on-chain."
          })}
        </p>
      </Card>

      {!connected || !publicKey || !signTransaction ? (
        <Card className="space-y-2 border-cyan-400/30 bg-cyan-500/5">
          <p className="text-sm text-cyan-100">
            {t({
              en: "Connect the owner wallet to sign Stake / Unstake actions.",
              es: "Conecta la wallet owner para firmar acciones de Stake / Unstake.",
              pt: "Conecte a wallet owner para assinar acoes de Stake / Unstake."
            })}
          </p>
        </Card>
      ) : null}

      {notice ? (
        <Card className="space-y-1 border-emerald-400/30 bg-emerald-500/5">
          <p className="text-sm font-semibold text-emerald-200">
            {t({ en: "Action submitted", es: "Accion enviada", pt: "Acao enviada" })}
          </p>
          <p className="text-sm text-emerald-100">{notice}</p>
        </Card>
      ) : null}

      {fetchError ? (
        <Card className="space-y-1 border-rose-400/30 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-200">
            {t({ en: "Load error", es: "Error de carga", pt: "Erro de carga" })}
          </p>
          <p className="text-sm text-rose-100">{fetchError}</p>
        </Card>
      ) : null}

      {loading ? (
        <Card className="space-y-2">
          <div className="h-5 w-56 animate-pulse rounded bg-white/10" />
          <div className="h-20 animate-pulse rounded bg-white/10" />
        </Card>
      ) : null}

      {!loading && !fetchError && effectiveAssets.length === 0 ? (
        <Card className="space-y-2 border-dashed">
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
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {effectiveAssets.map((asset) => {
          const availableAction = actionLabel(asset.effectiveState);
          const busy = submittingAssetId === asset.assetAddress;

          return (
            <Card key={asset.assetAddress} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{asset.propertyTitle}</p>
                  <p className="text-xs text-white/60">{asset.displayName}</p>
                  <p className="text-xs text-white/50">{asset.assetAddress}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(asset.effectiveState)}`}>
                  {statusLabel(asset.effectiveState, t)}
                </span>
              </div>

              <p className="text-sm text-white/70">
                {reasonLabel(asset, asset.effectiveState, asset.localErrorMessage, t)}
              </p>

              {availableAction ? (
                <Button
                  className="min-h-11 w-full"
                  disabled={busy}
                  variant={availableAction === "Stake" ? "primary" : "outline"}
                  onClick={() => setSelectedAsset(asset)}
                >
                  {busy
                    ? t({ en: "Processing...", es: "Procesando...", pt: "Processando..." })
                    : availableAction}
                </Button>
              ) : (
                <Button className="min-h-11 w-full" disabled variant="ghost">
                  {t({ en: "No action available", es: "Sin accion disponible", pt: "Sem acao disponivel" })}
                </Button>
              )}
            </Card>
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
  );
}
