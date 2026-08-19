import { describe, expect, it } from "vitest";

import {
  CORE_CANDY_MACHINE_LIMITS,
  buildConfigLinePrefixName,
  deriveCoreCandyMachineNames,
  utf8ByteLength
} from "@/features/nft-minting/domain/core-candy-machine-naming";

describe("features/nft-minting/domain/core-candy-machine-naming", () => {
  it("derives names within candy machine byte limits", () => {
    const derived = deriveCoreCandyMachineNames({
      collectionSource: "Proyecto Premium Torre Marina Fase Internacional",
      assetPrefixSource: "Fraccion de Inversion Torre Marina Etapa A",
      quantity: 950,
      startSerial: 1
    });

    const prefixName = buildConfigLinePrefixName(derived.assetNamePrefix);
    expect(utf8ByteLength(derived.collectionName)).toBeLessThanOrEqual(
      CORE_CANDY_MACHINE_LIMITS.maxCollectionNameBytes
    );
    expect(utf8ByteLength(prefixName) + derived.nameLength).toBeLessThanOrEqual(
      CORE_CANDY_MACHINE_LIMITS.maxConfigLineTotalNameBytes
    );
  });

  it("normalizes accents and unsupported chars in source names", () => {
    const derived = deriveCoreCandyMachineNames({
      collectionSource: "Ático #1 — Bogotá 💎",
      assetPrefixSource: "Fracción Única @@@",
      quantity: 12,
      startSerial: 1
    });

    expect(derived.collectionName).toBe("Atico 1 Bogota");
    expect(derived.assetNamePrefix).toBe("Fraccion Unica");
  });
});
