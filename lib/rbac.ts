export type UserRole = "user" | "admin";

const ADMIN_WALLETS_ENV_KEY = "ADMIN_WALLETS";

export function parseAdminWallets(): Set<string> {
  const source = process.env[ADMIN_WALLETS_ENV_KEY] ?? "";

  return new Set(
    source
      .split(",")
      .map((wallet) => wallet.trim())
      .filter(Boolean)
  );
}

export function getRoleForWallet(pubkey: string): UserRole {
  const adminWallets = parseAdminWallets();
  return adminWallets.has(pubkey) ? "admin" : "user";
}
