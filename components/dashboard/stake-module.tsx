"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StakeStatus = "eligible" | "frozen" | "ineligible" | "processing";

type StakeAsset = {
  id: string;
  property: string;
  fraction: string;
  currentState: "available" | "staked";
  status: StakeStatus;
  reason: string;
};

const STAKE_ASSETS: StakeAsset[] = [
  {
    id: "9fK3...2Hqa",
    property: "Torre Magnolia Medellin",
    fraction: "2.50%",
    currentState: "available",
    status: "eligible",
    reason: "Activo habilitado para stake inmediato."
  },
  {
    id: "3xPm...Q8tB",
    property: "Vista Mar Cartagena",
    fraction: "1.00%",
    currentState: "staked",
    status: "processing",
    reason: "Tu ultimo claim esta en confirmacion on-chain."
  },
  {
    id: "6Nh1...L5eV",
    property: "Parque Central Bogota",
    fraction: "0.75%",
    currentState: "available",
    status: "frozen",
    reason: "Bloqueado por validacion operativa del activo."
  },
  {
    id: "7sQ2...Y3rN",
    property: "Riviera Norte Barranquilla",
    fraction: "1.20%",
    currentState: "staked",
    status: "ineligible",
    reason: "Periodo minimo de lockup aun no cumplido."
  }
];

function statusLabel(status: StakeStatus): string {
  if (status === "eligible") {
    return "Elegible";
  }

  if (status === "frozen") {
    return "Congelado";
  }

  if (status === "processing") {
    return "En proceso";
  }

  return "No elegible";
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
  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Cerrar confirmacion" className="absolute inset-0 bg-black/70" onClick={onClose} type="button" />

      <section className="relative mx-auto mt-10 w-[92%] max-w-lg rounded-2xl border border-white/10 bg-[#070b14] p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Confirmar accion: {action}</h2>
        <p className="mt-2 text-sm text-white/75">
          Vas a ejecutar <span className="font-semibold text-white">{action}</span> sobre el NFT {asset.id} de{" "}
          <span className="font-semibold text-white">{asset.property}</span>.
        </p>

        <Card className="mt-4 space-y-2 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm text-amber-100">
            Advertencia UX: al hacer stake, el NFT quedara bloqueado para transferencias hasta su desbloqueo.
          </p>
          <p className="text-sm text-amber-100">
            La firma wallet se integrara en el siguiente paso; esta confirmacion prepara el flujo de accion.
          </p>
        </Card>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button className="min-h-11" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="min-h-11" variant="primary" onClick={onConfirm}>
            Confirmar {action}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function StakeModule(): ReactElement {
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
        <h2 className="text-lg font-semibold text-white">NFTs elegibles para Stake / Unstake</h2>
        <p className="text-sm text-white/70">
          Revisa el estado operativo de cada posicion antes de ejecutar una accion.
        </p>
      </Card>

      <Card className="space-y-2 border-amber-400/30 bg-amber-500/5">
        <p className="text-sm text-amber-100">
          Nota importante: los NFTs en stake mantienen restricciones de transferencia hasta finalizar su periodo de bloqueo.
        </p>
      </Card>

      {doneMessage && (
        <Card className="space-y-1 border-emerald-400/30 bg-emerald-500/5">
          <p className="text-sm font-semibold text-emerald-200">Accion preparada</p>
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
                  {statusLabel(asset.status)}
                </span>
              </div>

              <p className="text-sm text-white/70">{asset.reason}</p>

              {availableAction ? (
                <Button className="min-h-11 w-full" variant={availableAction === "Stake" ? "primary" : "outline"} onClick={() => setSelectedAsset(asset)}>
                  {availableAction}
                </Button>
              ) : (
                <Button className="min-h-11 w-full" disabled variant="ghost">
                  Sin accion disponible
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
            setDoneMessage(`Se preparo la accion ${action} para ${selectedAsset.id}. Pendiente integrar firma wallet.`);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}
