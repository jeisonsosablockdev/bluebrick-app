import { randomUUID } from "node:crypto";

import { withDbClient } from "@/lib/db/pool";
import type { StakeProductAction } from "@/lib/stake-attempts-repository";

export type StakeProfileValidationStatus = "pending" | "validated" | "reconcile_pending" | "rejected";

export type StakeProfileEventRecord = {
  id: string;
  webhookEventId: string | null;
  assetAddress: string;
  ownerWallet: string;
  collectionAddress: string;
  candyMachineAddress: string;
  propertyId: string;
  propertyTitle: string;
  productAction: StakeProductAction;
  blockchainAction: "freeze" | "unfreeze";
  txSignature: string;
  instructionIndex: number;
  slot: number | null;
  canonicalTimezone: string;
  blockTime: string | null;
  observedAt: string;
  validationStatus: StakeProfileValidationStatus;
  validationError: string | null;
  createdAt: string;
};

type StakeProfileEventRow = {
  id: string;
  webhook_event_id: string | null;
  asset_address: string;
  owner_wallet: string;
  collection_address: string;
  candy_machine_address: string;
  property_id: string;
  property_title: string;
  product_action: StakeProductAction;
  blockchain_action: "freeze" | "unfreeze";
  tx_signature: string;
  instruction_index: number;
  slot: string | number | null;
  canonical_timezone: string;
  block_time: string | Date | null;
  observed_at: string | Date;
  validation_status: StakeProfileValidationStatus;
  validation_error: string | null;
  created_at: string | Date;
};

type UpsertStakeProfileEventInput = {
  webhookEventId?: string | null;
  assetAddress: string;
  ownerWallet: string;
  collectionAddress: string;
  candyMachineAddress: string;
  propertyId: string;
  propertyTitle: string;
  productAction: StakeProductAction;
  txSignature: string;
  instructionIndex: number;
  slot: number | null;
  blockTime: string | null;
  observedAt: string;
  validationStatus: StakeProfileValidationStatus;
  validationError?: string | null;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function assertNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function parseOptionalIso(value: string | Date | null): string | null {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function mapRow(row: StakeProfileEventRow): StakeProfileEventRecord {
  return {
    id: row.id,
    webhookEventId: row.webhook_event_id,
    assetAddress: row.asset_address,
    ownerWallet: row.owner_wallet,
    collectionAddress: row.collection_address,
    candyMachineAddress: row.candy_machine_address,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    productAction: row.product_action,
    blockchainAction: row.blockchain_action,
    txSignature: row.tx_signature,
    instructionIndex: Number(row.instruction_index),
    slot: row.slot === null ? null : Number(row.slot),
    canonicalTimezone: row.canonical_timezone,
    blockTime: parseOptionalIso(row.block_time),
    observedAt: parseOptionalIso(row.observed_at) ?? new Date().toISOString(),
    validationStatus: row.validation_status,
    validationError: row.validation_error,
    createdAt: parseOptionalIso(row.created_at) ?? new Date().toISOString()
  };
}

const inMemoryStakeProfileEvents = new Map<string, StakeProfileEventRecord>();

function inMemoryKey(input: { txSignature: string; assetAddress: string; blockchainAction: string; instructionIndex: number }): string {
  return `${input.txSignature}:${input.assetAddress}:${input.blockchainAction}:${input.instructionIndex}`;
}

export async function upsertStakeProfileEvent(input: UpsertStakeProfileEventInput): Promise<StakeProfileEventRecord> {
  const assetAddress = assertNonEmpty(input.assetAddress, "assetAddress");
  const ownerWallet = assertNonEmpty(input.ownerWallet, "ownerWallet");
  const collectionAddress = assertNonEmpty(input.collectionAddress, "collectionAddress");
  const candyMachineAddress = assertNonEmpty(input.candyMachineAddress, "candyMachineAddress");
  const propertyId = assertNonEmpty(input.propertyId, "propertyId");
  const propertyTitle = assertNonEmpty(input.propertyTitle, "propertyTitle");
  const txSignature = assertNonEmpty(input.txSignature, "txSignature");
  const observedAt = assertNonEmpty(input.observedAt, "observedAt");
  const blockchainAction = input.productAction === "stake" ? "freeze" : "unfreeze";
  const instructionIndex = Number.isInteger(input.instructionIndex) ? input.instructionIndex : 0;

  if (!isDatabaseConfigured()) {
    const now = new Date().toISOString();
    const key = inMemoryKey({ txSignature, assetAddress, blockchainAction, instructionIndex });
    const existing = inMemoryStakeProfileEvents.get(key);
    const record: StakeProfileEventRecord = {
      id: existing?.id ?? randomUUID(),
      webhookEventId: input.webhookEventId ?? existing?.webhookEventId ?? null,
      assetAddress,
      ownerWallet,
      collectionAddress,
      candyMachineAddress,
      propertyId,
      propertyTitle,
      productAction: input.productAction,
      blockchainAction,
      txSignature,
      instructionIndex,
      slot: input.slot,
      canonicalTimezone: "America/Bogota",
      blockTime: input.blockTime,
      observedAt,
      validationStatus: input.validationStatus,
      validationError: input.validationError ?? null,
      createdAt: existing?.createdAt ?? now
    };
    inMemoryStakeProfileEvents.set(key, record);
    return record;
  }

  return withDbClient(async (client) => {
    const result = await client.query<StakeProfileEventRow>(
      `INSERT INTO user_profile_stake_events (
         id,
         webhook_event_id,
         asset_address,
         owner_wallet,
         collection_address,
         candy_machine_address,
         property_id,
         property_title,
         product_action,
         blockchain_action,
         tx_signature,
         instruction_index,
         slot,
         canonical_timezone,
         block_time,
         observed_at,
         validation_status,
         validation_error
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'America/Bogota', $14, $15, $16, $17
       )
       ON CONFLICT (tx_signature, asset_address, blockchain_action, instruction_index) DO UPDATE
       SET webhook_event_id = COALESCE(EXCLUDED.webhook_event_id, user_profile_stake_events.webhook_event_id),
           slot = COALESCE(EXCLUDED.slot, user_profile_stake_events.slot),
           block_time = COALESCE(EXCLUDED.block_time, user_profile_stake_events.block_time),
           observed_at = EXCLUDED.observed_at,
           validation_status = EXCLUDED.validation_status,
           validation_error = EXCLUDED.validation_error
       RETURNING *`,
      [
        randomUUID(),
        input.webhookEventId ?? null,
        assetAddress,
        ownerWallet,
        collectionAddress,
        candyMachineAddress,
        propertyId,
        propertyTitle,
        input.productAction,
        blockchainAction,
        txSignature,
        instructionIndex,
        input.slot,
        input.blockTime,
        observedAt,
        input.validationStatus,
        input.validationError ?? null
      ]
    );

    return mapRow(result.rows[0] as StakeProfileEventRow);
  });
}

export async function listStakeProfileEventsByWallet(walletPublicKey: string): Promise<StakeProfileEventRecord[]> {
  const wallet = assertNonEmpty(walletPublicKey, "walletPublicKey");

  if (!isDatabaseConfigured()) {
    return Array.from(inMemoryStakeProfileEvents.values())
      .filter((event) => event.ownerWallet === wallet)
      .sort((left, right) => right.observedAt.localeCompare(left.observedAt));
  }

  return withDbClient(async (client) => {
    const result = await client.query<StakeProfileEventRow>(
      `SELECT *
       FROM user_profile_stake_events
       WHERE owner_wallet = $1
       ORDER BY COALESCE(block_time, observed_at) DESC, created_at DESC`,
      [wallet]
    );

    return result.rows.map((row) => mapRow(row));
  });
}

