import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { Card } from "@/components/ui/card";

export default function LoadingAdminCollectionsPage() {
  return (
    <AdminModulePlaceholder
      highlights={["Server-side ownership check", "Snapshot readiness scan", "Editable sections handoff"]}
      listTitle="Loading collections workspace"
      subtitle="Checking ownership, snapshots, and editable sections."
      title="Collections"
    >
      <Card className="space-y-5" aria-live="polite" aria-busy="true">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-72 max-w-full animate-pulse rounded bg-white/5" />
          </div>
          <div className="h-11 w-36 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
        </div>
        <div className="space-y-3">
          <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-black/10" />
          <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-black/10" />
        </div>
      </Card>
    </AdminModulePlaceholder>
  );
}
