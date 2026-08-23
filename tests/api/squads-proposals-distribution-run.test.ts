/**
 * @vitest-environment node
 * =========================================================================================
 * Test Suite: Squads Proposals Route — Distribution Run Integration (Layer 2 — API Test)
 * Feature: BRI-8 / SPEC-13 (Distribution Run Squads Proposal Resolver)
 *
 * Description:
 * Verifies that GET /api/admin/treasury/squads/proposals correctly resolves distribution runs
 * (when accessed via ?runId=<distributionRunId>), mapping the run and items into a valid
 * SquadsProposalDTO for presentation in the Squads Multisig Console.
 * =========================================================================================
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "../../apps/web/src/app/api/admin/treasury/squads/proposals/route";
import { createDistributionDraft, replaceDistributionItems } from "../../apps/web/src/features/staking-distribution/infrastructure/distribution-repository";

vi.mock("@/lib/solana-kit/compat/squads-v4-client", () => ({
  fetchSquadsNativeProposals: vi.fn(async () => [
    {
      proposalPda: "CNrV6YyCpz4KcczFwGmjQ7NqKujm1CiVpxJS1KdhYvZ4",
      transactionIndex: "1",
      creator: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
      threshold: 2,
      approved: ["3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd"],
      totalMembers: 4,
      status: "Active",
      title: "Actualización de fechas del proyecto inmobiliario",
      isExecuted: false
    }
  ]),
  fetchSquadsMultisigState: vi.fn(async () => ({
    multisigPda: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
    programId: "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf",
    threshold: 2,
    membersCount: 4,
    transactionIndex: 1n,
    staleTransactionIndex: 0n,
    members: []
  })),
  SQUADS_DEVNET_MULTISIG_PDA: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
  SQUADS_DEVNET_VAULT_PDA: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB"
}));

describe("GET /api/admin/treasury/squads/proposals (Distribution Run Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a distribution run by ID and formats it as a valid SquadsProposalDTO", async () => {
    // Step 1: Create a draft distribution run record
    const draftRun = await createDistributionDraft({
      periodKey: "2026-07",
      collectionAddress: "EhN6smWN3kRLVSyT7y7jTBQZYRhtBmo9QWsJx9bSis43",
      propertyId: "fix-flip-brandon-117-666",
      periodStartAt: "2026-07-01T00:00:00.000Z",
      periodEndAt: "2026-07-31T23:59:59.000Z",
      policyVersion: "v1.0",
      tokenMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      totalAmountMinor: 10000000000n,
      createdByActorId: "admin_user_1"
    });

    // Step 2: Request proposal with ?runId=<draftRun.id>
    const req = new NextRequest(`https://brids.test/api/admin/treasury/squads/proposals?runId=${draftRun.id}`);
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.runId).toBe(draftRun.id);
    expect(json.data.treasuryPolicyPda).toBe("EhN6smWN3kRLVSyT7y7jTBQZYRhtBmo9QWsJx9bSis43");
    expect(json.data.vaultPda).toBe("D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB");
    expect(json.data.dbDates.projectStartAt).toBe("2026-07-01T00:00:00.000Z");
    expect(json.data.dbDates.projectEndAt).toBe("2026-07-31T23:59:59.000Z");
    expect(json.data.feeUsdc).toBe("10000.00");
  });
});
