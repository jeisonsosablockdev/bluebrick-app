import { DepositScheduleEntity } from '../domain';
import { QStashCronSchedulerAdapter } from '../infrastructure';

export async function configureRecurringDepositAction(
  schedule: Omit<DepositScheduleEntity, 'id' | 'status' | 'nextExecutionDate'>
): Promise<DepositScheduleEntity> {
  const adapter = new QStashCronSchedulerAdapter();
  const created: DepositScheduleEntity = {
    ...schedule,
    id: `sched_${Date.now()}`,
    status: 'ACTIVE',
    nextExecutionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  await adapter.scheduleRecurringCron(created);
  return created;
}
