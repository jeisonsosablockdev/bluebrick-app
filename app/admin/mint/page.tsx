import { notFound } from "next/navigation";

import { CoreCandyMachinePanel } from "@/components/admin/core-candy-machine-panel";
import { MintOrchestratorSigningPanel } from "@/components/admin/mint-orchestrator-signing-panel";
import { getMintStatusQuery, NftMintingPageClient } from "../../../apps/web/src/features/nft-minting";
import { Card } from "@/components/ui/card";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default async function AdminMintPage() {
  if (!isReleaseControlledRouteVisible("/admin/mint")) {
    notFound();
  }

  const locale = await getServerLocale();
  const config = await getMintStatusQuery("CMv3_BRIDS_Sunset_Miami_Devnet_Addr");

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{localize(locale, { en: "Mint Operations", es: "Operaciones de mint", pt: "Operacoes de mint" })}</p>
        <h2 className="text-lg font-semibold text-white">{localize(locale, { en: "Mint console (P0-06)", es: "Consola de mint (P0-06)", pt: "Console de mint (P0-06)" })}</h2>
        <p className="text-sm text-white/75">
          {localize(locale, {
            en: "Operational panel to prepare batches, sign, submit transactions and reconcile on-chain state.",
            es: "Panel operativo para preparar lotes, firmar, enviar transacciones y reconciliar estado on-chain.",
            pt: "Painel operacional para preparar lotes, assinar, enviar transacoes e reconciliar estado on-chain."
          })}
        </p>
      </Card>

      <NftMintingPageClient config={config} />
      <CoreCandyMachinePanel />
      <MintOrchestratorSigningPanel />
    </div>
  );
}
