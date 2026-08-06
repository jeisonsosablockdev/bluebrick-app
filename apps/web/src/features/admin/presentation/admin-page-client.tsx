'use client';

import React from 'react';
import { SystemHealthMetrics } from '../domain';
import { AdminDashboardHeader } from './admin-dashboard-header';
import { AdminMetricsGrid } from './admin-metrics-grid';

export interface AdminPageClientProps {
  metrics: SystemHealthMetrics;
}

export function AdminPageClient({ metrics }: AdminPageClientProps) {
  return (
    <section className="space-y-6">
      <AdminDashboardHeader />
      <AdminMetricsGrid metrics={metrics} />
    </section>
  );
}
