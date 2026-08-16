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
  promotePendingQualificationRewardsForInvitee,
  recordReferralPurchaseSignal,
  setReferralRewardRule,
  settleMatureReferralRewardEvents
} from "@/features/referral-marketing/application/reward-engine";

describe("features/referral-marketing/application/reward-engine (in-memory)", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    __resetReferralRepositoryStateForTests();
    __resetReferralRewardEngineStateForTests();
  });

  it("creates pending_settlement reward events when purchase arrives after KYC", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: referralCode.code,
      attributionSource: "link",
      boundAt: "2026-05-01T00:00:00.000Z"
    });

    await markReferralAttributionKycApproved({
      inviteeWalletPublicKey,
      approvedAt: "2026-05-02T00:00:00.000Z"
    });

    const rule = await setReferralRewardRule({
      eligibleCollectionAddress: "COLLECTION-001",
      rewardAmountUsdc: 10,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });

    const result = await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-001",
      transactionSignature: "sig-001",
      collectionAddress: rule.eligibleCollectionAddress,
      nftMintAddress: "mint-001",
      confirmedAt: "2026-05-03T00:00:00.000Z"
    });

    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") {
      throw new Error("Expected a created reward event.");
    }

    expect(result.event.status).toBe("pending_settlement");
    expect(result.event.rewardAmountUsdc).toBe(10);
    expect(result.event.settlementEndsAt).toBe("2026-05-10T00:00:00.000Z");
  });

  it("deduplicates the same purchase attempt + NFT mint pair", async () => {
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
      eligibleCollectionAddress: "COLLECTION-002",
      rewardAmountUsdc: 10,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });

    const first = await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-dup",
      transactionSignature: "sig-dup",
      collectionAddress: "COLLECTION-002",
      nftMintAddress: "mint-dup"
    });

    const second = await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-dup",
      transactionSignature: "sig-dup",
      collectionAddress: "COLLECTION-002",
      nftMintAddress: "mint-dup"
    });

    expect(first.outcome).toBe("created");
    expect(second.outcome).toBe("duplicate");
    if (first.outcome !== "created" || second.outcome !== "duplicate") {
      throw new Error("Expected created followed by duplicate.");
    }

    expect(second.event.id).toBe(first.event.id);
  });

  it("keeps purchase signals in pending_qualification until KYC is approved", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: referralCode.code,
      attributionSource: "deep_link"
    });
    await setReferralRewardRule({
      eligibleCollectionAddress: "COLLECTION-003",
      rewardAmountUsdc: 10,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });

    const created = await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-pending",
      transactionSignature: "sig-pending",
      collectionAddress: "COLLECTION-003",
      nftMintAddress: "mint-pending"
    });

    expect(created.outcome).toBe("created");
    if (created.outcome !== "created") {
      throw new Error("Expected created reward event.");
    }

    expect(created.event.status).toBe("pending_qualification");

    await markReferralAttributionKycApproved({
      inviteeWalletPublicKey,
      approvedAt: "2026-05-05T00:00:00.000Z"
    });

    const promoted = await promotePendingQualificationRewardsForInvitee({
      inviteeWalletPublicKey
    });

    expect(promoted).toHaveLength(1);
    expect(promoted[0]?.status).toBe("pending_settlement");
  });

  it("settles mature reward events into accrued or rejected based on holding confirmation", async () => {
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
      eligibleCollectionAddress: "COLLECTION-004",
      rewardAmountUsdc: 10,
      settlementWindowDays: 7,
      holdingPeriodDays: 7,
      activeFrom: "2026-01-01T00:00:00.000Z"
    });

    const one = await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-accrued",
      transactionSignature: "sig-accrued",
      collectionAddress: "COLLECTION-004",
      nftMintAddress: "mint-accrued",
      confirmedAt: "2026-05-01T00:00:00.000Z"
    });
    const two = await recordReferralPurchaseSignal({
      inviteeWalletPublicKey,
      purchaseAttemptId: "purchase-rejected",
      transactionSignature: "sig-rejected",
      collectionAddress: "COLLECTION-004",
      nftMintAddress: "mint-rejected",
      confirmedAt: "2026-05-01T00:00:00.000Z"
    });

    expect(one.outcome).toBe("created");
    expect(two.outcome).toBe("created");

    const settled = await settleMatureReferralRewardEvents({
      now: "2026-05-10T00:00:00.000Z",
      confirmHolding: async (event) => event.nftMintAddress === "mint-accrued"
    });

    expect(settled).toHaveLength(2);
    expect(settled.find((event) => event.nftMintAddress === "mint-accrued")?.status).toBe("accrued");
    expect(settled.find((event) => event.nftMintAddress === "mint-rejected")?.status).toBe("rejected");
  });
});
