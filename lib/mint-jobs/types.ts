export type MintJobStatus = "queued" | "preparing" | "signing" | "submitting" | "confirming" | "partial" | "completed" | "failed";

export type MintBatchStatus = "prepared" | "submitted" | "confirming" | "confirmed" | "partial" | "failed";

export type MintItemStatus = "pending" | "prepared" | "submitted" | "confirmed" | "failed";

export type SignatureConfirmationStatus = "submitted" | "confirmed" | "failed";

export type WebhookProcessingStatus = "received" | "processed" | "failed";

export type MintJobRecord = {
  id: string;
  emissionId: string;
  idempotencyKey: string;
  status: MintJobStatus;
  totalItems: number;
  preparedItems: number;
  submittedItems: number;
  confirmedItems: number;
  failedItems: number;
  collectionAddress: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MintBatchRecord = {
  id: string;
  jobId: string;
  batchNo: number;
  batchToken: string;
  requestFingerprint: string;
  status: MintBatchStatus;
  preparedCount: number;
  submittedCount: number;
  confirmedCount: number;
  failedCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MintItemRecord = {
  id: string;
  jobId: string;
  batchId: string | null;
  serialNo: number;
  assetPubkey: string;
  status: MintItemStatus;
  signature: string | null;
  lastError: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MintItemSignatureRecord = {
  id: string;
  jobItemId: string;
  batchId: string | null;
  signature: string;
  confirmationStatus: SignatureConfirmationStatus;
  slot: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type WebhookEventRecord = {
  id: string;
  provider: string;
  eventId: string | null;
  eventFingerprint: string;
  signature: string | null;
  eventType: string | null;
  slot: number | null;
  processingStatus: WebhookProcessingStatus;
  errorMessage: string | null;
  receivedAt: string;
  processedAt: string | null;
};

export type MintJobOverview = {
  job: MintJobRecord;
  batchesTotal: number;
  batchesConfirming: number;
  itemsTotal: number;
  itemsConfirmed: number;
  itemsFailed: number;
};
