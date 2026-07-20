import { describe, expect, it, beforeEach } from "vitest";

import {
  upsertProjectCandyMachineSource,
  getProjectCandyMachineSource,
  upsertAssetProjectOrigin,
  getAssetProjectOrigin,
  listValidatedOriginsByProject,
  updateProvenanceStatus
} from "@/lib/provenance/provenance-repository";

describe("lib/provenance/provenance-repository", () => {
  it("upserts and retrieves project candy machine sources in memory/DB mode", async () => {
    // Note: withDbClient will fallback or execute depending on DATABASE_URL
    if (!process.env.DATABASE_URL) {
      return; // DB unit test requires connection or mock
    }

    const pcm = await upsertProjectCandyMachineSource({
      projectId: "proj-test-1",
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "Coll111111111111111111111111111111111111111",
      authorizedSupply: 100
    });

    expect(pcm.projectId).toBe("proj-test-1");
    expect(pcm.candyMachineAddress).toBe("CM111111111111111111111111111111111111111");

    const fetched = await getProjectCandyMachineSource("proj-test-1");
    expect(fetched?.candyMachineAddress).toBe("CM111111111111111111111111111111111111111");
  });

  it("exports all expected provenance repository functions", () => {
    expect(typeof upsertProjectCandyMachineSource).toBe("function");
    expect(typeof getProjectCandyMachineSource).toBe("function");
    expect(typeof upsertAssetProjectOrigin).toBe("function");
    expect(typeof getAssetProjectOrigin).toBe("function");
    expect(typeof listValidatedOriginsByProject).toBe("function");
    expect(typeof updateProvenanceStatus).toBe("function");
  });
});
