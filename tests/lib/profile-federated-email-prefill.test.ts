import { afterEach, describe, expect, it } from "vitest";

import {
  __resetProfileRepositoryStateForTests,
  applyFederatedEmailPrefill,
  updateProfileBasics
} from "@/lib/compliance/profile-repository";

function clearDatabaseUrl(): void {
  delete process.env.DATABASE_URL;
}

describe("lib/compliance/profile-repository federated email prefill", () => {
  afterEach(() => {
    clearDatabaseUrl();
    __resetProfileRepositoryStateForTests();
  });

  it("fills email when the wallet profile email is empty", async () => {
    clearDatabaseUrl();

    const profile = await applyFederatedEmailPrefill({
      walletPublicKey: "wallet_prefill_1",
      email: "User@Example.com"
    });

    expect(profile.email).toBe("user@example.com");
  });

  it("does not overwrite an existing profile email", async () => {
    clearDatabaseUrl();

    await updateProfileBasics({
      walletPublicKey: "wallet_prefill_2",
      username: "tester_123",
      bio: "",
      avatarUrl: "",
      firstName: null,
      lastName: null,
      country: null,
      stateProvince: null,
      email: "existing@example.com",
      address: null,
      phone: null
    });

    const profile = await applyFederatedEmailPrefill({
      walletPublicKey: "wallet_prefill_2",
      email: "new@example.com"
    });

    expect(profile.email).toBe("existing@example.com");
  });
});
