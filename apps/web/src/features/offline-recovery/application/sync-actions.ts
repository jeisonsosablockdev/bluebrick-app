import { IndexedDbQueueAdapter } from '../infrastructure';
import { OfflineQueueEntry } from '../domain';

export async function syncOfflineQueueAction(entries: OfflineQueueEntry[]): Promise<{ syncedCount: number }> {
  const adapter = new IndexedDbQueueAdapter();
  for (const entry of entries) {
    await adapter.markAsSynced(entry.id);
  }
  return { syncedCount: entries.length };
}
