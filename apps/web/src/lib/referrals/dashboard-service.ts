import {
  getOrCreateReferralCodeForWallet,
  listReferralAttributionsForReferrer,
  listReferralAttributionsPageForReferrer,
  type ReferralAttributionRecord
} from "@/lib/referrals/repository";
import { listReferralRewardEventsByAttributionIds, type ReferralRewardEventRecord } from "@/lib/referrals/reward-engine";

export type ReferralDashboardInviteeState = "pending" | "completed";

export type ReferralDashboardInviteeRecord = {
  inviteeWalletDisplay: string;
  state: ReferralDashboardInviteeState;
  attributionStatus: string;
  rewardStatus: string | null;
  rewardAmountUsdc: number;
  boundDay: string;
  qualifiedDay: string | null;
};

export type ReferralMilestoneRecord = {
  targetCount: number;
  progressCount: number;
  progressPercent: number;
};

export type ReferralDashboardSummary = {
  referralCode: string;
  sharePath: string;
  pendingInviteesCount: number;
  completedInviteesCount: number;
  notificationCount: number;
  totalAccruedUsdc: number;
  totalPendingDistributionUsdc: number;
  totalPaidUsdc: number;
  nextMilestone: ReferralMilestoneRecord;
};

export type ReferralDashboardInviteePage = {
  items: ReferralDashboardInviteeRecord[];
  totalCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

const COMPLETED_REWARD_STATUSES = new Set(["accrued", "pending_admin_distribution", "paid"]);
const REWARD_STATUS_PRIORITY = new Map<string, number>([
  ["paid", 5],
  ["pending_admin_distribution", 4],
  ["accrued", 3],
  ["pending_settlement", 2],
  ["pending_qualification", 1],
  ["risk_hold", 0],
  ["rejected", 0],
  ["clawbacked", 0]
]);
const REFERRAL_MILESTONES = [1, 3, 5, 10];

function truncateWalletPublicKey(walletPublicKey: string): string {
  return `${walletPublicKey.slice(0, 4)}...${walletPublicKey.slice(-4)}`;
}

function truncateIsoToDay(value: string): string {
  return value.slice(0, 10);
}

function selectInviteeRewardStatus(events: ReferralRewardEventRecord[]): string | null {
  if (events.length === 0) {
    return null;
  }

  return [...events]
    .sort((left, right) => {
      const leftPriority = REWARD_STATUS_PRIORITY.get(left.status) ?? 0;
      const rightPriority = REWARD_STATUS_PRIORITY.get(right.status) ?? 0;
      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }

      return right.qualifiedAt.localeCompare(left.qualifiedAt);
    })[0]?.status ?? null;
}

function buildRewardEventsByAttributionId(
  rewardEvents: ReferralRewardEventRecord[]
): Map<string, ReferralRewardEventRecord[]> {
  const rewardEventsByAttributionId = new Map<string, ReferralRewardEventRecord[]>();

  for (const event of rewardEvents) {
    const current = rewardEventsByAttributionId.get(event.attributionId) ?? [];
    rewardEventsByAttributionId.set(event.attributionId, [...current, event]);
  }

  return rewardEventsByAttributionId;
}

function buildInviteeRecord(
  attribution: ReferralAttributionRecord,
  rewardEventsByAttributionId: Map<string, ReferralRewardEventRecord[]>
): ReferralDashboardInviteeRecord {
  const events = rewardEventsByAttributionId.get(attribution.id) ?? [];
  const rewardStatus = selectInviteeRewardStatus(events);
  const rewardAmountUsdc = events.reduce((sum, event) => sum + event.rewardAmountUsdc, 0);
  const latestQualifiedDay =
    events.length > 0
      ? truncateIsoToDay([...events].sort((left, right) => right.qualifiedAt.localeCompare(left.qualifiedAt))[0]!.qualifiedAt)
      : null;
  const state: ReferralDashboardInviteeState =
    rewardStatus && COMPLETED_REWARD_STATUSES.has(rewardStatus) ? "completed" : "pending";

  return {
    inviteeWalletDisplay: truncateWalletPublicKey(attribution.inviteeWalletPublicKey),
    state,
    attributionStatus: attribution.status,
    rewardStatus,
    rewardAmountUsdc,
    boundDay: truncateIsoToDay(attribution.boundAt),
    qualifiedDay: latestQualifiedDay
  };
}

function buildMilestone(completedCount: number): ReferralMilestoneRecord {
  const targetCount = REFERRAL_MILESTONES.find((target) => completedCount < target) ?? REFERRAL_MILESTONES.at(-1) ?? 10;
  const progressCount = Math.min(completedCount, targetCount);
  const progressPercent = targetCount <= 0 ? 100 : Math.min(100, Math.round((progressCount / targetCount) * 100));

  return {
    targetCount,
    progressCount,
    progressPercent
  };
}

export async function getReferralDashboardSummary(input: {
  referrerWalletPublicKey: string;
}): Promise<ReferralDashboardSummary> {
  const referralCode = await getOrCreateReferralCodeForWallet({
    referrerWalletPublicKey: input.referrerWalletPublicKey
  });
  const attributions = await listReferralAttributionsForReferrer({
    referrerWalletPublicKey: input.referrerWalletPublicKey
  });
  const rewardEvents = await listReferralRewardEventsByAttributionIds({
    attributionIds: attributions.map((attribution) => attribution.id)
  });
  const rewardEventsByAttributionId = buildRewardEventsByAttributionId(rewardEvents);
  const invitees = attributions.map((attribution) => buildInviteeRecord(attribution, rewardEventsByAttributionId));

  const pendingInviteesCount = invitees.filter((invitee) => invitee.state === "pending").length;
  const completedInviteesCount = invitees.filter((invitee) => invitee.state === "completed").length;

  return {
    referralCode: referralCode.code,
    sharePath: `/r/${referralCode.code}`,
    pendingInviteesCount,
    completedInviteesCount,
    notificationCount: completedInviteesCount,
    totalAccruedUsdc: rewardEvents
      .filter((event) => event.status === "accrued")
      .reduce((sum, event) => sum + event.rewardAmountUsdc, 0),
    totalPendingDistributionUsdc: rewardEvents
      .filter((event) => event.status === "pending_admin_distribution")
      .reduce((sum, event) => sum + event.rewardAmountUsdc, 0),
    totalPaidUsdc: rewardEvents
      .filter((event) => event.status === "paid")
      .reduce((sum, event) => sum + event.rewardAmountUsdc, 0),
    nextMilestone: buildMilestone(completedInviteesCount)
  };
}

export async function listReferralDashboardInvitees(input: {
  referrerWalletPublicKey: string;
  limit?: number;
  offset?: number;
}): Promise<ReferralDashboardInviteePage> {
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));
  const offset = Math.max(0, input.offset ?? 0);
  const attributionPage = await listReferralAttributionsPageForReferrer({
    referrerWalletPublicKey: input.referrerWalletPublicKey,
    limit,
    offset
  });
  const rewardEvents = await listReferralRewardEventsByAttributionIds({
    attributionIds: attributionPage.items.map((attribution) => attribution.id)
  });
  const rewardEventsByAttributionId = buildRewardEventsByAttributionId(rewardEvents);
  const items = attributionPage.items.map((attribution) => buildInviteeRecord(attribution, rewardEventsByAttributionId));

  return {
    items,
    totalCount: attributionPage.totalCount,
    limit: attributionPage.limit,
    offset: attributionPage.offset,
    hasMore: attributionPage.offset + attributionPage.items.length < attributionPage.totalCount
  };
}
