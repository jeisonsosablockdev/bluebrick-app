import {
  recordComplianceAuditEvent,
  updateAmlStatusFromProvider,
  type ComplianceAuditActorType
} from "@/features/profile/infrastructure/profile-repository";
import { screenWalletWithHelius } from "@/features/profile/infrastructure/aml-helius";

export type RunWalletAmlScreeningInput = {
  walletPublicKey: string;
  trigger: string;
  actorType: ComplianceAuditActorType;
  actorId: string;
};

export type WalletAmlScreeningSummary = {
  walletPublicKey: string;
  amlStatus: "pending" | "clear" | "flagged" | "not_started";
  providerClassification: "clear" | "review_required" | "flagged" | "unavailable";
  amlRiskScore: number | null;
  flags: Array<{
    code: string;
    severity: "low" | "medium" | "high" | "unknown";
    label?: string;
  }>;
  provider: "helius";
  ruleVersion: string;
  checkedAt: string;
  complianceStatus: string;
};

export async function runWalletAmlScreening(
  input: RunWalletAmlScreeningInput
): Promise<WalletAmlScreeningSummary> {
  await recordComplianceAuditEvent({
    walletPublicKey: input.walletPublicKey,
    actorType: input.actorType,
    actorId: input.actorId,
    eventName: "aml.check_requested",
    eventPayload: {
      trigger: input.trigger
    }
  });

  const screening = await screenWalletWithHelius({
    walletPublicKey: input.walletPublicKey,
    reason: input.trigger
  });

  const updatedProfile = await updateAmlStatusFromProvider({
    walletPublicKey: input.walletPublicKey,
    provider: screening.provider,
    providerClassification: screening.providerClassification,
    amlStatus: screening.amlStatus,
    amlRiskScore: screening.amlRiskScore,
    amlFlags: screening.flags,
    ruleVersion: screening.ruleVersion,
    triggerSource: input.trigger
  });

  await recordComplianceAuditEvent({
    walletPublicKey: input.walletPublicKey,
    actorType: "provider",
    actorId: screening.provider,
    eventName: "aml.check_completed",
    eventPayload: {
      trigger: input.trigger,
      amlStatus: screening.amlStatus,
      providerClassification: screening.providerClassification,
      amlRiskScore: screening.amlRiskScore,
      ruleVersion: screening.ruleVersion
    }
  });

  if (screening.providerClassification === "flagged") {
    await recordComplianceAuditEvent({
      walletPublicKey: input.walletPublicKey,
      actorType: "provider",
      actorId: screening.provider,
      eventName: "aml.flagged",
      eventPayload: {
        trigger: input.trigger,
        amlRiskScore: screening.amlRiskScore
      }
    });
  }

  await recordComplianceAuditEvent({
    walletPublicKey: input.walletPublicKey,
    actorType: "system",
    actorId: "compliance_status_projector",
    eventName: "compliance.status_projected",
    eventPayload: {
      trigger: input.trigger,
      complianceStatus: updatedProfile.complianceStatus,
      kycStatus: updatedProfile.kycStatus,
      amlStatus: screening.amlStatus
    }
  });

  return {
    walletPublicKey: input.walletPublicKey,
    amlStatus: screening.amlStatus,
    providerClassification: screening.providerClassification,
    amlRiskScore: screening.amlRiskScore,
    flags: screening.flags,
    provider: screening.provider,
    ruleVersion: screening.ruleVersion,
    checkedAt: screening.checkedAt,
    complianceStatus: updatedProfile.complianceStatus
  };
}
