import { ExecutiveDashboard } from "@/components/admin/executive-dashboard";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminDashboardPage() {
  const locale = await getServerLocale();

  return <ExecutiveDashboard walletLabel={localize(locale, { en: "Admin", es: "Administrador", pt: "Administrador" })} />;
}
