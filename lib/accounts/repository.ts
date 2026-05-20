import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";

export type AccountCreatedVia = "wallet" | "federated" | "migration";

export type AccountRecord = {
  id: string;
  createdVia: AccountCreatedVia;
  primaryWalletPublicKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WalletIdentityRecord = {
  walletPublicKey: string;
  accountId: string;
  isPrimary: boolean;
  linkedAt: string;
  lastAuthenticatedAt: string | null;
};

export type FederatedIdentityRecord = {
  workosUserId: string;
  accountId: string;
  provider: "workos";
  email: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AccountIdentityBundle = {
  account: AccountRecord;
  walletIdentities: WalletIdentityRecord[];
  federatedIdentities: FederatedIdentityRecord[];
};

export type EnsureFederatedAccountInput = {
  workosUserId: string;
  email: string | null;
  emailVerified: boolean;
};

export type LinkFederatedIdentityInput = {
  accountId: string;
  workosUserId: string;
  email: string | null;
  emailVerified: boolean;
};

export type LinkWalletIdentityInput = {
  accountId: string;
  walletPublicKey: string;
};

export type MergeFederatedOnlyAccountIntoWalletAccountInput = {
  sourceAccountId: string;
  targetAccountId: string;
};

type InMemoryAccountState = {
  account: AccountRecord;
  wallets: WalletIdentityRecord[];
  federated: FederatedIdentityRecord[];
};

const inMemoryAccountsById = new Map<string, InMemoryAccountState>();
const inMemoryAccountIdByWallet = new Map<string, string>();
const inMemoryAccountIdByWorkosUserId = new Map<string, string>();

export class AccountRepositoryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function __resetAccountRepositoryStateForTests(): void {
  inMemoryAccountsById.clear();
  inMemoryAccountIdByWallet.clear();
  inMemoryAccountIdByWorkosUserId.clear();
}

function isAccountsSchemaUnavailableError(error: unknown): boolean {
  return (
    typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: string }).code === "42P01"
  );
}

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEmail(email: string | null): string | null {
  if (!email) {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function cloneBundle(state: InMemoryAccountState): AccountIdentityBundle {
  return {
    account: { ...state.account },
    walletIdentities: state.wallets.map((wallet) => ({ ...wallet })),
    federatedIdentities: state.federated.map((identity) => ({ ...identity }))
  };
}

function createInMemoryAccount(createdVia: AccountCreatedVia, primaryWalletPublicKey: string | null): InMemoryAccountState {
  const timestamp = nowIso();
  const account: AccountRecord = {
    id: randomUUID(),
    createdVia,
    primaryWalletPublicKey,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const state: InMemoryAccountState = {
    account,
    wallets: [],
    federated: []
  };

  inMemoryAccountsById.set(account.id, state);
  return state;
}

function getInMemoryAccountById(accountId: string): InMemoryAccountState {
  const state = inMemoryAccountsById.get(accountId);

  if (!state) {
    throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
  }

  return state;
}

function findAccountByWalletPublicKeyInMemory(walletPublicKey: string): AccountIdentityBundle | null {
  const accountId = inMemoryAccountIdByWallet.get(walletPublicKey);
  if (!accountId) {
    return null;
  }

  return cloneBundle(getInMemoryAccountById(accountId));
}

function findAccountByWorkosUserIdInMemory(workosUserId: string): AccountIdentityBundle | null {
  const accountId = inMemoryAccountIdByWorkosUserId.get(workosUserId);
  if (!accountId) {
    return null;
  }

  return cloneBundle(getInMemoryAccountById(accountId));
}

function ensureFederatedAccountInMemory(input: EnsureFederatedAccountInput): AccountIdentityBundle {
  const workosUserId = input.workosUserId.trim();
  const email = normalizeEmail(input.email);
  const existing = findAccountByWorkosUserIdInMemory(workosUserId);

  if (existing) {
    return existing;
  }

  const state = createInMemoryAccount("federated", null);
  const identity: FederatedIdentityRecord = {
    workosUserId,
    accountId: state.account.id,
    provider: "workos",
    email,
    emailVerified: Boolean(input.emailVerified),
    createdAt: state.account.createdAt,
    updatedAt: state.account.updatedAt
  };
  state.federated.push(identity);
  inMemoryAccountIdByWorkosUserId.set(workosUserId, state.account.id);
  return cloneBundle(state);
}

function ensureWalletFirstAccountInMemory(walletPublicKey: string): AccountIdentityBundle {
  const existing = findAccountByWalletPublicKeyInMemory(walletPublicKey);
  if (existing) {
    return existing;
  }

  const state = createInMemoryAccount("wallet", walletPublicKey);
  const wallet: WalletIdentityRecord = {
    walletPublicKey,
    accountId: state.account.id,
    isPrimary: true,
    linkedAt: state.account.createdAt,
    lastAuthenticatedAt: null
  };
  state.wallets.push(wallet);
  inMemoryAccountIdByWallet.set(walletPublicKey, state.account.id);
  return cloneBundle(state);
}

function linkFederatedIdentityToAccountInMemory(input: LinkFederatedIdentityInput): AccountIdentityBundle {
  const workosUserId = input.workosUserId.trim();
  const email = normalizeEmail(input.email);
  const existingAccountId = inMemoryAccountIdByWorkosUserId.get(workosUserId);
  if (existingAccountId && existingAccountId !== input.accountId) {
    throw new AccountRepositoryError("FEDERATED_IDENTITY_ALREADY_LINKED", "Federated identity is already linked to another account.");
  }

  const state = getInMemoryAccountById(input.accountId);
  if (!existingAccountId) {
    const timestamp = nowIso();
    state.federated.push({
      workosUserId,
      accountId: state.account.id,
      provider: "workos",
      email,
      emailVerified: Boolean(input.emailVerified),
      createdAt: timestamp,
      updatedAt: timestamp
    });
    inMemoryAccountIdByWorkosUserId.set(workosUserId, state.account.id);
  }

  return cloneBundle(state);
}

function linkWalletIdentityToAccountInMemory(input: LinkWalletIdentityInput): AccountIdentityBundle {
  const walletPublicKey = input.walletPublicKey.trim();
  const existingAccountId = inMemoryAccountIdByWallet.get(walletPublicKey);
  if (existingAccountId && existingAccountId !== input.accountId) {
    throw new AccountRepositoryError("WALLET_ALREADY_LINKED", "Wallet is already linked to another account.");
  }

  const state = getInMemoryAccountById(input.accountId);

  if (!existingAccountId) {
    const timestamp = nowIso();
    const isPrimary = !state.account.primaryWalletPublicKey;
    state.wallets.push({
      walletPublicKey,
      accountId: state.account.id,
      isPrimary,
      linkedAt: timestamp,
      lastAuthenticatedAt: null
    });
    if (isPrimary) {
      state.account.primaryWalletPublicKey = walletPublicKey;
      state.account.updatedAt = timestamp;
    }
    inMemoryAccountIdByWallet.set(walletPublicKey, state.account.id);
  }

  return cloneBundle(state);
}

function mergeFederatedOnlyAccountIntoWalletAccountInMemory(
  input: MergeFederatedOnlyAccountIntoWalletAccountInput
): AccountIdentityBundle {
  const sourceAccountId = input.sourceAccountId.trim();
  const targetAccountId = input.targetAccountId.trim();

  if (!sourceAccountId || !targetAccountId) {
    throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
  }

  if (sourceAccountId === targetAccountId) {
    return cloneBundle(getInMemoryAccountById(targetAccountId));
  }

  const source = getInMemoryAccountById(sourceAccountId);
  const target = getInMemoryAccountById(targetAccountId);

  if (source.wallets.length > 0 || source.account.primaryWalletPublicKey) {
    throw new AccountRepositoryError(
      "SOURCE_ACCOUNT_NOT_FEDERATED_ONLY",
      "Source account is not eligible for automatic consolidation."
    );
  }

  if (!target.wallets.length || !target.account.primaryWalletPublicKey) {
    throw new AccountRepositoryError(
      "TARGET_ACCOUNT_NOT_WALLET_BACKED",
      "Target account is not eligible to receive federated identities."
    );
  }

  for (const identity of source.federated) {
    inMemoryAccountIdByWorkosUserId.set(identity.workosUserId, target.account.id);
    target.federated.push({
      ...identity,
      accountId: target.account.id,
      updatedAt: nowIso()
    });
  }

  target.account.updatedAt = nowIso();
  inMemoryAccountsById.delete(source.account.id);

  return cloneBundle(target);
}

function mapAccountRow(row: {
  id: string;
  created_via: AccountCreatedVia;
  primary_wallet_public_key: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}): AccountRecord {
  return {
    id: row.id,
    createdVia: row.created_via,
    primaryWalletPublicKey: row.primary_wallet_public_key,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

function mapWalletRow(row: {
  wallet_public_key: string;
  account_id: string;
  is_primary: boolean;
  linked_at: string | Date;
  last_authenticated_at: string | Date | null;
}): WalletIdentityRecord {
  return {
    walletPublicKey: row.wallet_public_key,
    accountId: row.account_id,
    isPrimary: Boolean(row.is_primary),
    linkedAt: new Date(row.linked_at).toISOString(),
    lastAuthenticatedAt: row.last_authenticated_at ? new Date(row.last_authenticated_at).toISOString() : null
  };
}

function mapFederatedRow(row: {
  workos_user_id: string;
  account_id: string;
  provider: "workos";
  email: string | null;
  email_verified: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}): FederatedIdentityRecord {
  return {
    workosUserId: row.workos_user_id,
    accountId: row.account_id,
    provider: row.provider,
    email: row.email,
    emailVerified: Boolean(row.email_verified),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

async function getAccountBundleByIdWithClient(client: PoolClient, accountId: string): Promise<AccountIdentityBundle | null> {
  const accountResult = await client.query(
    `SELECT id, created_via, primary_wallet_public_key, created_at, updated_at
       FROM accounts
      WHERE id = $1`,
    [accountId]
  );

  const accountRow = accountResult.rows[0];

  if (!accountRow) {
    return null;
  }

  const [walletsResult, federatedResult] = await Promise.all([
    client.query(
      `SELECT wallet_public_key, account_id, is_primary, linked_at, last_authenticated_at
         FROM account_wallet_identities
        WHERE account_id = $1
        ORDER BY linked_at ASC`,
      [accountId]
    ),
    client.query(
      `SELECT workos_user_id, account_id, provider, email, email_verified, created_at, updated_at
         FROM account_federated_identities
        WHERE account_id = $1
        ORDER BY created_at ASC`,
      [accountId]
    )
  ]);

  return {
    account: mapAccountRow(accountRow),
    walletIdentities: walletsResult.rows.map(mapWalletRow),
    federatedIdentities: federatedResult.rows.map(mapFederatedRow)
  };
}

export async function findAccountByWalletPublicKey(walletPublicKey: string): Promise<AccountIdentityBundle | null> {
  const normalized = walletPublicKey.trim();

  if (!normalized) {
    return null;
  }

  if (!hasDatabase()) {
    return findAccountByWalletPublicKeyInMemory(normalized);
  }

  try {
    return await withDbClient(async (client) => {
      const walletResult = await client.query(
        `SELECT account_id
           FROM account_wallet_identities
          WHERE wallet_public_key = $1`,
        [normalized]
      );

      const accountId = walletResult.rows[0]?.account_id as string | undefined;
      if (!accountId) {
        return null;
      }

      return getAccountBundleByIdWithClient(client, accountId);
    });
  } catch (error) {
    if (isAccountsSchemaUnavailableError(error)) {
      return findAccountByWalletPublicKeyInMemory(normalized);
    }

    throw error;
  }
}

export async function findAccountByWorkosUserId(workosUserId: string): Promise<AccountIdentityBundle | null> {
  const normalized = workosUserId.trim();

  if (!normalized) {
    return null;
  }

  if (!hasDatabase()) {
    return findAccountByWorkosUserIdInMemory(normalized);
  }

  try {
    return await withDbClient(async (client) => {
      const identityResult = await client.query(
        `SELECT account_id
           FROM account_federated_identities
          WHERE workos_user_id = $1`,
        [normalized]
      );

      const accountId = identityResult.rows[0]?.account_id as string | undefined;
      if (!accountId) {
        return null;
      }

      return getAccountBundleByIdWithClient(client, accountId);
    });
  } catch (error) {
    if (isAccountsSchemaUnavailableError(error)) {
      return findAccountByWorkosUserIdInMemory(normalized);
    }

    throw error;
  }
}

export async function ensureFederatedAccount(input: EnsureFederatedAccountInput): Promise<AccountIdentityBundle> {
  const workosUserId = input.workosUserId.trim();
  const email = normalizeEmail(input.email);

  if (!workosUserId) {
    throw new AccountRepositoryError("INVALID_WORKOS_USER_ID", "WorkOS user id is required.");
  }

  const existing = await findAccountByWorkosUserId(workosUserId);
  if (existing) {
    return existing;
  }

  if (!hasDatabase()) {
    return ensureFederatedAccountInMemory(input);
  }

  try {
    return await withDbClient(async (client) => {
      await client.query("BEGIN");

      try {
        const insertedAccount = await client.query(
          `INSERT INTO accounts (id, created_via, primary_wallet_public_key)
           VALUES ($1, 'federated', NULL)
           RETURNING id, created_via, primary_wallet_public_key, created_at, updated_at`,
          [randomUUID()]
        );

        const accountRow = insertedAccount.rows[0];

        await client.query(
          `INSERT INTO account_federated_identities (workos_user_id, account_id, provider, email, email_verified)
           VALUES ($1, $2, 'workos', $3, $4)`,
          [workosUserId, accountRow.id, email, Boolean(input.emailVerified)]
        );

        await client.query("COMMIT");

        const bundle = await getAccountBundleByIdWithClient(client, accountRow.id);
        if (!bundle) {
          throw new Error("Could not reload federated account after creation.");
        }

        return bundle;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  } catch (error) {
    if (isAccountsSchemaUnavailableError(error)) {
      return ensureFederatedAccountInMemory(input);
    }

    throw error;
  }
}

export async function ensureWalletFirstAccount(walletPublicKey: string): Promise<AccountIdentityBundle> {
  const normalized = walletPublicKey.trim();

  if (!normalized) {
    throw new AccountRepositoryError("INVALID_WALLET", "Wallet public key is required.");
  }

  const existing = await findAccountByWalletPublicKey(normalized);
  if (existing) {
    return existing;
  }

  if (!hasDatabase()) {
    return ensureWalletFirstAccountInMemory(normalized);
  }

  try {
    return await withDbClient(async (client) => {
      await client.query("BEGIN");

      try {
        const insertedAccount = await client.query(
          `INSERT INTO accounts (id, created_via, primary_wallet_public_key)
           VALUES ($1, 'wallet', $2)
           RETURNING id, created_via, primary_wallet_public_key, created_at, updated_at`,
          [randomUUID(), normalized]
        );

        const accountRow = insertedAccount.rows[0];

        await client.query(
          `INSERT INTO account_wallet_identities (wallet_public_key, account_id, is_primary, linked_at)
           VALUES ($1, $2, TRUE, NOW())`,
          [normalized, accountRow.id]
        );

        await client.query(
          `UPDATE user_profiles
              SET account_id = $2
            WHERE wallet_public_key = $1
              AND account_id IS NULL`,
          [normalized, accountRow.id]
        );

        await client.query("COMMIT");

        const bundle = await getAccountBundleByIdWithClient(client, accountRow.id);
        if (!bundle) {
          throw new Error("Could not reload wallet-first account after creation.");
        }

        return bundle;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  } catch (error) {
    if (isAccountsSchemaUnavailableError(error)) {
      return ensureWalletFirstAccountInMemory(normalized);
    }

    throw error;
  }
}

export async function linkFederatedIdentityToAccount(input: LinkFederatedIdentityInput): Promise<AccountIdentityBundle> {
  const workosUserId = input.workosUserId.trim();
  const email = normalizeEmail(input.email);

  if (!workosUserId) {
    throw new AccountRepositoryError("INVALID_WORKOS_USER_ID", "WorkOS user id is required.");
  }

  if (!hasDatabase()) {
    return linkFederatedIdentityToAccountInMemory(input);
  }

  try {
    return await withDbClient(async (client) => {
      await client.query("BEGIN");

      try {
        const existingIdentity = await client.query(
          `SELECT account_id
             FROM account_federated_identities
            WHERE workos_user_id = $1`,
          [workosUserId]
        );

        const existingAccountId = existingIdentity.rows[0]?.account_id as string | undefined;
        if (existingAccountId && existingAccountId !== input.accountId) {
          throw new AccountRepositoryError("FEDERATED_IDENTITY_ALREADY_LINKED", "Federated identity is already linked to another account.");
        }

        if (!existingAccountId) {
          await client.query(
            `INSERT INTO account_federated_identities (workos_user_id, account_id, provider, email, email_verified)
             VALUES ($1, $2, 'workos', $3, $4)`,
            [workosUserId, input.accountId, email, Boolean(input.emailVerified)]
          );
        }

        await client.query("COMMIT");

        const bundle = await getAccountBundleByIdWithClient(client, input.accountId);
        if (!bundle) {
          throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
        }

        return bundle;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  } catch (error) {
    if (isAccountsSchemaUnavailableError(error)) {
      return linkFederatedIdentityToAccountInMemory(input);
    }

    throw error;
  }
}

export async function linkWalletIdentityToAccount(input: LinkWalletIdentityInput): Promise<AccountIdentityBundle> {
  const walletPublicKey = input.walletPublicKey.trim();

  if (!walletPublicKey) {
    throw new AccountRepositoryError("INVALID_WALLET", "Wallet public key is required.");
  }

  if (!hasDatabase()) {
    return linkWalletIdentityToAccountInMemory(input);
  }

  try {
    return await withDbClient(async (client) => {
      await client.query("BEGIN");

      try {
        const existingWallet = await client.query(
          `SELECT account_id
             FROM account_wallet_identities
            WHERE wallet_public_key = $1`,
          [walletPublicKey]
        );

        const existingAccountId = existingWallet.rows[0]?.account_id as string | undefined;
        if (existingAccountId && existingAccountId !== input.accountId) {
          throw new AccountRepositoryError("WALLET_ALREADY_LINKED", "Wallet is already linked to another account.");
        }

        if (!existingAccountId) {
          const accountResult = await client.query(
            `SELECT primary_wallet_public_key
               FROM accounts
              WHERE id = $1`,
            [input.accountId]
          );

          const accountRow = accountResult.rows[0];
          if (!accountRow) {
            throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
          }

          const isPrimary = !accountRow.primary_wallet_public_key;

          await client.query(
            `INSERT INTO account_wallet_identities (wallet_public_key, account_id, is_primary, linked_at)
             VALUES ($1, $2, $3, NOW())`,
            [walletPublicKey, input.accountId, isPrimary]
          );

          if (isPrimary) {
            await client.query(
              `UPDATE accounts
                  SET primary_wallet_public_key = $2,
                      updated_at = NOW()
                WHERE id = $1`,
              [input.accountId, walletPublicKey]
            );
          }

          await client.query(
            `UPDATE user_profiles
                SET account_id = $2
              WHERE wallet_public_key = $1
                AND account_id IS NULL`,
            [walletPublicKey, input.accountId]
          );
        }

        await client.query("COMMIT");

        const bundle = await getAccountBundleByIdWithClient(client, input.accountId);
        if (!bundle) {
          throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
        }

        return bundle;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  } catch (error) {
    if (isAccountsSchemaUnavailableError(error)) {
      return linkWalletIdentityToAccountInMemory(input);
    }

    throw error;
  }
}

export async function mergeFederatedOnlyAccountIntoWalletAccount(
  input: MergeFederatedOnlyAccountIntoWalletAccountInput
): Promise<AccountIdentityBundle> {
  const sourceAccountId = input.sourceAccountId.trim();
  const targetAccountId = input.targetAccountId.trim();

  if (!sourceAccountId || !targetAccountId) {
    throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
  }

  if (sourceAccountId === targetAccountId) {
    if (!hasDatabase()) {
      return cloneBundle(getInMemoryAccountById(targetAccountId));
    }

    const sameAccount = await withDbClient((client) => getAccountBundleByIdWithClient(client, targetAccountId));
    if (!sameAccount) {
      throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
    }

    return sameAccount;
  }

  if (!hasDatabase()) {
    return mergeFederatedOnlyAccountIntoWalletAccountInMemory(input);
  }

  try {
    return await withDbClient(async (client) => {
      await client.query("BEGIN");

      try {
        const sourceBundle = await getAccountBundleByIdWithClient(client, sourceAccountId);
        const targetBundle = await getAccountBundleByIdWithClient(client, targetAccountId);

        if (!sourceBundle || !targetBundle) {
          throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
        }

        if (sourceBundle.walletIdentities.length > 0 || sourceBundle.account.primaryWalletPublicKey) {
          throw new AccountRepositoryError(
            "SOURCE_ACCOUNT_NOT_FEDERATED_ONLY",
            "Source account is not eligible for automatic consolidation."
          );
        }

        if (!targetBundle.walletIdentities.length || !targetBundle.account.primaryWalletPublicKey) {
          throw new AccountRepositoryError(
            "TARGET_ACCOUNT_NOT_WALLET_BACKED",
            "Target account is not eligible to receive federated identities."
          );
        }

        const sourceProfiles = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
             FROM user_profiles
            WHERE account_id = $1`,
          [sourceAccountId]
        );

        if (Number.parseInt(sourceProfiles.rows[0]?.count ?? "0", 10) > 0) {
          throw new AccountRepositoryError(
            "SOURCE_ACCOUNT_HAS_BOUND_PROFILE_STATE",
            "Source account has state that requires manual review."
          );
        }

        const sourcePushSubscriptions = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
             FROM web_push_subscriptions
            WHERE account_id = $1`,
          [sourceAccountId]
        ).catch((error: unknown) => {
          if (isAccountsSchemaUnavailableError(error)) {
            return { rows: [{ count: "0" }] };
          }

          throw error;
        });

        if (Number.parseInt(sourcePushSubscriptions.rows[0]?.count ?? "0", 10) > 0) {
          throw new AccountRepositoryError(
            "SOURCE_ACCOUNT_HAS_PUSH_STATE",
            "Source account has state that requires manual review."
          );
        }

        const sourceActiveIntent = await client.query<{ id: string }>(
          `SELECT id
             FROM account_referral_intents
            WHERE account_id = $1
              AND status = 'active'
            LIMIT 1
            FOR UPDATE`,
          [sourceAccountId]
        ).catch((error: unknown) => {
          if (isAccountsSchemaUnavailableError(error)) {
            return { rows: [] };
          }

          throw error;
        });

        const targetActiveIntent = await client.query<{ id: string }>(
          `SELECT id
             FROM account_referral_intents
            WHERE account_id = $1
              AND status = 'active'
            LIMIT 1
            FOR UPDATE`,
          [targetAccountId]
        ).catch((error: unknown) => {
          if (isAccountsSchemaUnavailableError(error)) {
            return { rows: [] };
          }

          throw error;
        });

        const sourceActiveIntentId = sourceActiveIntent.rows[0]?.id ?? null;
        const targetActiveIntentId = targetActiveIntent.rows[0]?.id ?? null;

        if (sourceActiveIntentId && !targetActiveIntentId) {
          await client.query(
            `UPDATE account_referral_intents
                SET account_id = $2
              WHERE id = $1`,
            [sourceActiveIntentId, targetAccountId]
          ).catch((error: unknown) => {
            if (isAccountsSchemaUnavailableError(error)) {
              return;
            }

            throw error;
          });
        } else if (sourceActiveIntentId && targetActiveIntentId) {
          await client.query(
            `UPDATE account_referral_intents
                SET status = 'discarded_wallet_already_attributed',
                    resolved_at = NOW(),
                    promoted_attribution_id = NULL
              WHERE id = $1`,
            [sourceActiveIntentId]
          ).catch((error: unknown) => {
            if (isAccountsSchemaUnavailableError(error)) {
              return;
            }

            throw error;
          });
        }

        await client.query(
          `UPDATE account_federated_identities
              SET account_id = $2,
                  updated_at = NOW()
            WHERE account_id = $1`,
          [sourceAccountId, targetAccountId]
        );

        await client.query(
          `DELETE FROM accounts
            WHERE id = $1`,
          [sourceAccountId]
        );

        await client.query("COMMIT");

        const merged = await getAccountBundleByIdWithClient(client, targetAccountId);
        if (!merged) {
          throw new AccountRepositoryError("ACCOUNT_NOT_FOUND", "Account was not found.");
        }

        return merged;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  } catch (error) {
    if (isAccountsSchemaUnavailableError(error)) {
      return mergeFederatedOnlyAccountIntoWalletAccountInMemory(input);
    }

    throw error;
  }
}
