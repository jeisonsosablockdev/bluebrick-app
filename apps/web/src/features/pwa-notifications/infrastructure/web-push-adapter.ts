import { WebPushSubscriptionPayload } from '../domain';

export class WebPushVapidAdapter {
  static getPublicVapidKey(): string {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-m9GY58-placeholder';
  }

  async saveSubscription(subscription: WebPushSubscriptionPayload): Promise<boolean> {
    if (!subscription.endpoint) return false;
    return true;
  }
}
