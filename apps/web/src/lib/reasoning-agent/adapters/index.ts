import { AdaptedModule, AdaptOutput } from "../types";

export type { AdaptedModule } from "../types";

export interface DomainAdapter {
  name: string;
  getAdaptationHints(): string;
  enhanceAdaptation?(modules: AdaptedModule[]): AdaptedModule[];
}

export function adaptWithDomain(output: AdaptOutput, adapter: DomainAdapter): AdaptOutput {
  if (adapter.enhanceAdaptation) {
    return {
      adaptedModules: adapter.enhanceAdaptation(output.adaptedModules),
    };
  }
  return output;
}

export const NULL_ADAPTER: DomainAdapter = {
  name: "null",
  getAdaptationHints: () => "",
};

let adapterCache: Record<string, DomainAdapter> | null = null;

export async function getAdapterByName(name: string): Promise<DomainAdapter> {
  if (!adapterCache) {
    const [{ SOLANA_ADAPTER }, { COLLECTIBLE_ADAPTER }, { COMPLIANCE_ADAPTER }] = await Promise.all([
      import("./solana-adapter"),
      import("./collectible-domain-adapter"),
      import("./compliance-adapter"),
    ]);
    adapterCache = {
      solana: SOLANA_ADAPTER,
      nft: COLLECTIBLE_ADAPTER,
      compliance: COMPLIANCE_ADAPTER,
    };
  }
  return adapterCache[name.toLowerCase()] ?? NULL_ADAPTER;
}

export function getAdapterSync(name: string): DomainAdapter {
  return NULL_ADAPTER;
}