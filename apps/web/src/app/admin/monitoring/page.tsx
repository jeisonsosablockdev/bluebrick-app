import { MonitoringConsole } from "@/features/admin/presentation/monitoring-console";
import { getAdminMonitoringEvents } from "@/features/checkout-payment/application/purchase-metrics-service";

type AdminMonitoringPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export default async function AdminMonitoringPage({ searchParams }: AdminMonitoringPageProps) {
  const params = await searchParams;
  const filters = {
    eventType: readValue(params.eventType),
    status: readValue(params.status),
    wallet: readValue(params.wallet),
    asset: readValue(params.asset),
    signature: readValue(params.signature),
    page: parsePositiveInteger(readValue(params.page), 1),
    limit: parsePositiveInteger(readValue(params.limit), 20)
  };
  const initialData = await getAdminMonitoringEvents(filters).catch(() => null);

  return <MonitoringConsole initialData={initialData} initialFilters={filters} />;
}
