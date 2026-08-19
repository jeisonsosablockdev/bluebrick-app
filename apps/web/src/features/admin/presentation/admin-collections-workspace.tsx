import type { ReactElement } from "react";

import { AdminCollectionsCardGrid } from "@/features/admin/presentation/admin-collections-card-grid";
import { AdminCollectionsEmptyState, AdminCollectionsErrorState } from "@/features/admin/presentation/admin-collections-state-panels";
import type { AdminCollectionsPageState } from "@/lib/admin/collections-page-state";
import type { AppLocale } from "@/lib/i18n";

type AdminCollectionsWorkspaceProps = {
  locale: AppLocale;
  state: AdminCollectionsPageState;
};

export function AdminCollectionsWorkspace({
  locale,
  state
}: AdminCollectionsWorkspaceProps): ReactElement {
  if (state.kind === "error") {
    return <AdminCollectionsErrorState locale={locale} message={state.message} />;
  }

  if (state.kind === "empty") {
    return <AdminCollectionsEmptyState locale={locale} />;
  }

  return <AdminCollectionsCardGrid locale={locale} state={state} />;
}
