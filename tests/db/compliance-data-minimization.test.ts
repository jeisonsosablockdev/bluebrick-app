import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const complianceMigrationFiles = [
  "012_profile_kyc_compliance.sql",
  "013_aml_screening_enrichment.sql",
  "014_compliance_notes.sql"
] as const;

const prohibitedSensitiveTableNames = [
  "kyc_documents",
  "identity_documents",
  "pii_documents",
  "user_pii",
  "personal_data",
  "government_ids"
] as const;

const prohibitedSensitiveColumnNames = [
  "full_name",
  "first_name",
  "last_name",
  "date_of_birth",
  "birth_date",
  "dob",
  "document_number",
  "passport_number",
  "national_id",
  "id_number",
  "ssn",
  "driver_license_number",
  "document_front_image",
  "document_back_image",
  "selfie_image",
  "proof_of_address",
  "street_address"
] as const;

function getComplianceMigrationsSql(): string {
  const migrationsDir = path.join(process.cwd(), "db", "migrations");

  return complianceMigrationFiles
    .map((fileName) => fs.readFileSync(path.join(migrationsDir, fileName), "utf8"))
    .join("\n")
    .toLowerCase();
}

describe("compliance schema data minimization guard", () => {
  it("does not define forbidden PII table names", () => {
    const sql = getComplianceMigrationsSql();

    for (const tableName of prohibitedSensitiveTableNames) {
      expect(sql).not.toMatch(new RegExp(`\\b${tableName}\\b`, "i"));
    }
  });

  it("does not define forbidden PII column names", () => {
    const sql = getComplianceMigrationsSql();

    for (const columnName of prohibitedSensitiveColumnNames) {
      expect(sql).not.toMatch(new RegExp(`\\b${columnName}\\b`, "i"));
    }
  });
});
