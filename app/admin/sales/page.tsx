import { SalesOverviewPanel } from "@/components/admin/sales-overview-panel";
import { getAdminSalesOverview } from "@/lib/purchase-metrics-service";

type AdminSalesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseRange(value: string | undefined): "24h" | "7d" | "30d" {
  return value === "7d" || value === "30d" ? value : "24h";
}

export default async function AdminSalesPage({ searchParams }: AdminSalesPageProps) {
  const params = await searchParams;
  const range = parseRange(readValue(params.range));
  const initialData = await getAdminSalesOverview({ range }).catch(() => null);

  return <SalesOverviewPanel initialData={initialData} initialRange={range} />;
}
