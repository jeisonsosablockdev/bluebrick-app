import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetReferralPayoutServiceStateForTests,
  createReferralPayoutBatch,
  executeReferralPayout
} from "@/lib/referrals/payout-service";
import {
  __resetReferralRepositoryStateForTests,
  bindReferralAtFirstAuth,
  getOrCreateReferralCodeForWallet,
  markReferralAttributionKycApproved
} from "@/lib/referrals/repository";
import {
  __resetReferralRewardEngineStateForTests,
  recordReferralPurchaseSignal,
  setReferralRewardRule,
  settleMatureReferralRewardEvents
} from "@/lib/referrals/reward-engine";
import { getReferralDashboardSummary, listReferralDashboardInvitees } from "@/lib/referrals/dashboard-service";

describe("lib/referrals/dashboard-service", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    __resetReferralRepositoryStateForTests();
    __resetReferralRewardEngineStateForTests();
    __resetReferralPayoutServiceStateForTests();
  });

  it("builds pending/completed referral summary with milestone and reward totals", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeCompletedWallet = `invitee-complete-${randomUUID()}`;
    const inviteePendingWallet = `invitee-pending-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: inviteeCompletedWallet,
      referralCode: referralCode.code,
      attributionSource: "link"
    });
    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: inviteePendingWallet,
      referralCode: referralCode.code,
      attributionSource: "manual"
    });

    await markReferralAttributionKycApproved({ inviteeWalletPublicKey: inviteeCompletedWallet });
    await setReferralRewardRule({
      eligibleCollectionAddress: "COLLECTION-DASHBOARD",
      rewardAmountUsdc: 10,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });

    await recordReferralPurchaseSignal({
      inviteeWalletPublicKey: inviteeCompletedWallet,
      purchaseAttemptId: "dashboard-purchase-1",
      transactionSignature: "dashboard-sig-1",
      collectionAddress: "COLLECTION-DASHBOARD",
      nftMintAddress: "dashboard-mint-1",
      confirmedAt: "2026-05-01T00:00:00.000Z"
    });

    await settleMatureReferralRewardEvents({
      now: "2026-05-10T00:00:00.000Z",
      confirmHolding: async () => true
    });

    const payoutBatch = await createReferralPayoutBatch({
      referrerWalletPublicKey,
      approvedByActorId: "admin-001"
    });

    if (!payoutBatch) {
      throw new Error("Expected payout batch.");
    }

    await executeReferralPayout({
      payoutId: payoutBatch.payout.id,
      executedByActorId: "admin-ops-001",
      payoutTxSignature: "payout-sig-1"
    });

    const summary = await getReferralDashboardSummary({ referrerWalletPublicKey });

    expect(summary.referralCode).toBe(referralCode.code);
    expect(summary.sharePath).toBe(`/r/${referralCode.code}`);
    expect(summary.pendingInviteesCount).toBe(1);
    expect(summary.completedInviteesCount).toBe(1);
    expect(summary.notificationCount).toBe(1);
    expect(summary.totalAccruedUsdc).toBe(0);
    expect(summary.totalPendingDistributionUsdc).toBe(0);
    expect(summary.totalPaidUsdc).toBe(10);
    expect(summary.nextMilestone).toEqual({
      targetCount: 3,
      progressCount: 1,
      progressPercent: 33
    });
  });

  it("returns paginated invitees with privacy-safe wallet display and backend pagination metadata", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const firstInviteeWallet = `invitee-first-${randomUUID()}`;
    const secondInviteeWallet = `invitee-second-${randomUUID()}`;
    const thirdInviteeWallet = `invitee-third-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: firstInviteeWallet,
      referralCode: referralCode.code,
      attributionSource: "link",
      boundAt: "2026-05-01T00:00:00.000Z"
    });
    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: secondInviteeWallet,
      referralCode: referralCode.code,
      attributionSource: "manual",
      boundAt: "2026-05-02T00:00:00.000Z"
    });
    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: thirdInviteeWallet,
      referralCode: referralCode.code,
      attributionSource: "link",
      boundAt: "2026-05-03T00:00:00.000Z"
    });

    await markReferralAttributionKycApproved({ inviteeWalletPublicKey: secondInviteeWallet });
    await setReferralRewardRule({
      eligibleCollectionAddress: "COLLECTION-PAGE",
      rewardAmountUsdc: 10,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });
    await recordReferralPurchaseSignal({
      inviteeWalletPublicKey: secondInviteeWallet,
      purchaseAttemptId: "page-purchase-1",
      transactionSignature: "page-sig-1",
      collectionAddress: "COLLECTION-PAGE",
      nftMintAddress: "page-mint-1",
      confirmedAt: "2026-05-02T10:00:00.000Z"
    });
    await settleMatureReferralRewardEvents({
      now: "2026-05-11T00:00:00.000Z",
      confirmHolding: async () => true
    });

    const page = await listReferralDashboardInvitees({
      referrerWalletPublicKey,
      limit: 2,
      offset: 0
    });

    expect(page.totalCount).toBe(3);
    expect(page.limit).toBe(2);
    expect(page.offset).toBe(0);
    expect(page.hasMore).toBe(true);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]?.boundDay).toBe("2026-05-03");
    expect(page.items[0]?.inviteeWalletDisplay).toMatch(/^invi\.\.\..+/);
    expect(page.items[1]).toMatchObject({
      state: "completed",
      rewardStatus: "accrued",
      rewardAmountUsdc: 10
    });
  });
});
