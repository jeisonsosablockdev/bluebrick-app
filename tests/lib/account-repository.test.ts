import { afterEach, describe, expect, it } from "vitest";

import {
  __resetAccountRepositoryStateForTests,
  AccountRepositoryError,
  ensureFederatedAccount,
  ensureWalletFirstAccount,
  findAccountByWalletPublicKey,
  findAccountByWorkosUserId,
  linkFederatedIdentityToAccount,
  linkWalletIdentityToAccount
} from "@/lib/accounts/repository";

function clearDatabaseUrl(): void {
  delete process.env.DATABASE_URL;
}

describe("lib/accounts/repository", () => {
  afterEach(() => {
    clearDatabaseUrl();
    __resetAccountRepositoryStateForTests();
  });

  it("creates and reuses a federated-first account for the same WorkOS user", async () => {
    clearDatabaseUrl();

    const first = await ensureFederatedAccount({
      workosUserId: "user_123",
      email: "User@Example.com",
      emailVerified: true
    });
    const second = await ensureFederatedAccount({
      workosUserId: "user_123",
      email: "user@example.com",
      emailVerified: true
    });

    expect(second.account.id).toBe(first.account.id);
    expect(second.account.createdVia).toBe("federated");
    expect(second.federatedIdentities).toHaveLength(1);
    expect(second.federatedIdentities[0]).toMatchObject({
      workosUserId: "user_123",
      email: "user@example.com",
      emailVerified: true
    });
  });

  it("creates and reuses a wallet-first account for the same wallet", async () => {
    clearDatabaseUrl();

    const first = await ensureWalletFirstAccount("wallet_abc");
    const second = await ensureWalletFirstAccount("wallet_abc");

    expect(second.account.id).toBe(first.account.id);
    expect(second.account.createdVia).toBe("wallet");
    expect(second.account.primaryWalletPublicKey).toBe("wallet_abc");
    expect(second.walletIdentities).toHaveLength(1);
    expect(second.walletIdentities[0]).toMatchObject({
      walletPublicKey: "wallet_abc",
      isPrimary: true
    });
  });

  it("links a wallet to a federated account and keeps it globally unique", async () => {
    clearDatabaseUrl();

    const account = await ensureFederatedAccount({
      workosUserId: "user_123",
      email: "user@example.com",
      emailVerified: true
    });

    const linked = await linkWalletIdentityToAccount({
      accountId: account.account.id,
      walletPublicKey: "wallet_shared"
    });

    expect(linked.account.primaryWalletPublicKey).toBe("wallet_shared");
    expect(linked.walletIdentities).toHaveLength(1);

    const duplicateAccount = await ensureFederatedAccount({
      workosUserId: "user_456",
      email: "other@example.com",
      emailVerified: true
    });

    await expect(
      linkWalletIdentityToAccount({
        accountId: duplicateAccount.account.id,
        walletPublicKey: "wallet_shared"
      })
    ).rejects.toMatchObject({
      code: "WALLET_ALREADY_LINKED"
    } satisfies Partial<AccountRepositoryError>);

    const resolved = await findAccountByWalletPublicKey("wallet_shared");
    expect(resolved?.account.id).toBe(account.account.id);
  });

  it("rejects linking the same federated identity to another account", async () => {
    clearDatabaseUrl();

    const walletAccount = await ensureWalletFirstAccount("wallet_abc");
    const federatedAccount = await ensureFederatedAccount({
      workosUserId: "user_123",
      email: "user@example.com",
      emailVerified: true
    });

    await expect(
      linkFederatedIdentityToAccount({
        accountId: walletAccount.account.id,
        workosUserId: "user_123",
        email: "user@example.com",
        emailVerified: true
      })
    ).rejects.toMatchObject({
      code: "FEDERATED_IDENTITY_ALREADY_LINKED"
    } satisfies Partial<AccountRepositoryError>);

    const resolved = await findAccountByWorkosUserId("user_123");
    expect(resolved?.account.id).toBe(federatedAccount.account.id);
  });

  it("allows linking a new federated identity onto a wallet-first account", async () => {
    clearDatabaseUrl();

    const walletAccount = await ensureWalletFirstAccount("wallet_admin");

    const linked = await linkFederatedIdentityToAccount({
      accountId: walletAccount.account.id,
      workosUserId: "user_admin",
      email: "admin@example.com",
      emailVerified: true
    });

    expect(linked.account.id).toBe(walletAccount.account.id);
    expect(linked.federatedIdentities).toHaveLength(1);
    expect(linked.federatedIdentities[0]).toMatchObject({
      workosUserId: "user_admin",
      email: "admin@example.com"
    });
  });
});
