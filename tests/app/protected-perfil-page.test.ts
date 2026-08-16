import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  })
}));

const appAuthMocks = vi.hoisted(() => ({
  resolveAppAuthContext: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: navigationMocks.redirect
}));

vi.mock("@/lib/app-auth", () => ({
  resolveAppAuthContext: appAuthMocks.resolveAppAuthContext
}));

vi.mock("@/features/profile/presentation/account-profile-support-module", () => ({
  AccountProfileSupportModule: ({ email }: { email: string | null }) => ({ type: "account-only", email })
}));

vi.mock("@/features/profile/presentation/auth-link-status-banner", () => ({
  AuthLinkStatusBanner: ({ status }: { status: string | null }) => ({ type: "auth-link-status", status })
}));

vi.mock("@/features/profile/presentation/profile-kyc-module", () => ({
  ProfileKycModule: ({ walletPublicKey }: { walletPublicKey: string }) => ({ type: "wallet-profile", walletPublicKey })
}));

import PerfilPage from "@/app/profile/perfil/page";

describe("app/protected/perfil/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous sessions to home", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      accountAuthenticated: false,
      federatedAuthenticated: false,
      walletAuthenticated: false,
      walletPublicKey: null,
      workosEmail: null
    });

    await expect(PerfilPage({})).rejects.toThrow("REDIRECT:/");
  });

  it("renders the account-only support module for federated sessions without a wallet", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      walletPublicKey: null,
      workosEmail: "user@example.com"
    });

    await expect(PerfilPage({})).resolves.toMatchObject({
      props: {
        children: expect.arrayContaining([
          expect.objectContaining({
            props: {
              email: "user@example.com"
            }
          })
        ])
      }
    });
  });

  it("renders the wallet-backed profile module when wallet auth exists", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: true,
      walletPublicKey: "Wallet111",
      workosEmail: "user@example.com"
    });

    await expect(PerfilPage({})).resolves.toMatchObject({
      props: {
        children: expect.arrayContaining([
          expect.objectContaining({
            props: {
              walletPublicKey: "Wallet111"
            }
          })
        ])
      }
    });
  });
});
