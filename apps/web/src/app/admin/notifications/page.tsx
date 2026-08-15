import { AdminNotificationCampaignConsole } from "@/components/admin/admin-notification-campaign-console";
import { getNotificationHealthSnapshot } from "@/lib/notifications/health";

export default async function AdminNotificationsPage() {
  const initialHealth = await getNotificationHealthSnapshot().catch(() => null);
  return <AdminNotificationCampaignConsole initialHealth={initialHealth} />;
}
