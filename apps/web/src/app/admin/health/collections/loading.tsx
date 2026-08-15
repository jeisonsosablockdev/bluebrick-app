import { Card } from "@/components/ui/card";

export default function LoadingAdminCollectionsHealthPage() {
  return (
    <Card aria-live="polite" className="space-y-3">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">Loading health queue</p>
      <h2 className="text-lg font-semibold text-white">Checking degraded collection rows</h2>
      <p className="text-sm text-white/70">
        Reviewing consistency failures, bootstrap exceptions, and manual-review candidates.
      </p>
    </Card>
  );
}
