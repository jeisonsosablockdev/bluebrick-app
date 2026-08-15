import { ComplianceConsole } from "@/components/admin/compliance-console";
import { getComplianceCasesQueue } from "@/lib/compliance/case-service";
import type { ComplianceStatus } from "@/lib/compliance/compliance-status-projector";

type AdminCompliancePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeStatus(value: string | undefined): ComplianceStatus | undefined {
  if (
    value === "pending_kyc"
    || value === "pending_aml"
    || value === "pending_review"
    || value === "fully_verified"
    || value === "restricted_aml"
    || value === "suspended"
  ) {
    return value;
  }

  return undefined;
}

export default async function AdminCompliancePage({ searchParams }: AdminCompliancePageProps) {
  const params = await searchParams;
  const status = normalizeStatus(readValue(params.status));

  const initialData = await getComplianceCasesQueue({
    status,
    cursor: undefined,
    limit: 20
  }).catch(() => null);

  return <ComplianceConsole initialData={initialData} initialStatus={status} />;
}
