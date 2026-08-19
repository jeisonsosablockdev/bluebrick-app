import { OfflineQueueEntry } from '../domain';

export class IndexedDbQueueAdapter {
  private queue: OfflineQueueEntry[] = [];

  async pushEntry(entry: OfflineQueueEntry): Promise<void> {
    this.queue.push(entry);
  }

  async getPendingEntries(): Promise<OfflineQueueEntry[]> {
    return this.queue.filter((e) => !e.synced);
  }

  async markAsSynced(id: string): Promise<void> {
    const item = this.queue.find((e) => e.id === id);
    if (item) item.synced = true;
  }
}
