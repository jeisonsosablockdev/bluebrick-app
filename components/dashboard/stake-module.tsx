"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StakeStatus = "eligible" | "frozen" | "ineligible" | "processing";

type StakeAsset = {
  id: string;
  property: string;
  fraction: string;
  currentState: "available" | "staked";
  status: StakeStatus;
  reason: {
    en: string;
    es: string;
    pt: string;
  };
};

const STAKE_ASSETS: StakeAsset[] = [
  {
    id: "9fK3...2Hqa",
    property: "Torre Magnolia Medellin",
    fraction: "2.50%",
    currentState: "available",
    status: "eligible",
    reason: {
      en: "Asset is enabled for immediate stake.",
      es: "Activo habilitado para stake inmediato.",
      pt: "Ativo habilitado para stake imediato."
    }
  },
  {
    id: "3xPm...Q8tB",
    property: "Vista Mar Cartagena",
    fraction: "1.00%",
    currentState: "staked",
    status: "processing",
    reason: {
      en: "Your latest claim is in on-chain confirmation.",
      es: "Tu ultimo claim esta en confirmacion on-chain.",
      pt: "Seu ultimo claim esta em confirmacao on-chain."
    }
  },
  {
    id: "6Nh1...L5eV",
    property: "Parque Central Bogota",
    fraction: "0.75%",
    currentState: "available",
    status: "frozen",
    reason: {
      en: "Blocked due to operational asset validation.",
      es: "Bloqueado por validacion operativa del activo.",
      pt: "Bloqueado por validacao operacional do ativo."
    }
  },
  {
    id: "7sQ2...Y3rN",
    property: "Riviera Norte Barranquilla",
    fraction: "1.20%",
    currentState: "staked",
    status: "ineligible",
    reason: {
      en: "Minimum lockup period is not completed yet.",
      es: "Periodo minimo de lockup aun no cumplido.",
      pt: "Periodo minimo de lockup ainda nao cumprido."
    }
  }
];

function statusLabel(status: StakeStatus, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "eligible") {
    return t({ en: "Eligible", es: "Elegible", pt: "Elegivel" });
  }

  if (status === "frozen") {
    return t({ en: "Frozen", es: "Congelado", pt: "Congelado" });
  }

  if (status === "processing") {
    return t({ en: "Processing", es: "En proceso", pt: "Em processo" });
  }

  return t({ en: "Not eligible", es: "No elegible", pt: "Nao elegivel" });
}

function statusClassName(status: StakeStatus): string {
  if (status === "eligible") {
    return "bg-emerald-500/20 text-emerald-200";
  }

  if (status === "frozen") {
    return "bg-cyan-500/20 text-cyan-200";
  }

  if (status === "processing") {
    return "bg-indigo-500/20 text-indigo-200";
  }

  return "bg-rose-500/20 text-rose-200";
}

function actionLabel(asset: StakeAsset): "Stake" | "Unstake" | null {
  if (asset.status !== "eligible") {
    return null;
  }

  return asset.currentState === "staked" ? "Unstake" : "Stake";
}

function ConfirmActionModal({
  asset,
  action,
  onClose,
  onConfirm
}: {
  asset: StakeAsset;
  action: "Stake" | "Unstake";
  onClose: () => void;
  onConfirm: () => void;
}): ReactElement {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label={t({ en: "Close confirmation", es: "Cerrar confirmacion", pt: "Fechar confirmacao" })}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <section className="glass-modal-surface relative mx-auto mt-10 w-[92%] max-w-lg rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Confirm action", es: "Confirmar accion", pt: "Confirmar acao" })}: {action}
        </h2>
        <p className="mt-2 text-sm text-white/75">
          {t({ en: "You are about to execute", es: "Vas a ejecutar", pt: "Voce vai executar" })}{" "}
          <span className="font-semibold text-white">{action}</span>{" "}
          {t({ en: "on Fraction", es: "sobre el Fracción", pt: "no Fração" })} {asset.id} {t({ en: "from", es: "de", pt: "de" })}{" "}
          <span className="font-semibold text-white">{asset.property}</span>.
        </p>

        <Card className="mt-4 space-y-2 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm text-amber-100">
            {t({
              en: "UX warning: when staking, Fraction transfers stay blocked until unlock.",
              es: "Advertencia UX: al hacer stake, el Fracción quedara bloqueado para transferencias hasta su desbloqueo.",
              pt: "Aviso UX: ao fazer stake, o Fração ficara bloqueado para transferencias ate o desbloqueio."
            })}
          </p>
          <p className="text-sm text-amber-100">
            {t({
              en: "Wallet signature will be integrated in the next step; this confirmation prepares the action flow.",
              es: "La firma wallet se integrara en el siguiente paso; esta confirmacion prepara el flujo de accion.",
              pt: "A assinatura da wallet sera integrada no proximo passo; esta confirmacao prepara o fluxo da acao."
            })}
          </p>
        </Card>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button className="min-h-11" variant="ghost" onClick={onClose}>
            {t({ en: "Cancel", es: "Cancelar", pt: "Cancelar" })}
          </Button>
          <Button className="min-h-11" variant="primary" onClick={onConfirm}>
            {t({ en: "Confirm", es: "Confirmar", pt: "Confirmar" })} {action}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function StakeModule(): ReactElement {
  const { t } = useI18n();
  const [selectedAsset, setSelectedAsset] = useState<StakeAsset | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const action = useMemo<"Stake" | "Unstake" | null>(() => {
    if (!selectedAsset) {
      return null;
    }

    const label = actionLabel(selectedAsset);
    return label === null ? null : label;
  }, [selectedAsset]);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Fractions eligible for Stake / Unstake", es: "Fracciones elegibles para Stake / Unstake", pt: "Frações elegiveis para Stake / Unstake" })}
        </h2>
        <p className="text-sm text-white/70">
          {t({
            en: "Review the operational status of each position before executing an action.",
            es: "Revisa el estado operativo de cada posicion antes de ejecutar una accion.",
            pt: "Revise o status operacional de cada posicao antes de executar uma acao."
          })}
        </p>
      </Card>

      <Card className="space-y-2 border-amber-400/30 bg-amber-500/5">
        <p className="text-sm text-amber-100">
          {t({
            en: "Important note: staked Fractions keep transfer restrictions until lock period ends.",
            es: "Nota importante: los Fracciones en stake mantienen restricciones de transferencia hasta finalizar su periodo de bloqueo.",
            pt: "Nota importante: Frações em stake mantem restricoes de transferencia ate o fim do periodo de bloqueio."
          })}
        </p>
      </Card>

      {doneMessage && (
        <Card className="space-y-1 border-emerald-400/30 bg-emerald-500/5">
          <p className="text-sm font-semibold text-emerald-200">
            {t({ en: "Action prepared", es: "Accion preparada", pt: "Acao preparada" })}
          </p>
          <p className="text-sm text-emerald-100">{doneMessage}</p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {STAKE_ASSETS.map((asset) => {
          const availableAction = actionLabel(asset);
          return (
            <Card key={asset.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{asset.property}</p>
                  <p className="text-xs text-white/60">
                    {asset.id} · {asset.fraction}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${statusClassName(asset.status)}`}>
                  {statusLabel(asset.status, t)}
                </span>
              </div>

              <p className="text-sm text-white/70">{t(asset.reason)}</p>

              {availableAction ? (
                <Button className="min-h-11 w-full" variant={availableAction === "Stake" ? "primary" : "outline"} onClick={() => setSelectedAsset(asset)}>
                  {availableAction}
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

      {selectedAsset && action && (
        <ConfirmActionModal
          action={action}
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onConfirm={() => {
            setDoneMessage(
              t({
                en: `Action ${action} prepared for ${selectedAsset.id}. Wallet signature integration pending.`,
                es: `Se preparo la accion ${action} para ${selectedAsset.id}. Pendiente integrar firma wallet.`,
                pt: `A acao ${action} foi preparada para ${selectedAsset.id}. Integracao da assinatura wallet pendente.`
              })
            );
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}
