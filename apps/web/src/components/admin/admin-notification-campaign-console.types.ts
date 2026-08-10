export type PreviewResponse = {
  eligibleWalletCount: number;
  eligibleSubscriptionCount: number;
  excludedWalletCount: number;
  blockedReasons: string[];
  audienceCap: number;
  audienceHash: string;
  sampleWallets: Array<{
    walletPublicKey: string;
    country: string | null;
    activeSubscriptionCount: number;
    platformFamily: string | null;
    appMode: string | null;
  }>;
};

export type NotificationHealthResponse = {
  rollout: {
    installabilityEnabled: boolean;
    registrationEnabled: boolean;
    deliveryEnabled: boolean;
    adminCampaignsEnabled: boolean;
  };
  subscriptions: {
    total: number;
    active: number;
    revoked: number;
    failing: number;
    gone: number;
    byPlatform: Record<string, number>;
    newLast24h: number;
  };
  deliveries: {
    processedAttempts: number;
    delivered: number;
    pruned: number;
    failed: number;
    processedLast24h: number;
  };
};

export type CampaignConsoleFormState = {
  messageClass: "product_update" | "compliance_update" | "ops_notice";
  title: string;
  body: string;
  destinationUrl: string;
  country: string;
  platformFamily: "all" | "ios" | "android" | "desktop" | "unknown";
  appMode: "all" | "browser" | "standalone";
};

export const DEFAULT_ADMIN_NOTIFICATION_CAMPAIGN_FORM = {
  messageClass: "product_update",
  title: "",
  body: "",
  destinationUrl: "/protected",
  country: "",
  platformFamily: "all",
  appMode: "all"
} satisfies CampaignConsoleFormState;
