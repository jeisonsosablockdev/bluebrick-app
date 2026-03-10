import { randomUUID } from "node:crypto";

export type MintJobStatus = "draft" | "running" | "partial" | "completed" | "failed";
export type MintBatchStatus = "prepared" | "submitted" | "confirmed" | "failed";
export type MintItemStatus = "pending" | "prepared" | "submitted" | "confirmed" | "failed";
export type MintWebhookProvider = "helius" | (string & {});

export type MintItemRecord = {
  itemId: string;
  serial: number;
  status: MintItemStatus;
  batchNo: number | null;
  signature: string | null;
  expectedAddress: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type MintBatchRecord = {
  batchNo: number;
  idempotencyKey: string;
  status: MintBatchStatus;
  itemIds: string[];
  signatures: string[];
  submissionAttemptCount: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
};

export type MintJobRecord = {
  jobId: string;
  createdBy: string;
  collectionAddress: string | null;
  totalItems: number;
  batchSize: number;
  startSerial: number;
  status: MintJobStatus;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  items: MintItemRecord[];
  batches: MintBatchRecord[];
};

export type MintJobProgress = {
  totalItems: number;
  pending: number;
  prepared: number;
  submitted: number;
  confirmed: number;
  failed: number;
};

export type MintWebhookEventRecord = {
  provider: MintWebhookProvider;
  eventId: string | null;
  eventFingerprint: string;
  signature: string | null;
  eventType: string | null;
  slot: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
  deliveryCount: number;
};

type CreateMintJobInput = {
  createdBy: string;
  totalItems: number;
  batchSize: number;
  startSerial: number;
  collectionAddress?: string;
};

type PrepareNextBatchInput = {
  jobId: string;
  idempotencyKey?: string;
  actorPubkey?: string;
};

type BatchSubmissionInput = {
  itemId: string;
  serial: number;
  signature: string;
  expectedAddress?: string;
};

type SubmitBatchInput = {
  jobId: string;
  batchNo: number;
  actorPubkey?: string;
  submissions: BatchSubmissionInput[];
};

type SignatureResolution = {
  signature: string;
  confirmed: boolean;
  failed: boolean;
  errorMessage: string | null;
};

type ReconcileSignaturesInput = {
  jobId: string;
  actorPubkey?: string;
  resolutions: SignatureResolution[];
};

type RecordMintWebhookEventInput = {
  provider: MintWebhookProvider;
  eventId?: string | null;
  eventFingerprint: string;
  signature?: string | null;
  eventType?: string | null;
  slot?: number | null;
};

const MAX_TOTAL_ITEMS = 5000;
const MAX_BATCH_SIZE = 100;
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_START_SERIAL = 1;

class MintOrchestratorError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MintOrchestratorError";
    this.status = status;
  }
}

const jobsById = new Map<string, MintJobRecord>();
const batchByIdempotency = new Map<string, number>();
const signatureIndex = new Map<string, { jobId: string; itemId: string }>();
const webhookByProviderEventId = new Map<string, MintWebhookEventRecord>();
const webhookByProviderFingerprint = new Map<string, MintWebhookEventRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new MintOrchestratorError(`${fieldName} is required.`);
  }

  return value.trim();
}

function assertCreateInput(input: CreateMintJobInput): CreateMintJobInput {
  const createdBy = assertNonEmptyString(input.createdBy, "createdBy");
  const totalItems = input.totalItems;
  const batchSize = input.batchSize || DEFAULT_BATCH_SIZE;
  const startSerial = input.startSerial || DEFAULT_START_SERIAL;

  if (!isPositiveInteger(totalItems) || totalItems > MAX_TOTAL_ITEMS) {
    throw new MintOrchestratorError(`totalItems must be a positive integer <= ${MAX_TOTAL_ITEMS}.`);
  }

  if (!isPositiveInteger(batchSize) || batchSize > MAX_BATCH_SIZE) {
    throw new MintOrchestratorError(`batchSize must be a positive integer <= ${MAX_BATCH_SIZE}.`);
  }

  if (!isPositiveInteger(startSerial)) {
    throw new MintOrchestratorError("startSerial must be a positive integer.");
  }

  const collectionAddress = input.collectionAddress?.trim() || undefined;

  return {
    createdBy,
    totalItems,
    batchSize,
    startSerial,
    collectionAddress
  };
}

function getJobOrThrow(jobId: string): MintJobRecord {
  const job = jobsById.get(jobId);

  if (!job) {
    throw new MintOrchestratorError("Mint job not found.", 404);
  }

  return job;
}

function assertJobAuthority(job: MintJobRecord, actorPubkey?: string): void {
  if (actorPubkey === undefined) {
    return;
  }

  const normalizedActorPubkey = actorPubkey.trim();

  if (!normalizedActorPubkey) {
    throw new MintOrchestratorError("actorPubkey cannot be empty.");
  }

  if (normalizedActorPubkey !== job.createdBy) {
    throw new MintOrchestratorError(
      `Job authority is frozen to ${job.createdBy}; ${normalizedActorPubkey} cannot mutate this job.`,
      403
    );
  }
}

function nextBatchNo(job: MintJobRecord): number {
  return job.batches.length === 0 ? 1 : Math.max(...job.batches.map((batch) => batch.batchNo)) + 1;
}

function updateJobStatusFromItems(job: MintJobRecord): void {
  const progress = calculateMintJobProgress(job);
  const timestamp = nowIso();

  if (progress.confirmed === job.totalItems) {
    job.status = "completed";
  } else if (progress.failed === job.totalItems) {
    job.status = "failed";
  } else if (progress.failed > 0 || progress.confirmed > 0 || progress.submitted > 0 || progress.prepared > 0) {
    job.status = "partial";
  } else {
    job.status = "running";
  }

  job.updatedAt = timestamp;
}

function updateBatchStatus(job: MintJobRecord, batch: MintBatchRecord): void {
  const batchItems = job.items.filter((item) => batch.itemIds.includes(item.itemId));
  const hasFailed = batchItems.some((item) => item.status === "failed");
  const allConfirmed = batchItems.length > 0 && batchItems.every((item) => item.status === "confirmed");
  const allSubmittedOrConfirmed = batchItems.length > 0 && batchItems.every((item) => item.status === "submitted" || item.status === "confirmed");

  if (hasFailed) {
    batch.status = "failed";
  } else if (allConfirmed) {
    batch.status = "confirmed";
  } else if (allSubmittedOrConfirmed) {
    batch.status = "submitted";
  } else {
    batch.status = "prepared";
  }

  batch.updatedAt = nowIso();
}

function applySignatureResolution(item: MintItemRecord, resolution: SignatureResolution): void {
  if (resolution.failed) {
    item.status = "failed";
    item.lastError = resolution.errorMessage || "Signature marked as failed.";
  } else if (resolution.confirmed) {
    item.status = "confirmed";
    item.lastError = null;
  }

  item.updatedAt = nowIso();
}

function cloneJob(job: MintJobRecord): MintJobRecord {
  return JSON.parse(JSON.stringify(job)) as MintJobRecord;
}

function cloneWebhookEvent(record: MintWebhookEventRecord): MintWebhookEventRecord {
  return { ...record };
}

function buildWebhookLookupKey(provider: string, value: string): string {
  return `${provider}:${value}`;
}

export function calculateMintJobProgress(job: MintJobRecord): MintJobProgress {
  const progress: MintJobProgress = {
    totalItems: job.totalItems,
    pending: 0,
    prepared: 0,
    submitted: 0,
    confirmed: 0,
    failed: 0
  };

  for (const item of job.items) {
    progress[item.status] += 1;
  }

  return progress;
}

export function createMintJob(input: CreateMintJobInput): MintJobRecord {
  const validated = assertCreateInput(input);
  const timestamp = nowIso();
  const jobId = randomUUID();

  const items: MintItemRecord[] = Array.from({ length: validated.totalItems }, (_, index) => {
    const serial = validated.startSerial + index;

    return {
      itemId: randomUUID(),
      serial,
      status: "pending",
      batchNo: null,
      signature: null,
      expectedAddress: null,
      lastError: null,
      updatedAt: timestamp
    };
  });

  const job: MintJobRecord = {
    jobId,
    createdBy: validated.createdBy,
    collectionAddress: validated.collectionAddress || null,
    totalItems: validated.totalItems,
    batchSize: validated.batchSize,
    startSerial: validated.startSerial,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastError: null,
    items,
    batches: []
  };

  jobsById.set(jobId, job);
  return cloneJob(job);
}

export function recordMintWebhookEvent(input: RecordMintWebhookEventInput): { event: MintWebhookEventRecord; duplicate: boolean } {
  const provider = assertNonEmptyString(input.provider, "provider");
  const eventFingerprint = assertNonEmptyString(input.eventFingerprint, "eventFingerprint");
  const eventId = typeof input.eventId === "string" && input.eventId.trim().length > 0 ? input.eventId.trim() : null;
  const signature = typeof input.signature === "string" && input.signature.trim().length > 0 ? input.signature.trim() : null;
  const eventType = typeof input.eventType === "string" && input.eventType.trim().length > 0 ? input.eventType.trim() : null;
  const slot = input.slot ?? null;

  if (slot !== null && (!Number.isInteger(slot) || slot < 0)) {
    throw new MintOrchestratorError("slot must be a non-negative integer.");
  }

  const providerEventIdKey = eventId ? buildWebhookLookupKey(provider, eventId) : null;
  const providerFingerprintKey = buildWebhookLookupKey(provider, eventFingerprint);
  const existingEvent = (providerEventIdKey ? webhookByProviderEventId.get(providerEventIdKey) : undefined)
    || webhookByProviderFingerprint.get(providerFingerprintKey);
  const timestamp = nowIso();

  if (existingEvent) {
    existingEvent.lastSeenAt = timestamp;
    existingEvent.deliveryCount += 1;

    if (!existingEvent.eventId && eventId) {
      existingEvent.eventId = eventId;
    }

    if (!existingEvent.signature && signature) {
      existingEvent.signature = signature;
    }

    if (!existingEvent.eventType && eventType) {
      existingEvent.eventType = eventType;
    }

    if (existingEvent.slot === null && slot !== null) {
      existingEvent.slot = slot;
    }

    webhookByProviderFingerprint.set(providerFingerprintKey, existingEvent);

    if (existingEvent.eventId) {
      webhookByProviderEventId.set(buildWebhookLookupKey(provider, existingEvent.eventId), existingEvent);
    }

    return {
      event: cloneWebhookEvent(existingEvent),
      duplicate: true
    };
  }

  const event: MintWebhookEventRecord = {
    provider,
    eventId,
    eventFingerprint,
    signature,
    eventType,
    slot,
    firstSeenAt: timestamp,
    lastSeenAt: timestamp,
    deliveryCount: 1
  };

  webhookByProviderFingerprint.set(providerFingerprintKey, event);

  if (providerEventIdKey) {
    webhookByProviderEventId.set(providerEventIdKey, event);
  }

  return {
    event: cloneWebhookEvent(event),
    duplicate: false
  };
}

export function getMintJob(jobId: string): MintJobRecord {
  return cloneJob(getJobOrThrow(jobId));
}

export function listMintJobs(limit = 20): MintJobRecord[] {
  return Array.from(jobsById.values())
    .sort((left, right) => (left.createdAt > right.createdAt ? -1 : 1))
    .slice(0, Math.max(1, limit))
    .map((job) => cloneJob(job));
}

export function prepareNextMintBatch(input: PrepareNextBatchInput): { job: MintJobRecord; batch: MintBatchRecord; items: MintItemRecord[] } {
  const job = getJobOrThrow(input.jobId);
  assertJobAuthority(job, input.actorPubkey);
  const timestamp = nowIso();
  const idempotencyKey = (input.idempotencyKey || randomUUID()).trim();

  if (!idempotencyKey) {
    throw new MintOrchestratorError("idempotencyKey cannot be empty.");
  }

  const batchLookupKey = `${job.jobId}:${idempotencyKey}`;
  const existingBatchNo = batchByIdempotency.get(batchLookupKey);

  if (existingBatchNo !== undefined) {
    const existingBatch = job.batches.find((batch) => batch.batchNo === existingBatchNo);

    if (!existingBatch) {
      throw new MintOrchestratorError("Batch idempotency index is inconsistent.", 500);
    }

    const existingItems = job.items.filter((item) => existingBatch.itemIds.includes(item.itemId));
    return { job: cloneJob(job), batch: { ...existingBatch }, items: JSON.parse(JSON.stringify(existingItems)) };
  }

  const candidateItems = job.items.filter((item) => item.status === "pending" || item.status === "failed");

  if (candidateItems.length === 0) {
    throw new MintOrchestratorError("No pending items available for batching.", 409);
  }

  const selectedItems = candidateItems.slice(0, job.batchSize);
  const batchNo = nextBatchNo(job);

  for (const item of selectedItems) {
    item.status = "prepared";
    item.batchNo = batchNo;
    item.updatedAt = timestamp;
  }

  const batch: MintBatchRecord = {
    batchNo,
    idempotencyKey,
    status: "prepared",
    itemIds: selectedItems.map((item) => item.itemId),
    signatures: [],
    submissionAttemptCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastError: null
  };

  job.batches.push(batch);
  job.status = "running";
  job.updatedAt = timestamp;
  batchByIdempotency.set(batchLookupKey, batchNo);

  return { job: cloneJob(job), batch: { ...batch }, items: JSON.parse(JSON.stringify(selectedItems)) };
}

export function submitMintBatch(input: SubmitBatchInput): { job: MintJobRecord; batch: MintBatchRecord; items: MintItemRecord[] } {
  const job = getJobOrThrow(input.jobId);
  assertJobAuthority(job, input.actorPubkey);
  const batch = job.batches.find((entry) => entry.batchNo === input.batchNo);

  if (!batch) {
    throw new MintOrchestratorError("Batch not found.", 404);
  }

  if (!Array.isArray(input.submissions) || input.submissions.length === 0) {
    throw new MintOrchestratorError("submissions cannot be empty.");
  }

  const touchedItems: MintItemRecord[] = [];
  const timestamp = nowIso();
  batch.submissionAttemptCount += 1;
  batch.updatedAt = timestamp;

  for (const submission of input.submissions) {
    const signature = assertNonEmptyString(submission.signature, "signature");
    const item = job.items.find((entry) => entry.itemId === submission.itemId);

    if (!item) {
      throw new MintOrchestratorError(`Item not found for itemId=${submission.itemId}.`, 404);
    }

    if (item.serial !== submission.serial) {
      throw new MintOrchestratorError(`Serial mismatch for itemId=${submission.itemId}.`);
    }

    if (item.batchNo !== batch.batchNo) {
      throw new MintOrchestratorError(`Item ${submission.itemId} does not belong to batch ${batch.batchNo}.`, 409);
    }

    const duplicateSignature = signatureIndex.get(signature);

    if (duplicateSignature && (duplicateSignature.jobId !== job.jobId || duplicateSignature.itemId !== item.itemId)) {
      throw new MintOrchestratorError(`Signature already used by item ${duplicateSignature.itemId}.`, 409);
    }

    if (item.signature && item.signature !== signature) {
      throw new MintOrchestratorError(`Item ${item.itemId} already has a different signature.`, 409);
    }

    item.signature = signature;
    item.expectedAddress = submission.expectedAddress?.trim() || item.expectedAddress;
    item.status = "submitted";
    item.lastError = null;
    item.updatedAt = timestamp;
    signatureIndex.set(signature, { jobId: job.jobId, itemId: item.itemId });

    if (!batch.signatures.includes(signature)) {
      batch.signatures.push(signature);
    }

    touchedItems.push(item);
  }

  batch.status = "submitted";
  updateBatchStatus(job, batch);
  updateJobStatusFromItems(job);

  return {
    job: cloneJob(job),
    batch: { ...batch },
    items: JSON.parse(JSON.stringify(touchedItems))
  };
}

export function reconcileMintJobSignatures(input: ReconcileSignaturesInput): { job: MintJobRecord; updatedItems: MintItemRecord[] } {
  const job = getJobOrThrow(input.jobId);
  assertJobAuthority(job, input.actorPubkey);
  const resolutionBySignature = new Map(input.resolutions.map((resolution) => [resolution.signature, resolution]));
  const updatedItems: MintItemRecord[] = [];

  for (const item of job.items) {
    if (!item.signature) {
      continue;
    }

    const resolution = resolutionBySignature.get(item.signature);

    if (!resolution) {
      continue;
    }

    const previousStatus = item.status;
    applySignatureResolution(item, resolution);

    if (previousStatus !== item.status) {
      updatedItems.push({ ...item });
    }
  }

  for (const batch of job.batches) {
    updateBatchStatus(job, batch);
  }

  updateJobStatusFromItems(job);

  return {
    job: cloneJob(job),
    updatedItems: JSON.parse(JSON.stringify(updatedItems))
  };
}

export function getBatchSignatures(jobId: string): string[] {
  const job = getJobOrThrow(jobId);
  const signatures = new Set<string>();

  for (const batch of job.batches) {
    for (const signature of batch.signatures) {
      signatures.add(signature);
    }
  }

  return Array.from(signatures);
}

export function isMintOrchestratorError(error: unknown): error is MintOrchestratorError {
  return error instanceof MintOrchestratorError;
}
