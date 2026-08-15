import { ExecutiveDashboard } from "@/components/admin/executive-dashboard";
import { getAdminMetricsQuery, AdminPageClient } from "@/features/admin";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { getAdminDashboardOverview } from "@/lib/purchase-metrics-service";

type AdminDashboardPageProps = {
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

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const locale = await getServerLocale();
  const params = await searchParams;
  const range = parseRange(readValue(params.range));
  const initialOverview = await getAdminDashboardOverview({ range }).catch(() => null);
  const { health } = await getAdminMetricsQuery();

  return (
    <div className="space-y-6">
      <AdminPageClient metrics={health} />
      <ExecutiveDashboard
        walletLabel={localize(locale, { en: "Admin", es: "Administrador", pt: "Administrador" })}
        initialOverview={initialOverview}
      />
    </div>
  );
}
