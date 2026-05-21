# Fix: Admin Asset Form Investment Model Alignment (BRI-161)

## Problem

The admin asset creation flow at `/admin/assets/new` does not map cleanly to the current investment business model used by active projects (Fix & Flip and New Construction).

Current briefs consistently include deal-level economics that are not explicitly modeled in the form:

- Deal/reference number
- Purchase price
- ARV (after repair value)
- Rehab/construction budget
- Closing/holding/selling costs
- Total project cost
- Capital stack (minimum required capital, lender contribution, operator contribution)
- Ticket structure and structuring fees
- Profit split and fee deductions
- Net investor ROI
- Timeline by stage
- Security/governance notes (escrow, SPV, oversight)

Today, several values are forced into proxy fields (`buildingFundingGoal`, `buildingNftCost`, `buildingTotalUnits`) and the final marketplace payload only persists a reduced subset of data. This creates semantic drift, weak traceability, and incomplete investment disclosure.

## Why It Matters

- Commercial risk: the admin team cannot represent real deal economics without distortion.
- Data risk: marketplace and downstream reporting lose important context.
- Governance risk: incomplete persistence weakens auditability of investment assumptions.
- Product risk: operators need manual workarounds outside the platform to communicate deal terms.
- Marketplace trust risk: end users cannot see the full investment context that the brief already defines, which weakens transparency and decision-making.

## Expected Outcome

The admin workflow must support business-aligned capture and persistence for active project types, while preserving existing mint/deploy guards and on-chain flow constraints.

The form must allow creating Fix & Flip / New Construction assets without semantic misuse of unrelated fields.

The marketplace must also surface the relevant deal economics to end users, not just store them in admin.

## Current Gaps

- Asset typing is optimized for `building_new`, `rental_property`, `land_lot` instead of the current pipeline mix.
- No first-class informational economics model in UI, validation, or marketplace payload for the values that come from the brief.
- Insufficient timeline and governance metadata capture.
- Import aliases do not cover most of the business fields present in current briefs.
- Marketplace card and detail view currently expose only a reduced investment summary and do not reflect the full deal information that users need to evaluate the opportunity.

## Identification Decision

The current identification block keeps `assetName` and `internalCode`, but their meaning is clarified for this fix:

- `assetName` remains the human-readable commercial project name shown in admin and marketplace.
- `assetName` must be derived from the project identity in the brief, not from the full street address.
- `internalCode` must map to the brief's operational identifier, using `Deal Number` or `Numero de Referencia`.

Examples from current briefs:

- Brandon Hickory -> `internalCode = 117`
- Englelake -> `internalCode = 6677`
- Bradenton Hunter Ln -> `internalCode = 518`

Address remains part of the location block and must not replace `assetName`.

Confirmed mapping decisions:

- `buildingProjectStage` remains the active stage field and will be populated from the brief stage/context.
- `buildingDeveloperName` remains the sponsor/operator field and will be populated from the brief operator/developer identity.
- `buildingFundingGoal` is confirmed to mean `Minimum Capital Required`.
- `buildingExitStrategy` is confirmed to mean `Exit Strategy`.
- `buildingProjectDurationMonths` is confirmed to mean `Total Estimated Duration`.
- `geoLat` and `geoLng` are not sourced from the PDF because they are already derived through Google location flow.
- Collection/tokenization fields continue to be derived with the existing mechanism.
- Media/documents from the previous generic mapping are not part of this brief-to-form alignment scope.

## Commercial Description Decision

The commercial description block is kept, but its content source is clarified so it can be populated consistently from the project brief.

Fields:

- `shortDescription`
- `longDescription`
- `investmentThesis`
- `riskNotes`

Content policy:

- We may reuse exact or near-exact phrases from the PDF where they express project type, execution model, transparency structure, and investment rationale clearly.
- We should not force detailed economics tables into the description block when those values belong in explicit financial fields.
- Description fields must remain readable, investor-facing narrative rather than raw tabular data.

Field intent:

- `shortDescription`: brief commercial summary for cards, listings, and preview surfaces.
- `longDescription`: fuller narrative of the project, execution plan, and value-creation path.
- `investmentThesis`: why the deal is attractive, including the business logic behind value capture.
- `riskNotes`: key project, execution, market, and governance risks or control points.

Allowed source material from the PDF:

- Project type phrases such as `Fix & Flip Residential`
- Execution phrases such as `Full rehabilitation and improvements`
- Structure phrases such as `Private Lender + Collective Investor Capital`
- Governance and transparency phrases such as escrow, SPV, lender oversight, contracts, and reporting language
- ROI and return logic in narrative form, without pasting the full financial table into description fields

Normalization rule:

- `shortDescription` and `longDescription` may be lightly edited for clarity and consistency.
- `investmentThesis` and `riskNotes` may preserve exact source wording when that improves fidelity to the brief.
- Full cost tables, fee tables, and profit tables must be represented in dedicated economics fields instead of being embedded in narrative text.

## Import Reuse Decision

This fix will reuse the existing admin import pipeline instead of creating a second independent ingestion flow.

Source priority:

- `Excel/CSV` is the primary structured import source.
- `PDF` is a supported source when it follows the same brief template family as the current documents.

Reuse principle:

- Structured spreadsheet imports should continue to use the current tabular import path.
- PDF imports should extract and normalize values into the same internal field-mapping pipeline already used by text/CSV import.
- The admin should review a preview before applying imported values to the form.

Why:

- It reduces duplication in UI, validation, and state handling.
- It keeps one canonical mapping layer from imported content into `AssetForm`.
- It allows PDF ingestion to benefit from the same preview, correction, and async-import behavior already present in admin.

## Source Mapping

The following mapping defines how repeated labels from the brief family and their spreadsheet equivalents should populate the admin form.

| PDF / Excel source | Target field | Required | Surface |
| --- | --- | --- | --- |
| `Deal Number`, `Numero de Referencia` | `internalCode` | Yes | Admin + marketplace identity support |
| Derived project name from type + city + reference | `assetName` | Yes | Admin + marketplace |
| Derived slug from project name / reference | `slug` | Yes | Admin + marketplace URL/id support |
| `Project Type`, `Type of Project` | `projectSubtype` (new) | Yes | Admin + marketplace |
| `Address` | `address` | Yes | Admin + marketplace |
| Derived city from address or `City` column | `city` | Yes | Admin + marketplace |
| Derived state from address or `State` column | `state` | Yes | Admin + marketplace |
| Derived country from address or `Country` column | `country` | Yes | Admin + marketplace |
| `Minimum Capital Required to Participate in the Project` | `buildingFundingGoal` | Yes | Admin + marketplace |
| `Exit Strategy` narrative | `buildingExitStrategy` | Yes | Admin + marketplace |
| `Total Estimated Duration` | `buildingProjectDurationMonths` | Yes | Admin + marketplace |
| brief stage / execution status | `buildingProjectStage` | Yes | Admin + marketplace summary |
| operator / sponsor / developer identity | `buildingDeveloperName` | Yes | Admin + marketplace summary |
| `Escrow Account` narrative | `riskNotes` + `escrowStructure` (new) | No | Admin + marketplace summary |
| `LLC Independiente` / SPV narrative | `riskNotes` + `spvStructure` (new) | No | Admin + marketplace summary |
| `Private Lender Oversight` | `riskNotes` + `oversightModel` (new) | No | Admin + marketplace summary |
| `Contracts & Reports` | `riskNotes` + `reportingModel` (new) | No | Admin + marketplace summary |
| Google geocoding result | `geoLat`, `geoLng` | Yes when location is resolved | Admin + marketplace |

Commercial description mapping:

| PDF / Excel source | Target field | Required | Surface |
| --- | --- | --- | --- |
| Project identity + project type + location + exit framing | `shortDescription` | Yes | Admin + marketplace |
| Property overview + execution language | `longDescription` | Yes | Admin + marketplace |
| ARV spread + execution upside + capital structure + return logic | `investmentThesis` | Yes | Admin + marketplace summary |
| Escrow / SPV / oversight / reporting + explicit risks | `riskNotes` | Yes | Admin + marketplace summary |

Informational economics fields to add:

- `purchasePriceUsd`
- `afterRepairValueUsd`
- `rehabBudgetUsd`
- `closingCostsUsd`
- `holdingCostsUsd`
- `sellingCostsUsd`
- `totalProjectCostUsd`
- `structuringFeeUsd`
- `grossProfitProjectedUsd`
- `managementFeeUsd`
- `brokerFeeUsd`
- `netInvestorProfitUsd`
- `projectedNetRoiPct`

These values are required as informative deal fields sourced from the brief, but they do not replace the confirmed semantic role of `buildingFundingGoal`, `buildingExitStrategy`, or `buildingProjectDurationMonths`.

Marketplace visibility rule:

- These informational economics fields are not admin-only for this fix.
- They must be persisted and reflected in what the end user sees in marketplace surfaces.
- The marketplace card should continue to stay concise, while the marketplace detail page must expose the broader economics set in a structured way.
- Transparency, governance, and execution context from the brief must be visible to users, not only retained as internal admin notes.

## Scope Boundaries

In scope:

- Admin form contract update
- Validation update
- Marketplace payload and persistence extension
- Marketplace presentation update for card/detail visibility of the new economics fields
- Final `clean-code audit` slice before completion
- Docs and traceability updates

Out of scope for this fix:

- Repricing or financial policy changes
- Historical data backfill beyond safe compatibility handling
- Public marketplace redesign unrelated to economics visibility

## Open Questions

- Should ticket structure be represented as investor slots, token supply, or both?
- Which of the new informational economics fields must be mandatory at creation vs optional at draft?
- Should ROI be stored as annualized and deal-horizon ROI simultaneously?
- How should the public marketplace card vs detail page split the new economics fields for readability without hiding critical information?
