import { afterEach, describe, expect, it } from "vitest";

import { getRoleForWallet, parseAdminWallets } from "@/lib/rbac";

const originalAdminWallets = process.env.ADMIN_WALLETS;

afterEach(() => {
  if (originalAdminWallets === undefined) {
    delete process.env.ADMIN_WALLETS;
    return;
  }

  process.env.ADMIN_WALLETS = originalAdminWallets;
});

describe("lib/rbac", () => {
  it("parses ADMIN_WALLETS into a clean set", () => {
    process.env.ADMIN_WALLETS = "  wallet-a, wallet-b ,, wallet-a  ";

    const adminWallets = parseAdminWallets();

    expect(adminWallets.size).toBe(2);
    expect(adminWallets.has("wallet-a")).toBe(true);
    expect(adminWallets.has("wallet-b")).toBe(true);
  });

  it("returns admin role when wallet is configured", () => {
    process.env.ADMIN_WALLETS = "wallet-admin,wallet-other";

    expect(getRoleForWallet("wallet-admin")).toBe("admin");
  });

  it("returns user role for unknown wallets", () => {
    process.env.ADMIN_WALLETS = "wallet-admin";

    expect(getRoleForWallet("wallet-user")).toBe("user");
  });
});
