import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { Card } from "@/components/ui/card";

export default function LoadingAdminCollectionDetailPage() {
  return (
    <AdminModulePlaceholder
      highlights={["Ownership contract re-check", "Read-only detail handoff", "Section-level editor follows next story"]}
      listTitle="Loading collection detail"
      subtitle="Resolving ownership evidence and detail payload."
      title="Collection detail"
    >
      <Card className="space-y-5" aria-busy="true" aria-live="polite">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-white/5 lg:max-w-md" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-8 w-72 max-w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-white/5" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
            </div>
          </div>
        </div>
      </Card>
    </AdminModulePlaceholder>
  );
}
