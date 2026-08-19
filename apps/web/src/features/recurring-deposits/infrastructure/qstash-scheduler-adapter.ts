import { DepositScheduleEntity } from '../domain';

export class QStashCronSchedulerAdapter {
  async scheduleRecurringCron(schedule: DepositScheduleEntity): Promise<{ cronJobId: string }> {
    return { cronJobId: `qstash_job_${Math.random().toString(36).slice(2, 10)}` };
  }
}
