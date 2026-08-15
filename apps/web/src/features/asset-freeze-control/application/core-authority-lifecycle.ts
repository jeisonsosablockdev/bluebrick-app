import { randomUUID } from "node:crypto";

import {
  approveCollectionPluginAuthority,
  mplCore,
  revokeCollectionPluginAuthority,
  updateCollection
} from "@metaplex-foundation/mpl-core";
import {
  createNoopSigner,
  publicKey,
  signerIdentity,
  type Signer,
  type Umi
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { Connection, PublicKey as Web3PublicKey, VersionedTransaction } from "@solana/web3.js";
import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";
import {
  createKitRpcConnection,
  getSignatureStatusWithKitRpc,
  getTransactionWithKitRpc,
  type KitRpcConnection
} from "@/lib/solana-kit/compat/web3-transactions";

const MAX_SIGNED_TRANSACTIONS = 5;
const SIGNATURE_CONFIRM_TIMEOUT_MS = 180_000;
const SIGNATURE_CONFIRM_POLL_MS = 1_500;
const RATE_LIMIT_BACKOFF_INITIAL_MS = 750;
const RATE_LIMIT_BACKOFF_MAX_MS = 8_000;
const SEND_TX_MAX_RETRIES = 4;
const SEND_TX_RETRY_INITIAL_MS = 500;
const SEND_TX_RETRY_MAX_MS = 4_000;
const DEFAULT_COOLDOWN_SECONDS = 6 * 60 * 60;
const DEFAULT_REGULAR_THRESHOLD = 2;
const REVOKED_AUTHORITY_SENTINEL = "11111111111111111111111111111111";

const AUTHORITY_ROLES = ["transfer_delegate", "appdata_authority"] as const;
const AUTHORITY_OPERATIONS = ["rotate", "revoke", "emergency_rotate"] as const;
const EVENT_STATUSES = ["prepared", "submitted", "failed"] as const;

export type AuthorityRole = (typeof AUTHORITY_ROLES)[number];
export type AuthorityOperation = (typeof AUTHORITY_OPERATIONS)[number];
export type AuthorityLifecycleEventStatus = (typeof EVENT_STATUSES)[number];

export type AuthorityLifecycleTransactionKind =
  | "authority-rotate-transfer-delegate"
  | "authority-revoke-transfer-delegate"
  | "authority-emergency-rotate-transfer-delegate"
  | "authority-rotate-appdata-authority"
  | "authority-revoke-appdata-authority"
  | "authority-emergency-rotate-appdata-authority";

export type AuthorityMultisigEvidenceInput = {
  proposalId: unknown;
  proposer: unknown;
  executor: unknown;
  approverSigners: unknown;
  reason?: unknown;
  requestedAt?: unknown;
};

export type AuthorityMultisigEvidence = {
  proposalId: string;
  proposer: string;
  executor: string;
  approverSigners: string[];
  reason: string | null;
  requestedAt: string;
};

export type EvaluateAuthorityLifecycleTransitionInput = {
  role: AuthorityRole;
  operation: AuthorityOperation;
  currentAuthority: string;
  currentVersion: number;
  currentUpdatedAt: string;
  newAuthority?: string;
  multisig: AuthorityMultisigEvidence;
  now?: Date;
};

export type EvaluatedAuthorityLifecycleTransition = {
  role: AuthorityRole;
  operation: AuthorityOperation;
  targetAuthority: string;
  previousVersion: number;
  nextVersion: number;
  requiredThreshold: number;
  approvalCount: number;
  cooldownBypassed: boolean;
  cooldownRemainingSeconds: number;
};

export type PrepareAuthorityLifecycleInput = {
  payerPublicKey: string;
  collectionAddress: string;
  role: AuthorityRole;
  operation: AuthorityOperation;
  newAuthority?: string;
  multisig: AuthorityMultisigEvidenceInput;
};

type NormalizedPrepareAuthorityLifecycleInput = Omit<PrepareAuthorityLifecycleInput, "multisig"> & {
  multisig: AuthorityMultisigEvidence;
};

export type PreparedAuthorityLifecycleTransaction = {
  kind: AuthorityLifecycleTransactionKind;
  label: string;
  operationId: string;
  transactionBase64: string;
};

export type PreparedAuthorityLifecycleOperation = {
  network: "devnet";
  operationId: string;
  role: AuthorityRole;
  operation: AuthorityOperation;
  collectionAddress: string;
  currentAuthority: string;
  targetAuthority: string;
  authorityVersion: number;
  nextAuthorityVersion: number;
  requiredThreshold: number;
  approvalCount: number;
  cooldownBypassed: boolean;
  cooldownRemainingSeconds: number;
  multisig: AuthorityMultisigEvidence;
  preparedAt: string;
  transactions: PreparedAuthorityLifecycleTransaction[];
};

export type SubmitAuthorityLifecycleSignedTransactionInput = {
  kind: AuthorityLifecycleTransactionKind;
  operationId: string;
  transactionBase64: string;
};

export type SubmitAuthorityLifecycleSignedTransactionsInput = {
  expectedPayerPublicKey: string;
  operationId: string;
  signedTransactions: SubmitAuthorityLifecycleSignedTransactionInput[];
};

export type SubmittedAuthorityLifecycleTransaction = {
  kind: AuthorityLifecycleTransactionKind;
  operationId: string;
  signature: string;
};

export type SubmittedAuthorityLifecycleOperation = {
  operationId: string;
  role: AuthorityRole;
  operation: AuthorityOperation;
  collectionAddress: string;
  authorityVersion: number;
  authorityPublicKey: string;
  submittedAt: string;
  signatures: SubmittedAuthorityLifecycleTransaction[];
};

type AuthorityRegistryRecord = {
  role: AuthorityRole;
  collectionAddress: string;
  authorityPublicKey: string;
  authorityVersion: number;
  updatedBy: string;
  updatedAt: string;
  lastOperationId: string | null;
};

type AuthorityAuditEventRecord = {
  operationId: string;
  role: AuthorityRole;
  operation: AuthorityOperation;
  collectionAddress: string;
  previousAuthority: string;
  newAuthority: string;
  previousVersion: number;
  newVersion: number;
  multisigProposalId: string;
  proposer: string;
  executor: string;
  approverSigners: string[];
  approvalCount: number;
  requiredThreshold: number;
  cooldownBypassed: boolean;
  status: AuthorityLifecycleEventStatus;
  preparedTransactionKind: AuthorityLifecycleTransactionKind;
  signature: string | null;
  errorMessage: string | null;
  createdBy: string;
  preparedAt: string;
  submittedAt: string | null;
};

type AuthorityRegistryRow = {
  role: string;
  collection_address: string;
  authority_pubkey: string;
  authority_version: string | number;
  updated_by: string;
  updated_at: Date | string;
  last_operation_id: string | null;
};

type AuthorityAuditEventRow = {
  id: string;
  role: string;
  operation: string;
  collection_address: string;
  previous_authority: string;
  new_authority: string;
  previous_version: string | number;
  new_version: string | number;
  multisig_proposal_id: string;
  multisig_proposer: string;
  multisig_executor: string;
  multisig_approver_signers: unknown;
  multisig_approval_count: string | number;
  required_threshold: string | number;
  cooldown_bypassed: boolean;
  status: string;
  prepared_transaction_kind: string;
  signature: string | null;
  error_message: string | null;
  created_by: string;
  prepared_at: Date | string;
  submitted_at: Date | string | null;
};

const inMemoryRegistry = new Map<string, AuthorityRegistryRecord>();
const inMemoryAuditEvents = new Map<string, AuthorityAuditEventRecord>();

export type CoreAuthorityLifecycleSubmitRecoverableErrorCode = "BLOCKHASH_EXPIRED" | "CONFIRMATION_TIMEOUT";

export class CoreAuthorityLifecycleInputError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CoreAuthorityLifecycleInputError";
    this.status = status;
  }
}

export class CoreAuthorityLifecycleSubmitRecoverableError extends Error {
  readonly status: number;
  readonly code: CoreAuthorityLifecycleSubmitRecoverableErrorCode;

  constructor(message: string, code: CoreAuthorityLifecycleSubmitRecoverableErrorCode, status = 409) {
    super(message);
    this.name = "CoreAuthorityLifecycleSubmitRecoverableError";
    this.status = status;
    this.code = code;
  }
}

export function isCoreAuthorityLifecycleInputError(error: unknown): error is CoreAuthorityLifecycleInputError {
  return error instanceof CoreAuthorityLifecycleInputError;
}

export function isCoreAuthorityLifecycleSubmitRecoverableError(
  error: unknown
): error is CoreAuthorityLifecycleSubmitRecoverableError {
  return error instanceof CoreAuthorityLifecycleSubmitRecoverableError;
}

function toIso(value: Date | string | null): string {
  if (value === null) {
    return new Date(0).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new CoreAuthorityLifecycleInputError("Invalid timestamp in authority lifecycle record.");
  }

  return parsed.toISOString();
}

function asPositiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CoreAuthorityLifecycleInputError(`${name} must be a positive integer.`);
  }

  return parsed;
}

function isAuthorityRole(value: unknown): value is AuthorityRole {
  return typeof value === "string" && AUTHORITY_ROLES.includes(value as AuthorityRole);
}

function isAuthorityOperation(value: unknown): value is AuthorityOperation {
  return typeof value === "string" && AUTHORITY_OPERATIONS.includes(value as AuthorityOperation);
}

function isAuthorityLifecycleTransactionKind(value: unknown): value is AuthorityLifecycleTransactionKind {
  if (typeof value !== "string") {
    return false;
  }

  return (
    value === "authority-rotate-transfer-delegate"
    || value === "authority-revoke-transfer-delegate"
    || value === "authority-emergency-rotate-transfer-delegate"
    || value === "authority-rotate-appdata-authority"
    || value === "authority-revoke-appdata-authority"
    || value === "authority-emergency-rotate-appdata-authority"
  );
}

function assertNonEmptyString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new CoreAuthorityLifecycleInputError(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new CoreAuthorityLifecycleInputError(`${fieldName} is required.`);
  }

  if (trimmed.length > maxLength) {
    throw new CoreAuthorityLifecycleInputError(`${fieldName} exceeds max length (${maxLength}).`);
  }

  return trimmed;
}

function assertPublicKeyString(value: unknown, fieldName: string): string {
  const candidate = assertNonEmptyString(value, fieldName, 128);

  try {
    return new Web3PublicKey(candidate).toBase58();
  } catch {
    throw new CoreAuthorityLifecycleInputError(`${fieldName} must be a valid Solana public key.`);
  }
}

function parseAllowlistEnv(name: string): Set<string> | null {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return null;
  }

  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => assertPublicKeyString(entry, name));

  if (entries.length === 0) {
    return null;
  }

  return new Set(entries);
}

function assertAllowedAddress(address: string, allowlist: Set<string> | null, label: string): void {
  if (allowlist && !allowlist.has(address)) {
    throw new CoreAuthorityLifecycleInputError(`${label} is not allowed by server policy.`);
  }
}

function parseMultisigEvidence(raw: AuthorityMultisigEvidenceInput): AuthorityMultisigEvidence {
  const proposalId = assertNonEmptyString(raw.proposalId, "multisig.proposalId", 128);
  const proposer = assertPublicKeyString(raw.proposer, "multisig.proposer");
  const executor = assertPublicKeyString(raw.executor, "multisig.executor");

  if (!Array.isArray(raw.approverSigners) || raw.approverSigners.length === 0) {
    throw new CoreAuthorityLifecycleInputError("multisig.approverSigners must be a non-empty array.");
  }

  const uniqueApprovers = Array.from(new Set(
    raw.approverSigners.map((value, index) => assertPublicKeyString(value, `multisig.approverSigners[${index}]`))
  ));

  if (uniqueApprovers.length === 0) {
    throw new CoreAuthorityLifecycleInputError("multisig.approverSigners must include at least one unique signer.");
  }

  if (!uniqueApprovers.includes(executor)) {
    throw new CoreAuthorityLifecycleInputError("multisig.executor must be included in multisig.approverSigners.");
  }

  const proposerAllowlist = parseAllowlistEnv("SQUADS_PROPOSER_ALLOWLIST");
  const approverAllowlist = parseAllowlistEnv("SQUADS_APPROVER_ALLOWLIST");
  const executorAllowlist = parseAllowlistEnv("SQUADS_EXECUTOR_ALLOWLIST");

  assertAllowedAddress(proposer, proposerAllowlist, "multisig.proposer");
  assertAllowedAddress(executor, executorAllowlist, "multisig.executor");

  for (const approver of uniqueApprovers) {
    assertAllowedAddress(approver, approverAllowlist, "multisig.approverSigners[]");
  }

  const reason = raw.reason === undefined || raw.reason === null
    ? null
    : assertNonEmptyString(raw.reason, "multisig.reason", 512);

  const requestedAtCandidate = raw.requestedAt === undefined || raw.requestedAt === null
    ? new Date().toISOString()
    : assertNonEmptyString(raw.requestedAt, "multisig.requestedAt", 64);

  const requestedAt = new Date(requestedAtCandidate);
  if (Number.isNaN(requestedAt.getTime())) {
    throw new CoreAuthorityLifecycleInputError("multisig.requestedAt must be a valid ISO timestamp.");
  }

  return {
    proposalId,
    proposer,
    executor,
    approverSigners: uniqueApprovers,
    reason,
    requestedAt: requestedAt.toISOString()
  };
}

function getRegularThreshold(): number {
  return asPositiveInteger(process.env.SQUADS_MULTISIG_THRESHOLD, DEFAULT_REGULAR_THRESHOLD, "SQUADS_MULTISIG_THRESHOLD");
}

function getEmergencyThreshold(regularThreshold: number): number {
  return asPositiveInteger(
    process.env.SQUADS_EMERGENCY_MULTISIG_THRESHOLD,
    Math.max(regularThreshold + 1, 3),
    "SQUADS_EMERGENCY_MULTISIG_THRESHOLD"
  );
}

function getCooldownSeconds(): number {
  return asPositiveInteger(process.env.AUTHORITY_ROTATION_COOLDOWN_SECONDS, DEFAULT_COOLDOWN_SECONDS, "AUTHORITY_ROTATION_COOLDOWN_SECONDS");
}

function resolveRequiredThreshold(operation: AuthorityOperation): number {
  const regularThreshold = getRegularThreshold();
  if (operation === "emergency_rotate") {
    return getEmergencyThreshold(regularThreshold);
  }

  return regularThreshold;
}

function buildAuthorityTransactionKind(role: AuthorityRole, operation: AuthorityOperation): AuthorityLifecycleTransactionKind {
  if (role === "transfer_delegate") {
    if (operation === "rotate") {
      return "authority-rotate-transfer-delegate";
    }

    if (operation === "revoke") {
      return "authority-revoke-transfer-delegate";
    }

    return "authority-emergency-rotate-transfer-delegate";
  }

  if (operation === "rotate") {
    return "authority-rotate-appdata-authority";
  }

  if (operation === "revoke") {
    return "authority-revoke-appdata-authority";
  }

  return "authority-emergency-rotate-appdata-authority";
}

function buildRegistryKey(role: AuthorityRole, collectionAddress: string): string {
  return `${role}:${collectionAddress}`;
}

function mapRegistryRow(row: AuthorityRegistryRow): AuthorityRegistryRecord {
  if (!isAuthorityRole(row.role)) {
    throw new CoreAuthorityLifecycleInputError(`Unsupported authority role '${row.role}'.`);
  }

  return {
    role: row.role,
    collectionAddress: row.collection_address,
    authorityPublicKey: row.authority_pubkey,
    authorityVersion: Number(row.authority_version),
    updatedBy: row.updated_by,
    updatedAt: toIso(row.updated_at),
    lastOperationId: row.last_operation_id
  };
}

function parseApproverSigners(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((entry): entry is string => typeof entry === "string");
      }
    } catch {
      return [];
    }
  }

  return [];
}

function mapAuditEventRow(row: AuthorityAuditEventRow): AuthorityAuditEventRecord {
  if (!isAuthorityRole(row.role)) {
    throw new CoreAuthorityLifecycleInputError(`Unsupported audit event role '${row.role}'.`);
  }

  if (!isAuthorityOperation(row.operation)) {
    throw new CoreAuthorityLifecycleInputError(`Unsupported audit operation '${row.operation}'.`);
  }

  if (!EVENT_STATUSES.includes(row.status as AuthorityLifecycleEventStatus)) {
    throw new CoreAuthorityLifecycleInputError(`Unsupported audit status '${row.status}'.`);
  }

  if (!isAuthorityLifecycleTransactionKind(row.prepared_transaction_kind)) {
    throw new CoreAuthorityLifecycleInputError(`Unsupported transaction kind '${row.prepared_transaction_kind}'.`);
  }

  return {
    operationId: row.id,
    role: row.role,
    operation: row.operation,
    collectionAddress: row.collection_address,
    previousAuthority: row.previous_authority,
    newAuthority: row.new_authority,
    previousVersion: Number(row.previous_version),
    newVersion: Number(row.new_version),
    multisigProposalId: row.multisig_proposal_id,
    proposer: row.multisig_proposer,
    executor: row.multisig_executor,
    approverSigners: parseApproverSigners(row.multisig_approver_signers),
    approvalCount: Number(row.multisig_approval_count),
    requiredThreshold: Number(row.required_threshold),
    cooldownBypassed: Boolean(row.cooldown_bypassed),
    status: row.status as AuthorityLifecycleEventStatus,
    preparedTransactionKind: row.prepared_transaction_kind,
    signature: row.signature,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    preparedAt: toIso(row.prepared_at),
    submittedAt: row.submitted_at ? toIso(row.submitted_at) : null
  };
}

function isAuthorityLifecycleDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function getInitialAuthorityFromEnv(role: AuthorityRole): string {
  if (role === "transfer_delegate") {
    const value = process.env.SQUADS_TRANSFER_AUTHORITY?.trim();
    if (!value) {
      throw new CoreAuthorityLifecycleInputError("SQUADS_TRANSFER_AUTHORITY is required to bootstrap transfer_delegate authority.");
    }

    return assertPublicKeyString(value, "SQUADS_TRANSFER_AUTHORITY");
  }

  const appDataAuthority = process.env.SQUADS_APPDATA_AUTHORITY?.trim();
  if (appDataAuthority) {
    return assertPublicKeyString(appDataAuthority, "SQUADS_APPDATA_AUTHORITY");
  }

  const fallbackAuthority = process.env.SQUADS_TRANSFER_AUTHORITY?.trim();
  if (!fallbackAuthority) {
    throw new CoreAuthorityLifecycleInputError(
      "SQUADS_APPDATA_AUTHORITY or SQUADS_TRANSFER_AUTHORITY is required to bootstrap appdata_authority."
    );
  }

  return assertPublicKeyString(fallbackAuthority, "SQUADS_TRANSFER_AUTHORITY");
}

async function getRegistryRecord(
  role: AuthorityRole,
  collectionAddress: string,
  options?: { client?: PoolClient }
): Promise<AuthorityRegistryRecord | null> {
  if (!isAuthorityLifecycleDatabaseConfigured()) {
    return inMemoryRegistry.get(buildRegistryKey(role, collectionAddress)) ?? null;
  }

  const runQuery = async (client: PoolClient): Promise<AuthorityRegistryRecord | null> => {
    const result = await client.query<AuthorityRegistryRow>(
      `SELECT role, collection_address, authority_pubkey, authority_version, updated_by, updated_at, last_operation_id
       FROM authority_registry
       WHERE role = $1 AND collection_address = $2
       LIMIT 1`,
      [role, collectionAddress]
    );

    return result.rows[0] ? mapRegistryRow(result.rows[0]) : null;
  };

  if (options?.client) {
    return runQuery(options.client);
  }

  return withDbClient((client) => runQuery(client));
}

async function bootstrapRegistryRecord(input: {
  role: AuthorityRole;
  collectionAddress: string;
  authorityPublicKey: string;
  actor: string;
  nowIso: string;
  client?: PoolClient;
}): Promise<AuthorityRegistryRecord> {
  if (!isAuthorityLifecycleDatabaseConfigured()) {
    const record: AuthorityRegistryRecord = {
      role: input.role,
      collectionAddress: input.collectionAddress,
      authorityPublicKey: input.authorityPublicKey,
      authorityVersion: 1,
      updatedBy: input.actor,
      updatedAt: input.nowIso,
      lastOperationId: null
    };

    inMemoryRegistry.set(buildRegistryKey(input.role, input.collectionAddress), record);
    return record;
  }

  const runInsert = async (client: PoolClient): Promise<AuthorityRegistryRecord> => {
    await client.query(
      `INSERT INTO authority_registry (
         role,
         collection_address,
         authority_pubkey,
         authority_version,
         updated_by,
         updated_at,
         last_operation_id
       ) VALUES ($1, $2, $3, 1, $4, $5, NULL)
       ON CONFLICT (role, collection_address) DO NOTHING`,
      [input.role, input.collectionAddress, input.authorityPublicKey, input.actor, input.nowIso]
    );

    const loaded = await getRegistryRecord(input.role, input.collectionAddress, { client });
    if (!loaded) {
      throw new Error("Could not bootstrap authority registry.");
    }

    return loaded;
  };

  if (input.client) {
    return runInsert(input.client);
  }

  return withDbClient((client) => runInsert(client));
}

async function getOrBootstrapRegistryRecord(input: {
  role: AuthorityRole;
  collectionAddress: string;
  actor: string;
  nowIso: string;
}): Promise<AuthorityRegistryRecord> {
  const existing = await getRegistryRecord(input.role, input.collectionAddress);
  if (existing) {
    return existing;
  }

  const bootstrapAuthority = getInitialAuthorityFromEnv(input.role);
  return bootstrapRegistryRecord({
    role: input.role,
    collectionAddress: input.collectionAddress,
    authorityPublicKey: bootstrapAuthority,
    actor: input.actor,
    nowIso: input.nowIso
  });
}

async function insertPreparedAuditEvent(input: {
  operationId: string;
  role: AuthorityRole;
  operation: AuthorityOperation;
  collectionAddress: string;
  previousAuthority: string;
  newAuthority: string;
  previousVersion: number;
  newVersion: number;
  multisig: AuthorityMultisigEvidence;
  approvalCount: number;
  requiredThreshold: number;
  cooldownBypassed: boolean;
  preparedTransactionKind: AuthorityLifecycleTransactionKind;
  createdBy: string;
  preparedAt: string;
}): Promise<AuthorityAuditEventRecord> {
  const record: AuthorityAuditEventRecord = {
    operationId: input.operationId,
    role: input.role,
    operation: input.operation,
    collectionAddress: input.collectionAddress,
    previousAuthority: input.previousAuthority,
    newAuthority: input.newAuthority,
    previousVersion: input.previousVersion,
    newVersion: input.newVersion,
    multisigProposalId: input.multisig.proposalId,
    proposer: input.multisig.proposer,
    executor: input.multisig.executor,
    approverSigners: input.multisig.approverSigners,
    approvalCount: input.approvalCount,
    requiredThreshold: input.requiredThreshold,
    cooldownBypassed: input.cooldownBypassed,
    status: "prepared",
    preparedTransactionKind: input.preparedTransactionKind,
    signature: null,
    errorMessage: null,
    createdBy: input.createdBy,
    preparedAt: input.preparedAt,
    submittedAt: null
  };

  if (!isAuthorityLifecycleDatabaseConfigured()) {
    inMemoryAuditEvents.set(record.operationId, record);
    return record;
  }

  return withDbClient(async (client) => {
    const result = await client.query<AuthorityAuditEventRow>(
      `INSERT INTO authority_audit_events (
         id,
         role,
         operation,
         collection_address,
         previous_authority,
         new_authority,
         previous_version,
         new_version,
         multisig_proposal_id,
         multisig_proposer,
         multisig_executor,
         multisig_approver_signers,
         multisig_approval_count,
         required_threshold,
         cooldown_bypassed,
         status,
         prepared_transaction_kind,
         signature,
         error_message,
         created_by,
         prepared_at,
         submitted_at
       ) VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         $9,
         $10,
         $11,
         $12::jsonb,
         $13,
         $14,
         $15,
         'prepared',
         $16,
         NULL,
         NULL,
         $17,
         $18,
         NULL
       )
       RETURNING *`,
      [
        record.operationId,
        record.role,
        record.operation,
        record.collectionAddress,
        record.previousAuthority,
        record.newAuthority,
        record.previousVersion,
        record.newVersion,
        record.multisigProposalId,
        record.proposer,
        record.executor,
        JSON.stringify(record.approverSigners),
        record.approvalCount,
        record.requiredThreshold,
        record.cooldownBypassed,
        record.preparedTransactionKind,
        record.createdBy,
        record.preparedAt
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("Could not persist authority lifecycle audit event.");
    }

    return mapAuditEventRow(row);
  });
}

async function getPreparedAuditEvent(operationId: string): Promise<AuthorityAuditEventRecord | null> {
  if (!isAuthorityLifecycleDatabaseConfigured()) {
    return inMemoryAuditEvents.get(operationId) ?? null;
  }

  return withDbClient(async (client) => {
    const result = await client.query<AuthorityAuditEventRow>(
      `SELECT *
       FROM authority_audit_events
       WHERE id = $1
       LIMIT 1`,
      [operationId]
    );

    if (!result.rows[0]) {
      return null;
    }

    return mapAuditEventRow(result.rows[0]);
  });
}

function createServerUmi(payerPublicKey: string): { umi: Umi; payerSigner: Signer } {
  const umi = createUmi(getSolanaRpcUrl()).use(mplCore());
  const payerSigner = createNoopSigner(publicKey(payerPublicKey));
  umi.use(signerIdentity(payerSigner, true));

  return { umi, payerSigner };
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(base64Value: string): Buffer {
  try {
    return Buffer.from(base64Value, "base64");
  } catch {
    throw new CoreAuthorityLifecycleInputError("transactionBase64 is not valid base64.");
  }
}

type TransactionBuilderLike = {
  buildAndSign: (umi: Umi) => Promise<unknown>;
  setBlockhash?: (blockhash: any) => TransactionBuilderLike;
};

async function serializeSignedBuilderTransaction(
  umi: Umi,
  builderOrPromise: Promise<TransactionBuilderLike> | TransactionBuilderLike,
  blockhash?: unknown
): Promise<string> {
  const builder = await Promise.resolve(builderOrPromise);
  const builderWithBlockhash = blockhash && typeof builder.setBlockhash === "function"
    ? builder.setBlockhash(blockhash)
    : builder;

  const umiTransaction = await builderWithBlockhash.buildAndSign(umi);
  const web3Transaction = toWeb3JsTransaction(umiTransaction as never);
  return toBase64(web3Transaction.serialize());
}

function parseSignedTransaction(transactionBase64: string): VersionedTransaction {
  const raw = fromBase64(transactionBase64);
  if (!raw.length) {
    throw new CoreAuthorityLifecycleInputError("transactionBase64 cannot be empty.");
  }

  try {
    return VersionedTransaction.deserialize(raw);
  } catch {
    throw new CoreAuthorityLifecycleInputError("Signed transaction payload is invalid.");
  }
}

function assertPayerMatches(transaction: VersionedTransaction, expectedPayerPublicKey: string): void {
  const payer = transaction.message.staticAccountKeys[0];
  if (!payer || !(payer instanceof Web3PublicKey)) {
    throw new CoreAuthorityLifecycleInputError("Could not determine transaction payer.");
  }

  if (payer.toBase58() !== expectedPayerPublicKey) {
    throw new CoreAuthorityLifecycleInputError("Signed transaction payer does not match authenticated admin.", 403);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientRpcError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("429")
    || message.includes("too many requests")
    || message.includes("fetch failed")
    || message.includes("failed to fetch")
    || message.includes("timed out")
    || message.includes("timeout")
    || message.includes("socket hang up")
    || message.includes("econnreset")
    || message.includes("etimedout");
}

function isBlockhashExpiredRpcError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes("blockhash not found");
}

async function sendRawTransactionWithRetry(connection: Connection, serializedTransaction: Uint8Array): Promise<string> {
  let attempt = 0;
  let delayMs = SEND_TX_RETRY_INITIAL_MS;

  while (attempt <= SEND_TX_MAX_RETRIES) {
    try {
      return await connection.sendRawTransaction(serializedTransaction, {
        skipPreflight: true,
        maxRetries: 3
      });
    } catch (error) {
      if (isBlockhashExpiredRpcError(error)) {
        throw new CoreAuthorityLifecycleSubmitRecoverableError(
          "Transaction blockhash expired before submission. Prepare and sign fresh transactions.",
          "BLOCKHASH_EXPIRED"
        );
      }

      if (!isTransientRpcError(error) || attempt === SEND_TX_MAX_RETRIES) {
        throw error;
      }

      await sleep(delayMs);
      delayMs = Math.min(SEND_TX_RETRY_MAX_MS, delayMs * 2);
      attempt += 1;
    }
  }

  throw new Error("Could not send authority lifecycle transaction after retry attempts.");
}

async function waitForConfirmedSignature(rpc: KitRpcConnection, signature: string): Promise<void> {
  const startedAt = Date.now();
  let rateLimitBackoffMs = RATE_LIMIT_BACKOFF_INITIAL_MS;

  while (Date.now() - startedAt < SIGNATURE_CONFIRM_TIMEOUT_MS) {
    let status: Awaited<ReturnType<typeof getSignatureStatusWithKitRpc>> = null;
    try {
      status = await getSignatureStatusWithKitRpc(rpc, signature);
      rateLimitBackoffMs = RATE_LIMIT_BACKOFF_INITIAL_MS;
    } catch (error) {
      if (!isTransientRpcError(error)) {
        throw error;
      }

      await sleep(rateLimitBackoffMs);
      rateLimitBackoffMs = Math.min(RATE_LIMIT_BACKOFF_MAX_MS, rateLimitBackoffMs * 2);
      continue;
    }

    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return;
    }

    await sleep(SIGNATURE_CONFIRM_POLL_MS);
  }

  let finalStatus: Awaited<ReturnType<typeof getSignatureStatusWithKitRpc>> = null;
  try {
    finalStatus = await getSignatureStatusWithKitRpc(rpc, signature, { searchTransactionHistory: true });
  } catch (error) {
    if (!isTransientRpcError(error)) {
      throw error;
    }
  }

  if (finalStatus?.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(finalStatus.err)}`);
  }

  if (finalStatus?.confirmationStatus === "confirmed" || finalStatus?.confirmationStatus === "finalized") {
    return;
  }

  try {
    const transaction = await getTransactionWithKitRpc(rpc, signature, "confirmed");

    if (transaction?.meta?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(transaction.meta.err)}`);
    }

    if (transaction) {
      return;
    }
  } catch (error) {
    if (!isTransientRpcError(error)) {
      throw error;
    }
  }

  throw new CoreAuthorityLifecycleSubmitRecoverableError(
    `Timed out waiting for signature confirmation: ${signature}. Verify the signature and retry pending operations only.`,
    "CONFIRMATION_TIMEOUT",
    409
  );
}

function parsePrepareInput(raw: PrepareAuthorityLifecycleInput): NormalizedPrepareAuthorityLifecycleInput {
  const payerPublicKey = assertPublicKeyString(raw.payerPublicKey, "payerPublicKey");
  const collectionAddress = assertPublicKeyString(raw.collectionAddress, "collectionAddress");

  if (!isAuthorityRole(raw.role)) {
    throw new CoreAuthorityLifecycleInputError("role must be one of: transfer_delegate, appdata_authority.");
  }

  if (!isAuthorityOperation(raw.operation)) {
    throw new CoreAuthorityLifecycleInputError("operation must be one of: rotate, revoke, emergency_rotate.");
  }

  const multisig = parseMultisigEvidence(raw.multisig as AuthorityMultisigEvidenceInput);

  const newAuthority = raw.newAuthority === undefined || raw.newAuthority === null
    ? undefined
    : assertPublicKeyString(raw.newAuthority, "newAuthority");

  return {
    payerPublicKey,
    collectionAddress,
    role: raw.role,
    operation: raw.operation,
    newAuthority,
    multisig
  };
}

function parseSubmitInput(raw: SubmitAuthorityLifecycleSignedTransactionsInput): SubmitAuthorityLifecycleSignedTransactionsInput {
  const expectedPayerPublicKey = assertPublicKeyString(raw.expectedPayerPublicKey, "expectedPayerPublicKey");
  const operationId = assertNonEmptyString(raw.operationId, "operationId", 64);

  if (!Array.isArray(raw.signedTransactions) || raw.signedTransactions.length === 0) {
    throw new CoreAuthorityLifecycleInputError("signedTransactions must be a non-empty array.");
  }

  if (raw.signedTransactions.length > MAX_SIGNED_TRANSACTIONS) {
    throw new CoreAuthorityLifecycleInputError(`signedTransactions exceeds max value (${MAX_SIGNED_TRANSACTIONS}).`);
  }

  const signedTransactions = raw.signedTransactions.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new CoreAuthorityLifecycleInputError(`signedTransactions[${index}] must be an object.`);
    }

    if (!isAuthorityLifecycleTransactionKind(entry.kind)) {
      throw new CoreAuthorityLifecycleInputError(`signedTransactions[${index}].kind is invalid.`);
    }

    const txOperationId = assertNonEmptyString(entry.operationId, `signedTransactions[${index}].operationId`, 64);
    const transactionBase64 = assertNonEmptyString(
      entry.transactionBase64,
      `signedTransactions[${index}].transactionBase64`,
      200_000
    );

    return {
      kind: entry.kind,
      operationId: txOperationId,
      transactionBase64
    };
  });

  return {
    expectedPayerPublicKey,
    operationId,
    signedTransactions
  };
}

export function evaluateAuthorityLifecycleTransition(
  input: EvaluateAuthorityLifecycleTransitionInput
): EvaluatedAuthorityLifecycleTransition {
  const now = input.now ?? new Date();
  const requiredThreshold = resolveRequiredThreshold(input.operation);
  const approvalCount = input.multisig.approverSigners.length;

  if (approvalCount < requiredThreshold) {
    throw new CoreAuthorityLifecycleInputError(
      `multisig approvals (${approvalCount}) do not meet required threshold (${requiredThreshold}) for ${input.operation}.`
    );
  }

  const cooldownBypassed = input.operation === "emergency_rotate";
  let cooldownRemainingSeconds = 0;

  if (!cooldownBypassed) {
    const cooldownSeconds = getCooldownSeconds();
    const lastUpdated = new Date(input.currentUpdatedAt);

    if (Number.isNaN(lastUpdated.getTime())) {
      throw new CoreAuthorityLifecycleInputError("currentUpdatedAt must be a valid ISO timestamp.");
    }

    const elapsedSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    if (elapsedSeconds < cooldownSeconds) {
      cooldownRemainingSeconds = cooldownSeconds - elapsedSeconds;
      throw new CoreAuthorityLifecycleInputError(
        `Authority cooldown still active for ${cooldownRemainingSeconds} seconds; use emergency_rotate with elevated quorum if immediate action is required.`
      );
    }
  }

  const normalizedCurrentAuthority = assertPublicKeyString(input.currentAuthority, "currentAuthority");

  let targetAuthority = REVOKED_AUTHORITY_SENTINEL;
  if (input.operation === "rotate" || input.operation === "emergency_rotate") {
    if (!input.newAuthority) {
      throw new CoreAuthorityLifecycleInputError("newAuthority is required for rotate operations.");
    }

    targetAuthority = assertPublicKeyString(input.newAuthority, "newAuthority");
  }

  if (targetAuthority === normalizedCurrentAuthority) {
    throw new CoreAuthorityLifecycleInputError("new authority must differ from current authority.");
  }

  const nextVersion = input.currentVersion + 1;
  if (!Number.isInteger(nextVersion) || nextVersion <= input.currentVersion) {
    throw new CoreAuthorityLifecycleInputError("authority_version must be monotonic.");
  }

  return {
    role: input.role,
    operation: input.operation,
    targetAuthority,
    previousVersion: input.currentVersion,
    nextVersion,
    requiredThreshold,
    approvalCount,
    cooldownBypassed,
    cooldownRemainingSeconds
  };
}

export async function prepareAuthorityLifecycleOperation(rawInput: PrepareAuthorityLifecycleInput): Promise<PreparedAuthorityLifecycleOperation> {
  const input = parsePrepareInput(rawInput);
  const now = new Date();
  const nowIso = now.toISOString();
  const registry = await getOrBootstrapRegistryRecord({
    role: input.role,
    collectionAddress: input.collectionAddress,
    actor: input.payerPublicKey,
    nowIso
  });

  const transition = evaluateAuthorityLifecycleTransition({
    role: input.role,
    operation: input.operation,
    currentAuthority: registry.authorityPublicKey,
    currentVersion: registry.authorityVersion,
    currentUpdatedAt: registry.updatedAt,
    newAuthority: input.newAuthority,
    multisig: input.multisig,
    now
  });

  const { umi, payerSigner } = createServerUmi(input.payerPublicKey);
  const latestBlockhash = await umi.rpc.getLatestBlockhash();

  const collection = publicKey(input.collectionAddress);
  const targetAuthority = transition.targetAuthority;

  const builder = input.role === "transfer_delegate"
    ? (
      input.operation === "revoke"
        ? revokeCollectionPluginAuthority(umi, {
          collection,
          authority: payerSigner,
          plugin: {
            type: "PermanentTransferDelegate"
          }
        })
        : approveCollectionPluginAuthority(umi, {
          collection,
          authority: payerSigner,
          plugin: {
            type: "PermanentTransferDelegate"
          },
          newAuthority: {
            type: "Address",
            address: publicKey(targetAuthority)
          }
        })
    )
    : updateCollection(umi, {
      collection,
      authority: payerSigner,
      newUpdateAuthority: publicKey(targetAuthority)
    });

  const operationId = randomUUID();
  const transactionKind = buildAuthorityTransactionKind(input.role, input.operation);
  const transactionBase64 = await serializeSignedBuilderTransaction(umi, builder, latestBlockhash);
  const label = `${input.operation} ${input.role}`;

  await insertPreparedAuditEvent({
    operationId,
    role: input.role,
    operation: input.operation,
    collectionAddress: input.collectionAddress,
    previousAuthority: registry.authorityPublicKey,
    newAuthority: targetAuthority,
    previousVersion: transition.previousVersion,
    newVersion: transition.nextVersion,
    multisig: input.multisig,
    approvalCount: transition.approvalCount,
    requiredThreshold: transition.requiredThreshold,
    cooldownBypassed: transition.cooldownBypassed,
    preparedTransactionKind: transactionKind,
    createdBy: input.payerPublicKey,
    preparedAt: nowIso
  });

  return {
    network: "devnet",
    operationId,
    role: input.role,
    operation: input.operation,
    collectionAddress: input.collectionAddress,
    currentAuthority: registry.authorityPublicKey,
    targetAuthority,
    authorityVersion: transition.previousVersion,
    nextAuthorityVersion: transition.nextVersion,
    requiredThreshold: transition.requiredThreshold,
    approvalCount: transition.approvalCount,
    cooldownBypassed: transition.cooldownBypassed,
    cooldownRemainingSeconds: transition.cooldownRemainingSeconds,
    multisig: input.multisig,
    preparedAt: nowIso,
    transactions: [
      {
        kind: transactionKind,
        label,
        operationId,
        transactionBase64
      }
    ]
  };
}

export async function submitAuthorityLifecycleSignedTransactions(
  rawInput: SubmitAuthorityLifecycleSignedTransactionsInput
): Promise<SubmittedAuthorityLifecycleOperation> {
  const input = parseSubmitInput(rawInput);
  const audit = await getPreparedAuditEvent(input.operationId);

  if (!audit) {
    throw new CoreAuthorityLifecycleInputError("operationId not found.", 404);
  }

  if (audit.status !== "prepared") {
    throw new CoreAuthorityLifecycleInputError(`operationId is in status '${audit.status}' and cannot be submitted.`);
  }

  const signatures: SubmittedAuthorityLifecycleTransaction[] = [];
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const rpc = createKitRpcConnection(getSolanaRpcUrl());

  for (const signed of input.signedTransactions) {
    if (signed.operationId !== input.operationId) {
      throw new CoreAuthorityLifecycleInputError("signed transaction operationId mismatch.");
    }

    if (signed.kind !== audit.preparedTransactionKind) {
      throw new CoreAuthorityLifecycleInputError(
        `signed transaction kind '${signed.kind}' does not match prepared kind '${audit.preparedTransactionKind}'.`
      );
    }

    const transaction = parseSignedTransaction(signed.transactionBase64);
    assertPayerMatches(transaction, input.expectedPayerPublicKey);

    const serializedTransaction = transaction.serialize();
    const signature = await sendRawTransactionWithRetry(connection, serializedTransaction);
    await waitForConfirmedSignature(rpc, signature);

    signatures.push({
      kind: signed.kind,
      operationId: signed.operationId,
      signature
    });
  }

  const submittedAt = new Date().toISOString();

  if (!isAuthorityLifecycleDatabaseConfigured()) {
    const registryKey = buildRegistryKey(audit.role, audit.collectionAddress);
    const registry = inMemoryRegistry.get(registryKey);
    if (!registry) {
      throw new Error("Authority registry record is missing during submit.");
    }

    if (registry.authorityVersion !== audit.previousVersion) {
      throw new CoreAuthorityLifecycleInputError(
        `authority_version conflict: expected ${audit.previousVersion}, found ${registry.authorityVersion}.`,
        409
      );
    }

    const updatedRegistry: AuthorityRegistryRecord = {
      ...registry,
      authorityPublicKey: audit.newAuthority,
      authorityVersion: audit.newVersion,
      updatedBy: input.expectedPayerPublicKey,
      updatedAt: submittedAt,
      lastOperationId: audit.operationId
    };
    inMemoryRegistry.set(registryKey, updatedRegistry);

    inMemoryAuditEvents.set(audit.operationId, {
      ...audit,
      status: "submitted",
      signature: signatures[0]?.signature ?? null,
      submittedAt
    });

    return {
      operationId: audit.operationId,
      role: audit.role,
      operation: audit.operation,
      collectionAddress: audit.collectionAddress,
      authorityVersion: updatedRegistry.authorityVersion,
      authorityPublicKey: updatedRegistry.authorityPublicKey,
      submittedAt,
      signatures
    };
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const registryResult = await client.query<AuthorityRegistryRow>(
        `SELECT role, collection_address, authority_pubkey, authority_version, updated_by, updated_at, last_operation_id
         FROM authority_registry
         WHERE role = $1 AND collection_address = $2
         FOR UPDATE`,
        [audit.role, audit.collectionAddress]
      );

      const registryRow = registryResult.rows[0];
      if (!registryRow) {
        throw new Error("Authority registry record is missing during submit.");
      }

      const registry = mapRegistryRow(registryRow);
      if (registry.authorityVersion !== audit.previousVersion) {
        throw new CoreAuthorityLifecycleInputError(
          `authority_version conflict: expected ${audit.previousVersion}, found ${registry.authorityVersion}.`,
          409
        );
      }

      await client.query(
        `UPDATE authority_registry
         SET authority_pubkey = $1,
             authority_version = $2,
             updated_by = $3,
             updated_at = $4,
             last_operation_id = $5
         WHERE role = $6 AND collection_address = $7`,
        [
          audit.newAuthority,
          audit.newVersion,
          input.expectedPayerPublicKey,
          submittedAt,
          audit.operationId,
          audit.role,
          audit.collectionAddress
        ]
      );

      await client.query(
        `UPDATE authority_audit_events
         SET status = 'submitted',
             signature = $1,
             submitted_at = $2,
             error_message = NULL
         WHERE id = $3`,
        [signatures[0]?.signature ?? null, submittedAt, audit.operationId]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    return {
      operationId: audit.operationId,
      role: audit.role,
      operation: audit.operation,
      collectionAddress: audit.collectionAddress,
      authorityVersion: audit.newVersion,
      authorityPublicKey: audit.newAuthority,
      submittedAt,
      signatures
    };
  });
}
