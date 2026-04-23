import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { Card } from "@/components/ui/card";

export default function LoadingAdminCollectionsPage() {
  return (
    <AdminModulePlaceholder
      highlights={["Server-side contract check", "Loading current admin collections", "Preparing empty/error handoff"]}
      listTitle="Loading state"
      subtitle="Preparing the minimal read-only collections view."
      title="Collections"
    >
      <Card className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </div>
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </Card>
    </AdminModulePlaceholder>
  );
}
