"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildBatchSubmitPayload,
  createSubmissionDrafts,
  parsePositiveIntOrNull,
  type MintBatchItem,
  type MintBatchSubmissionDrafts
} from "@/lib/mint-orchestrator-ui";

type MintItemStatus = "pending" | "prepared" | "submitted" | "confirmed" | "failed";
type MintBatchStatus = "prepared" | "submitted" | "confirmed" | "failed";
type MintJobStatus = "draft" | "running" | "partial" | "completed" | "failed";

type MintJobProgress = {
  totalItems: number;
  pending: number;
  prepared: number;
  submitted: number;
  confirmed: number;
  failed: number;
};

type MintItemRecord = {
  itemId: string;
  serial: number;
  status: MintItemStatus;
  batchNo: number | null;
  signature: string | null;
  expectedAddress: string | null;
  lastError: string | null;
  updatedAt: string;
};

type MintBatchRecord = {
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

type MintJobRecord = {
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

type MintJobWithProgress = MintJobRecord & {
  progress: MintJobProgress;
};

type MintOrchestratorApiError = {
  error?: string;
};

type ListMintJobsResponse = {
  jobs: MintJobWithProgress[];
};

type CreateMintJobResponse = {
  job: MintJobRecord;
  progress: MintJobProgress;
};

type PrepareNextBatchResponse = {
  job: MintJobRecord;
  batch: MintBatchRecord;
  items: MintItemRecord[];
  progress: MintJobProgress;
};

type SubmitBatchResponse = {
  job: MintJobRecord;
  batch: MintBatchRecord;
  items: MintItemRecord[];
  progress: MintJobProgress;
};

type ReconcileRpcResponse = {
  job: MintJobRecord;
  updatedItems: MintItemRecord[];
  progress: MintJobProgress;
  checkedSignatures: number;
};

type ReconcileDasResponse = {
  job: MintJobRecord;
  updatedItems: MintItemRecord[];
  progress: MintJobProgress;
  das: {
    mode: "owner" | "collection";
    owner: string | null;
    collectionAddress: string | null;
    page: number;
    limit: number;
    maxPages: number;
    pagesFetched: number;
    assetsScanned: number;
    matchedAssets: number;
    resolvedSignatures: number;
    nextPage: number | null;
  };
};

type BusyAction =
  | "refresh-jobs"
  | "create-job"
  | "prepare-batch"
  | "submit-batch"
  | "reconcile-rpc"
  | "reconcile-das"
  | "refresh-job"
  | null;

type CreateJobFormState = {
  totalItems: string;
  batchSize: string;
  startSerial: string;
  collectionAddress: string;
};

type DasReconcileFormState = {
  owner: string;
  collectionAddress: string;
  page: string;
  limit: string;
  maxPages: string;
};

const DEFAULT_CREATE_JOB_FORM: CreateJobFormState = {
  totalItems: "5",
  batchSize: "2",
  startSerial: "1",
  collectionAddress: ""
};

const DEFAULT_DAS_FORM: DasReconcileFormState = {
  owner: "",
  collectionAddress: "",
  page: "1",
  limit: "100",
  maxPages: "10"
};

type MintOrchestratorSigningPanelProps = {
  prefill?: {
    totalItems?: number;
    collectionAddress?: string;
  };
};

function truncateValue(value: string, size = 8): string {
  if (value.length <= size * 2 + 3) {
    return value;
  }

  return `${value.slice(0, size)}...${value.slice(-size)}`;
}

function toBatchItems(items: MintItemRecord[]): MintBatchItem[] {
  return items.map((item) => ({
    itemId: item.itemId,
    serial: item.serial,
    signature: item.signature,
    expectedAddress: item.expectedAddress
  }));
}

function deriveProgressFromJob(job: MintJobRecord): MintJobProgress {
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

async function parseApiResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

function getApiError(response: Response, payload: MintOrchestratorApiError | null, fallbackMessage: string): Error {
  if (payload?.error) {
    return new Error(payload.error);
  }

  if (!response.ok) {
    return new Error(`${fallbackMessage} (HTTP ${response.status})`);
  }

  return new Error(fallbackMessage);
}

export function MintOrchestratorSigningPanel({ prefill }: MintOrchestratorSigningPanelProps) {
  const initialTotalItems = prefill?.totalItems && prefill.totalItems > 0
    ? String(prefill.totalItems)
    : DEFAULT_CREATE_JOB_FORM.totalItems;
  const initialCollectionAddress = typeof prefill?.collectionAddress === "string"
    ? prefill.collectionAddress
    : DEFAULT_CREATE_JOB_FORM.collectionAddress;
  const [jobs, setJobs] = useState<MintJobWithProgress[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeBatch, setActiveBatch] = useState<{ batch: MintBatchRecord; items: MintItemRecord[] } | null>(null);
  const [submissionDrafts, setSubmissionDrafts] = useState<MintBatchSubmissionDrafts>({});
  const [createJobForm, setCreateJobForm] = useState<CreateJobFormState>({
    ...DEFAULT_CREATE_JOB_FORM,
    totalItems: initialTotalItems,
    collectionAddress: initialCollectionAddress
  });
  const [dasForm, setDasForm] = useState<DasReconcileFormState>(DEFAULT_DAS_FORM);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const selectedJob = useMemo(() => jobs.find((job) => job.jobId === selectedJobId) ?? null, [jobs, selectedJobId]);

  const updateJobState = useCallback((job: MintJobRecord, progress?: MintJobProgress) => {
    const nextJob: MintJobWithProgress = {
      ...job,
      progress: progress ?? deriveProgressFromJob(job)
    };

    setJobs((currentJobs) => {
      const existingIndex = currentJobs.findIndex((entry) => entry.jobId === nextJob.jobId);

      if (existingIndex < 0) {
        return [nextJob, ...currentJobs];
      }

      const nextJobs = [...currentJobs];
      nextJobs[existingIndex] = nextJob;
      return nextJobs;
    });
  }, []);

  const runAction = useCallback(async <T,>(action: Exclude<BusyAction, null>, task: () => Promise<T>): Promise<T | null> => {
    if (busyAction) {
      return null;
    }

    setBusyAction(action);
    setErrorMessage(null);

    try {
      const result = await task();
      return result;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected orchestrator error.");
      return null;
    } finally {
      setBusyAction(null);
    }
  }, [busyAction]);

  const refreshJobs = useCallback(async (): Promise<void> => {
    await runAction("refresh-jobs", async () => {
      const response = await fetch("/api/admin/mint-orchestrator/jobs?limit=20", {
        method: "GET"
      });
      const payload = await parseApiResponse<ListMintJobsResponse & MintOrchestratorApiError>(response);

      if (!response.ok || !Array.isArray(payload.jobs)) {
        throw getApiError(response, payload, "Could not fetch mint orchestrator jobs.");
      }

      setJobs(payload.jobs);

      if (payload.jobs.length === 0) {
        setSelectedJobId(null);
        return;
      }

      setSelectedJobId((currentSelectedJobId) => {
        if (currentSelectedJobId && payload.jobs.some((job) => job.jobId === currentSelectedJobId)) {
          return currentSelectedJobId;
        }

        return payload.jobs[0].jobId;
      });
    });
  }, [runAction]);

  const refreshSelectedJob = useCallback(async (): Promise<void> => {
    if (!selectedJobId) {
      return;
    }

    await runAction("refresh-job", async () => {
      const response = await fetch(`/api/admin/mint-orchestrator/jobs/${selectedJobId}`, {
        method: "GET"
      });
      const payload = await parseApiResponse<{ job?: MintJobRecord; progress?: MintJobProgress } & MintOrchestratorApiError>(response);

      if (!response.ok || !payload.job) {
        throw getApiError(response, payload, "Could not refresh selected mint job.");
      }

      updateJobState(payload.job, payload.progress);
      setLastActionMessage(`Refreshed job ${truncateValue(payload.job.jobId)}.`);
    });
  }, [runAction, selectedJobId, updateJobState]);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    setCreateJobForm((current) => ({
      ...current,
      totalItems: initialTotalItems,
      collectionAddress: initialCollectionAddress
    }));
  }, [initialCollectionAddress, initialTotalItems]);

  function updateCreateJobField<Key extends keyof CreateJobFormState>(field: Key, value: CreateJobFormState[Key]): void {
    setCreateJobForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateDasField<Key extends keyof DasReconcileFormState>(field: Key, value: DasReconcileFormState[Key]): void {
    setDasForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateSubmissionDraft(itemId: string, field: keyof MintBatchSubmissionDrafts[string], value: string): void {
    setSubmissionDrafts((current) => ({
      ...current,
      [itemId]: {
        signature: current[itemId]?.signature ?? "",
        expectedAddress: current[itemId]?.expectedAddress ?? "",
        [field]: value
      }
    }));
  }

  async function createMintJob(): Promise<void> {
    const totalItems = parsePositiveIntOrNull(createJobForm.totalItems);
    const batchSize = parsePositiveIntOrNull(createJobForm.batchSize);
    const startSerial = parsePositiveIntOrNull(createJobForm.startSerial);

    if (!totalItems || !batchSize || !startSerial) {
      setErrorMessage("totalItems, batchSize and startSerial must be positive integers.");
      return;
    }

    await runAction("create-job", async () => {
      const response = await fetch("/api/admin/mint-orchestrator/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalItems,
          batchSize,
          startSerial,
          collectionAddress: createJobForm.collectionAddress.trim() || undefined
        })
      });
      const payload = await parseApiResponse<CreateMintJobResponse & MintOrchestratorApiError>(response);

      if (!response.ok || !payload.job) {
        throw getApiError(response, payload, "Could not create mint job.");
      }

      updateJobState(payload.job, payload.progress);
      setSelectedJobId(payload.job.jobId);
      setActiveBatch(null);
      setSubmissionDrafts({});
      setLastActionMessage(`Created job ${truncateValue(payload.job.jobId)}.`);
    });
  }

  async function prepareNextBatch(): Promise<void> {
    if (!selectedJobId) {
      setErrorMessage("Select a job before preparing a batch.");
      return;
    }

    await runAction("prepare-batch", async () => {
      const response = await fetch(`/api/admin/mint-orchestrator/jobs/${selectedJobId}/next-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey.trim() || undefined
        })
      });
      const payload = await parseApiResponse<PrepareNextBatchResponse & MintOrchestratorApiError>(response);

      if (!response.ok || !payload.job || !payload.batch || !Array.isArray(payload.items)) {
        throw getApiError(response, payload, "Could not prepare next batch.");
      }

      updateJobState(payload.job, payload.progress);
      setActiveBatch({
        batch: payload.batch,
        items: payload.items
      });
      setSubmissionDrafts(createSubmissionDrafts(toBatchItems(payload.items)));
      setLastActionMessage(
        `Prepared batch #${payload.batch.batchNo} with ${payload.items.length} items.`
      );
    });
  }

  async function submitBatchSignatures(): Promise<void> {
    if (!selectedJobId || !activeBatch) {
      setErrorMessage("Prepare a batch before submitting signatures.");
      return;
    }

    let requestBody: ReturnType<typeof buildBatchSubmitPayload>;

    try {
      requestBody = buildBatchSubmitPayload(toBatchItems(activeBatch.items), submissionDrafts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not build submit payload.");
      return;
    }

    await runAction("submit-batch", async () => {
      const response = await fetch(
        `/api/admin/mint-orchestrator/jobs/${selectedJobId}/batches/${activeBatch.batch.batchNo}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        }
      );
      const payload = await parseApiResponse<SubmitBatchResponse & MintOrchestratorApiError>(response);

      if (!response.ok || !payload.job) {
        throw getApiError(response, payload, "Could not submit batch signatures.");
      }

      updateJobState(payload.job, payload.progress);
      setActiveBatch(null);
      setSubmissionDrafts({});
      setIdempotencyKey("");
      setLastActionMessage(
        `Submitted signatures for batch #${activeBatch.batch.batchNo}.`
      );
    });
  }

  async function reconcileRpc(): Promise<void> {
    if (!selectedJobId) {
      setErrorMessage("Select a job before RPC reconciliation.");
      return;
    }

    await runAction("reconcile-rpc", async () => {
      const response = await fetch(`/api/admin/mint-orchestrator/jobs/${selectedJobId}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const payload = await parseApiResponse<ReconcileRpcResponse & MintOrchestratorApiError>(response);

      if (!response.ok || !payload.job) {
        throw getApiError(response, payload, "Could not reconcile via RPC.");
      }

      updateJobState(payload.job, payload.progress);
      setLastActionMessage(
        `RPC reconcile checked ${payload.checkedSignatures} signatures and updated ${payload.updatedItems.length} items.`
      );
    });
  }

  async function reconcileDas(): Promise<void> {
    if (!selectedJobId) {
      setErrorMessage("Select a job before DAS reconciliation.");
      return;
    }

    const page = parsePositiveIntOrNull(dasForm.page);
    const limit = parsePositiveIntOrNull(dasForm.limit);
    const maxPages = parsePositiveIntOrNull(dasForm.maxPages);

    if (!page || !limit || !maxPages) {
      setErrorMessage("DAS page, limit and maxPages must be positive integers.");
      return;
    }

    await runAction("reconcile-das", async () => {
      const response = await fetch(`/api/admin/mint-orchestrator/jobs/${selectedJobId}/reconcile/das`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: dasForm.owner.trim() || undefined,
          collectionAddress: dasForm.collectionAddress.trim() || undefined,
          page,
          limit,
          maxPages
        })
      });
      const payload = await parseApiResponse<ReconcileDasResponse & MintOrchestratorApiError>(response);

      if (!response.ok || !payload.job || !payload.das) {
        throw getApiError(response, payload, "Could not reconcile via DAS.");
      }

      updateJobState(payload.job, payload.progress);
      setLastActionMessage(
        `DAS reconcile scanned ${payload.das.assetsScanned} assets, matched ${payload.das.matchedAssets}, resolved ${payload.das.resolvedSignatures}.`
      );
    });
  }

  const progressPercentage = useMemo(() => {
    if (!selectedJob || selectedJob.progress.totalItems === 0) {
      return 0;
    }

    return Math.round((selectedJob.progress.confirmed / selectedJob.progress.totalItems) * 100);
  }, [selectedJob]);

  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Mint Orchestrator Signing Console</h2>
        <p className="text-sm text-white/70">
          H6 flow: create job, prepare batch, submit signatures, and reconcile confirmations from devnet.
        </p>
      </div>

      {errorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-200">{errorMessage}</p> : null}
      {lastActionMessage ? (
        <p className="rounded-xl border border-cyan-400/30 bg-cyan-900/20 px-3 py-2 text-sm text-cyan-100">
          {lastActionMessage}
        </p>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">1. Create Mint Job</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-white/80">
            Total items
            <Input value={createJobForm.totalItems} onChange={(event) => updateCreateJobField("totalItems", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            Batch size
            <Input value={createJobForm.batchSize} onChange={(event) => updateCreateJobField("batchSize", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            Start serial
            <Input value={createJobForm.startSerial} onChange={(event) => updateCreateJobField("startSerial", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-white/80">
            Collection address (optional)
            <Input
              value={createJobForm.collectionAddress}
              onChange={(event) => updateCreateJobField("collectionAddress", event.target.value)}
              placeholder="Collection public key"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-11"
            onClick={() => {
              void createMintJob();
            }}
            disabled={busyAction !== null}
          >
            {busyAction === "create-job" ? "Creating..." : "Create Job"}
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => {
              void refreshJobs();
            }}
            disabled={busyAction !== null}
          >
            {busyAction === "refresh-jobs" ? "Refreshing..." : "Refresh Jobs"}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">2. Select Job</h3>
        {jobs.length === 0 ? (
          <p className="text-sm text-white/60">No jobs found yet.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => {
              const isSelected = job.jobId === selectedJobId;
              return (
                <div
                  key={job.jobId}
                  className={[
                    "rounded-xl border px-3 py-3",
                    isSelected ? "border-cyan-300/60 bg-cyan-900/20" : "border-white/15 bg-slate-900/30"
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">Job {truncateValue(job.jobId)}</p>
                    <span className="rounded-full border border-cyan-400/40 px-2 py-0.5 text-xs text-cyan-200">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    Progress {job.progress.confirmed}/{job.progress.totalItems} confirmed · {job.progress.failed} failed
                  </p>
                  <div className="mt-2">
                    <Button
                      variant={isSelected ? "primary" : "outline"}
                      className="min-h-11 w-full sm:w-auto"
                      onClick={() => {
                        setSelectedJobId(job.jobId);
                        setActiveBatch(null);
                        setSubmissionDrafts({});
                      }}
                      disabled={busyAction !== null}
                    >
                      {isSelected ? "Selected" : "Select Job"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedJob ? (
        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">3. Active Job Controls</h3>
          <div className="grid gap-2 text-sm text-white/80 sm:grid-cols-2">
            <p>Job ID: {truncateValue(selectedJob.jobId, 10)}</p>
            <p>Status: {selectedJob.status}</p>
            <p>Total items: {selectedJob.totalItems}</p>
            <p>Batch size: {selectedJob.batchSize}</p>
            <p>Confirmed: {selectedJob.progress.confirmed}</p>
            <p>Submitted: {selectedJob.progress.submitted}</p>
            <p>Failed: {selectedJob.progress.failed}</p>
            <p>Completion: {progressPercentage}%</p>
          </div>
          {selectedJob.lastError ? <p className="text-xs text-red-200">Last error: {selectedJob.lastError}</p> : null}

          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/30 p-3">
            <p className="text-sm text-white/80">Prepare next batch idempotently</p>
            <Input
              value={idempotencyKey}
              onChange={(event) => setIdempotencyKey(event.target.value)}
              placeholder="Optional idempotency key"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                className="min-h-11"
                onClick={() => {
                  void prepareNextBatch();
                }}
                disabled={busyAction !== null}
              >
                {busyAction === "prepare-batch" ? "Preparing..." : "Prepare Next Batch"}
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  void refreshSelectedJob();
                }}
                disabled={busyAction !== null}
              >
                {busyAction === "refresh-job" ? "Refreshing..." : "Refresh Job Snapshot"}
              </Button>
            </div>
          </div>

          {activeBatch ? (
            <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/30 p-3">
              <p className="text-sm font-medium text-white">
                Batch #{activeBatch.batch.batchNo} · {activeBatch.items.length} items
              </p>
              <div className="space-y-3">
                {activeBatch.items.map((item) => (
                  <div key={item.itemId} className="space-y-2 rounded-lg border border-white/10 bg-slate-900/50 p-3">
                    <p className="text-sm text-white">
                      Serial #{item.serial} · <span className="text-white/70">{truncateValue(item.itemId, 10)}</span>
                    </p>
                    <p className="text-xs text-white/60">Current status: {item.status}</p>
                    <label className="space-y-1 text-xs text-white/70">
                      Signature
                      <Input
                        value={submissionDrafts[item.itemId]?.signature ?? ""}
                        onChange={(event) => updateSubmissionDraft(item.itemId, "signature", event.target.value)}
                        placeholder="Tx signature"
                      />
                    </label>
                    <label className="space-y-1 text-xs text-white/70">
                      Expected address (optional)
                      <Input
                        value={submissionDrafts[item.itemId]?.expectedAddress ?? ""}
                        onChange={(event) => updateSubmissionDraft(item.itemId, "expectedAddress", event.target.value)}
                        placeholder="Minted asset address"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <Button
                className="min-h-11 w-full sm:w-auto"
                onClick={() => {
                  void submitBatchSignatures();
                }}
                disabled={busyAction !== null}
              >
                {busyAction === "submit-batch" ? "Submitting..." : "Submit Batch Signatures"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-white/60">No active batch prepared yet.</p>
          )}

          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/30 p-3">
            <p className="text-sm text-white/80">Reconciliation</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => {
                  void reconcileRpc();
                }}
                disabled={busyAction !== null}
              >
                {busyAction === "reconcile-rpc" ? "Reconciling RPC..." : "Reconcile RPC"}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-white/70">
                Owner (optional)
                <Input value={dasForm.owner} onChange={(event) => updateDasField("owner", event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-white/70">
                Collection (optional)
                <Input value={dasForm.collectionAddress} onChange={(event) => updateDasField("collectionAddress", event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-white/70">
                Page
                <Input value={dasForm.page} onChange={(event) => updateDasField("page", event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-white/70">
                Limit
                <Input value={dasForm.limit} onChange={(event) => updateDasField("limit", event.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-white/70 sm:col-span-2">
                Max pages
                <Input value={dasForm.maxPages} onChange={(event) => updateDasField("maxPages", event.target.value)} />
              </label>
            </div>
            <Button
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => {
                void reconcileDas();
              }}
              disabled={busyAction !== null}
            >
              {busyAction === "reconcile-das" ? "Reconciling DAS..." : "Reconcile DAS"}
            </Button>
          </div>
        </section>
      ) : null}
    </Card>
  );
}
