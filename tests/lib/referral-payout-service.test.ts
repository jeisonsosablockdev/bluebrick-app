import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetReferralRepositoryStateForTests,
  bindReferralAtFirstAuth,
  getOrCreateReferralCodeForWallet,
  markReferralAttributionKycApproved
} from "@/features/referral-marketing/infrastructure/referrals-repository";
import {
  __resetReferralRewardEngineStateForTests,
  listReferralRewardEventsForInvitee,
  recordReferralPurchaseSignal,
  setReferralRewardRule,
  settleMatureReferralRewardEvents
} from "@/features/referral-marketing/application/reward-engine";
import {
  __resetReferralPayoutServiceStateForTests,
  createReferralPayoutBatch,
  executeReferralPayout,
  listReferralPayoutsForReferrer
} from "@/features/referral-marketing/application/payout-service";

describe("features/referral-marketing/application/payout-service (in-memory)", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    __resetReferralRepositoryStateForTests();
    __resetReferralRewardEngineStateForTests();
    __resetReferralPayoutServiceStateForTests();
  });

  it("creates an approved payout batch from accrued rewards and moves events to pending_admin_distribution", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: referralCode.code,
      attributionSource: "link"
    });
    await markReferralAttributionKycApproved({ inviteeWalletPublicKey });
    await setReferralRewardRule({
      eligibleCollectionAddress: "COLLECTION-PAYOUT",
      rewardAmountUsdc: 10,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });

    await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-payout-1",
      transactionSignature: "sig-payout-1",
      collectionAddress: "COLLECTION-PAYOUT",
      nftMintAddress: "mint-payout-1",
      confirmedAt: "2026-05-01T00:00:00.000Z"
    });
    await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-payout-2",
      transactionSignature: "sig-payout-2",
      collectionAddress: "COLLECTION-PAYOUT",
      nftMintAddress: "mint-payout-2",
      confirmedAt: "2026-05-01T00:00:00.000Z"
    });

    await settleMatureReferralRewardEvents({
      now: "2026-05-10T00:00:00.000Z",
      confirmHolding: async () => true
    });

    const batch = await createReferralPayoutBatch({
      referrerWalletPublicKey,
      approvedByActorId: "admin-001",
      notes: "May referral payout"
    });

    expect(batch).not.toBeNull();
    if (!batch) {
      throw new Error("Expected payout batch.");
    }

    expect(batch.payout.status).toBe("approved");
    expect(batch.payout.totalAmountUsdc).toBe(20);
    expect(batch.itemCount).toBe(2);

    const rewardEvents = await listReferralRewardEventsForInvitee({
      inviteeWalletPublicKey
    });

    expect(rewardEvents.map((event) => event.status)).toEqual([
      "pending_admin_distribution",
      "pending_admin_distribution"
    ]);
  });

  it("executes an approved payout batch and marks linked rewards as paid", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: referralCode.code,
      attributionSource: "manual"
    });
    await markReferralAttributionKycApproved({ inviteeWalletPublicKey });
    await setReferralRewardRule({
      eligibleCollectionAddress: "COLLECTION-EXECUTE",
      rewardAmountUsdc: 10,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });

    await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-exec-1",
      transactionSignature: "sig-exec-1",
      collectionAddress: "COLLECTION-EXECUTE",
      nftMintAddress: "mint-exec-1",
      confirmedAt: "2026-05-01T00:00:00.000Z"
    });
    await settleMatureReferralRewardEvents({
      now: "2026-05-10T00:00:00.000Z",
      confirmHolding: async () => true
    });

    const batch = await createReferralPayoutBatch({
      referrerWalletPublicKey,
      approvedByActorId: "admin-002"
    });

    if (!batch) {
      throw new Error("Expected payout batch.");
    }

    const executed = await executeReferralPayout({
      payoutId: batch.payout.id,
      executedByActorId: "admin-ops-001",
      payoutTxSignature: "usdc-payout-sig-001"
    });

    expect(executed?.status).toBe("executed");
    expect(executed?.payoutTxSignature).toBe("usdc-payout-sig-001");

    const rewardEvents = await listReferralRewardEventsForInvitee({
      inviteeWalletPublicKey
    });
    expect(rewardEvents.map((event) => event.status)).toEqual(["paid"]);

    const payouts = await listReferralPayoutsForReferrer({
      referrerWalletPublicKey
    });
    expect(payouts).toHaveLength(1);
    expect(payouts[0]?.status).toBe("executed");
  });
});
