import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetReferralRepositoryStateForTests,
  bindReferralAtFirstAuth,
  expireEligibleReferralAttributions,
  getActiveReferralAttributionByInviteeWallet,
  getActiveReferralIntentForAccount,
  getOrCreateReferralCodeForWallet,
  markReferralAttributionKycApproved,
  promoteReferralIntentForAccountWallet,
  upsertReferralIntentForAccount
} from "@/lib/referrals/repository";

describe("lib/referrals/repository (in-memory)", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    __resetReferralRepositoryStateForTests();
  });

  it("issues one opaque referral code per referrer wallet", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;

    const first = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });
    const second = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    expect(first.referrerWalletPublicKey).toBe(referrerWalletPublicKey);
    expect(first.code).toMatch(/^[A-Z0-9]{8,64}$/);
    expect(second.id).toBe(first.id);
    expect(second.code).toBe(first.code);
  });

  it("binds a valid referral code to the invitee wallet on first auth", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    const result = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: referralCode.code,
      attributionSource: "link",
      boundAt: "2026-05-03T12:00:00.000Z",
      metadata: {
        campaign: "epic-012"
      }
    });

    expect(result.outcome).toBe("bound");
    if (result.outcome !== "bound") {
      throw new Error("Expected bound attribution.");
    }

    expect(result.attribution.referrerWalletPublicKey).toBe(referrerWalletPublicKey);
    expect(result.attribution.inviteeWalletPublicKey).toBe(inviteeWalletPublicKey);
    expect(result.attribution.status).toBe("bound_pending_kyc");
    expect(result.attribution.eligibilityWindowEndsAt).toBe("2026-06-02T12:00:00.000Z");
    expect(result.attribution.metadata.campaign).toBe("epic-012");

    const active = await getActiveReferralAttributionByInviteeWallet({ inviteeWalletPublicKey });
    expect(active?.id).toBe(result.attribution.id);
  });

  it("rejects invalid codes and self-referrals without creating an active attribution", async () => {
    const sameWalletPublicKey = `wallet-${randomUUID()}`;
    const selfReferralCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: sameWalletPublicKey
    });

    const invalidCodeResult = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: `invitee-${randomUUID()}`,
      referralCode: "INVALID01",
      attributionSource: "manual"
    });

    expect(invalidCodeResult.outcome).toBe("rejected_invalid_code");

    const selfReferralResult = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey: sameWalletPublicKey,
      referralCode: selfReferralCode.code,
      attributionSource: "manual"
    });

    expect(selfReferralResult.outcome).toBe("rejected_self_referral");

    const active = await getActiveReferralAttributionByInviteeWallet({
      inviteeWalletPublicKey: sameWalletPublicKey
    });
    expect(active).toBeNull();
  });

  it("treats repeated binding for the same active invitee wallet as already bound", async () => {
    const firstReferrerWalletPublicKey = `referrer-a-${randomUUID()}`;
    const secondReferrerWalletPublicKey = `referrer-b-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const firstCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: firstReferrerWalletPublicKey
    });
    const secondCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: secondReferrerWalletPublicKey
    });

    const first = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: firstCode.code,
      attributionSource: "link"
    });

    expect(first.outcome).toBe("bound");

    const second = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: secondCode.code,
      attributionSource: "manual"
    });

    expect(second.outcome).toBe("already_bound");
    if (second.outcome !== "already_bound") {
      throw new Error("Expected already_bound outcome.");
    }

    expect(second.attribution.referrerWalletPublicKey).toBe(firstReferrerWalletPublicKey);
  });

  it("stores only one active referral intent per account and updates it on replacement", async () => {
    const accountId = `account-${randomUUID()}`;
    const firstReferralCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: `referrer-a-${randomUUID()}`
    });
    const secondReferralCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: `referrer-b-${randomUUID()}`
    });

    const first = await upsertReferralIntentForAccount({
      accountId,
      referralCode: ` ${firstReferralCode.code} `,
      attributionSource: "link",
      capturedAt: "2026-05-09T10:00:00.000Z",
      metadata: { step: "first" }
    });

    expect(first.outcome).toBe("stored");
    if (first.outcome !== "stored") {
      throw new Error("Expected stored referral intent.");
    }

    const second = await upsertReferralIntentForAccount({
      accountId,
      referralCode: secondReferralCode.code,
      attributionSource: "manual",
      capturedAt: "2026-05-09T11:00:00.000Z",
      metadata: { step: "second" }
    });

    expect(second.outcome).toBe("stored");
    if (second.outcome !== "stored") {
      throw new Error("Expected stored referral intent.");
    }

    expect(second.intent.id).toBe(first.intent.id);
    expect(second.intent.referralCode).toBe(secondReferralCode.code);
    expect(second.intent.attributionSource).toBe("manual");
    expect(second.intent.capturedAt).toBe("2026-05-09T11:00:00.000Z");
    expect(second.intent.metadata.step).toBe("second");

    const active = await getActiveReferralIntentForAccount({ accountId });
    expect(active?.id).toBe(first.intent.id);
    expect(active?.referralCode).toBe(secondReferralCode.code);
  });

  it("rejects provisional intents that point to unknown referral codes", async () => {
    const result = await upsertReferralIntentForAccount({
      accountId: `account-${randomUUID()}`,
      referralCode: "UNKNOWN123",
      attributionSource: "manual"
    });

    expect(result.outcome).toBe("rejected_invalid_code");
  });

  it("promotes an active referral intent into a wallet-bound attribution once", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const accountId = `account-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    await upsertReferralIntentForAccount({
      accountId,
      referralCode: referralCode.code,
      attributionSource: "deep_link",
      capturedAt: "2026-05-09T10:00:00.000Z",
      metadata: { campaign: "spring" }
    });

    const promoted = await promoteReferralIntentForAccountWallet({
      accountId,
      walletPublicKey: inviteeWalletPublicKey,
      promotedAt: "2026-05-09T12:00:00.000Z"
    });

    expect(promoted.outcome).toBe("promoted");
    if (promoted.outcome !== "promoted") {
      throw new Error("Expected promoted referral intent.");
    }

    expect(promoted.intent.status).toBe("promoted");
    expect(promoted.intent.resolvedAt).toBe("2026-05-09T12:00:00.000Z");
    expect(promoted.intent.promotedAttributionId).toBe(promoted.attribution.id);
    expect(promoted.attribution.inviteeWalletPublicKey).toBe(inviteeWalletPublicKey);
    expect(promoted.attribution.metadata.campaign).toBe("spring");

    const activeIntent = await getActiveReferralIntentForAccount({ accountId });
    expect(activeIntent).toBeNull();

    const activeAttribution = await getActiveReferralAttributionByInviteeWallet({
      inviteeWalletPublicKey
    });
    expect(activeAttribution?.id).toBe(promoted.attribution.id);
  });

  it("discards a referral intent instead of duplicating when the wallet already has an attribution", async () => {
    const firstReferrerWalletPublicKey = `referrer-a-${randomUUID()}`;
    const secondReferrerWalletPublicKey = `referrer-b-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const accountId = `account-${randomUUID()}`;
    const firstCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: firstReferrerWalletPublicKey
    });
    const secondCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: secondReferrerWalletPublicKey
    });

    const bound = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: firstCode.code,
      attributionSource: "link"
    });

    expect(bound.outcome).toBe("bound");

    await upsertReferralIntentForAccount({
      accountId,
      referralCode: secondCode.code,
      attributionSource: "manual",
      metadata: { source: "federated" }
    });

    const promoted = await promoteReferralIntentForAccountWallet({
      accountId,
      walletPublicKey: inviteeWalletPublicKey,
      promotedAt: "2026-05-09T12:30:00.000Z"
    });

    expect(promoted.outcome).toBe("discarded_wallet_already_attributed");
    if (promoted.outcome !== "discarded_wallet_already_attributed") {
      throw new Error("Expected discarded_wallet_already_attributed outcome.");
    }

    expect(promoted.intent.status).toBe("discarded_wallet_already_attributed");
    expect(promoted.attribution.referrerWalletPublicKey).toBe(firstReferrerWalletPublicKey);

    const activeIntent = await getActiveReferralIntentForAccount({ accountId });
    expect(activeIntent).toBeNull();
  });

  it("promotes active attributions after KYC and expires stale unqualified ones", async () => {
    const referrerWalletPublicKey = `referrer-${randomUUID()}`;
    const inviteeWalletPublicKey = `invitee-${randomUUID()}`;
    const referralCode = await getOrCreateReferralCodeForWallet({ referrerWalletPublicKey });

    const bound = await bindReferralAtFirstAuth({
      inviteeWalletPublicKey,
      referralCode: referralCode.code,
      attributionSource: "deep_link",
      boundAt: "2026-05-01T00:00:00.000Z"
    });

    expect(bound.outcome).toBe("bound");

    const kycVerified = await markReferralAttributionKycApproved({
      inviteeWalletPublicKey,
      approvedAt: "2026-05-05T00:00:00.000Z"
    });

    expect(kycVerified?.status).toBe("kyc_verified");
    expect(kycVerified?.kycApprovedAt).toBe("2026-05-05T00:00:00.000Z");

    const expired = await expireEligibleReferralAttributions({
      now: "2026-06-05T00:00:00.000Z"
    });

    expect(expired).toHaveLength(1);
    expect(expired[0]?.status).toBe("expired_no_qualification");
    expect(expired[0]?.closedAt).toBe("2026-06-05T00:00:00.000Z");

    const released = await getActiveReferralAttributionByInviteeWallet({ inviteeWalletPublicKey });
    expect(released).toBeNull();
  });
});
