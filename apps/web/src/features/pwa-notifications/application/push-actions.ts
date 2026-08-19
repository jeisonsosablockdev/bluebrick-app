import { WebPushSubscriptionPayload } from '../domain';
import { WebPushVapidAdapter } from '../infrastructure';

export async function subscribeToWebPushAction(subscription: WebPushSubscriptionPayload): Promise<{ success: boolean }> {
  const adapter = new WebPushVapidAdapter();
  const success = await adapter.saveSubscription(subscription);
  return { success };
}
