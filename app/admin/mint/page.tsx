import { MetaplexCoreMintPanel } from "@/components/admin/metaplex-core-mint-panel";
import { MintOrchestratorSigningPanel } from "@/components/admin/mint-orchestrator-signing-panel";
import { Card } from "@/components/ui/card";

export default function AdminMintPage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Mint Operations</p>
        <h2 className="text-lg font-semibold text-white">Consola de mint (P0-06)</h2>
        <p className="text-sm text-white/75">
          Panel operativo para preparar lotes, firmar, enviar transacciones y reconciliar estado on-chain.
        </p>
      </Card>

      <MintOrchestratorSigningPanel />
      <MetaplexCoreMintPanel />
    </div>
  );
}
