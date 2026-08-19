export interface WebPushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAddress?: string;
}

export interface PushNotificationCampaign {
  id: string;
  title: string;
  body: string;
  iconUrl?: string;
  targetUrl?: string;
  sentAt: string;
}
