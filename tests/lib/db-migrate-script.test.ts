import { describe, expect, it } from "vitest";

const { filterTrackedMigrationFiles, parseEnvValue } = require("../../scripts/db-migrate.js") as {
  filterTrackedMigrationFiles: (
    allFiles: string[],
    trackedFiles: Set<string>
  ) => { files: string[]; skippedUntracked: string[] };
  parseEnvValue: (value: string) => string;
};

describe("scripts/db-migrate", () => {
  it("filters out untracked migration drafts", () => {
    const result = filterTrackedMigrationFiles(
      [
        "017_authority_lifecycle_registry.sql",
        "018_checkout_dual_payment.sql",
        "018_referral_system_schema.sql",
        "022_referral_system_schema.sql",
        "024_onboarding_profile_completion_rewards.sql"
      ],
      new Set([
        "017_authority_lifecycle_registry.sql",
        "018_checkout_dual_payment.sql",
        "024_onboarding_profile_completion_rewards.sql"
      ])
    );

    expect(result.files).toEqual([
      "017_authority_lifecycle_registry.sql",
      "018_checkout_dual_payment.sql",
      "024_onboarding_profile_completion_rewards.sql"
    ]);
    expect(result.skippedUntracked).toEqual([
      "018_referral_system_schema.sql",
      "022_referral_system_schema.sql"
    ]);
  });

  it("parses quoted env values without surrounding quotes", () => {
    expect(parseEnvValue('\"postgres://example\"')).toBe("postgres://example");
    expect(parseEnvValue("'postgres://example'")).toBe("postgres://example");
  });
});
