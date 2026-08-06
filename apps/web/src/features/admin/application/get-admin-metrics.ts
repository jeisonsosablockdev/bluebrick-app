import { AdminDrizzleRepository } from '../infrastructure';
import { SystemHealthMetrics, AuditLogEntry } from '../domain';

export async function getAdminMetricsQuery(): Promise<{
  health: SystemHealthMetrics;
  auditLogs: AuditLogEntry[];
}> {
  const repo = new AdminDrizzleRepository();
  const [health, auditLogs] = await Promise.all([
    repo.getSystemHealthMetrics(),
    repo.getRecentAuditLogs(),
  ]);

  return { health, auditLogs };
}
