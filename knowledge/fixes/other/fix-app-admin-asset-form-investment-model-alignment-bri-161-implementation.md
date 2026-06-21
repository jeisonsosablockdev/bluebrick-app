---
type: Fix Spec
title: Fix App Admin Asset Form Investment Model Alignment BRI- 161 Implementation
description: Fix App Admin Asset Form Investment Model Alignment BRI- 161 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-admin-asset-form-investment-model-alignment-bri-161-implementation.md
---

# Implementation: Admin Asset Form Investment Model Alignment (BRI-161)

## Resolution Strategy

Implement a business-aligned contract for active deal types (Fix & Flip and New Construction), wire it through admin validation and marketplace persistence, and keep mint/deploy continuity intact.

The rollout will be incremental and backward-safe:

1. Extend data contract and validation first
2. Add UI sections and type-specific capture
3. Extend API payload, persistence, and marketplace read model
4. Update marketplace public presentation
5. Preserve compatibility for existing records and legacy fields
6. Verify end-to-end flow with admin + marketplace checks
7. Add follow-up slices for operator-workflow UX/import decisions
8. Run a dedicated clean-code audit before final reviewer closure

## Technical Design

### Admin Form Contract

The admin form keeps the current identification, location, commercial description, and tokenization baseline, while adding an informational economics layer.

Fields that keep their confirmed meaning:

- `assetName`
- `slug`
- `internalCode`
- `address`, `city`, `state`, `country`
- `geoLat`, `geoLng` from Google-based location resolution
- `buildingProjectStage`
- `buildingDeveloperName`
- `buildingFundingGoal` as `Minimum Capital Required`
- `buildingExitStrategy` as `Exit Strategy`
- `buildingProjectDurationMonths` as `Total Estimated Duration`

New informational fields to add to `AssetForm`:

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

Recommended grouping in UI:

- `Identification`
- `Location`
- `Commercial Description`
- `Deal Economics`
- `Fees and Profit`
- `Execution and Governance`
- `Collection / Mint Continuity`

### Import Pipeline Design

The existing import flow remains the canonical ingestion path.

Pipeline:

1. Source intake
2. Source normalization
3. Canonical field mapping
4. Preview
5. Manual correction
6. Apply to form
7. Optional async import job persistence

Source types:

- `CSV/TSV/TXT` structured rows
- `PDF brief` parsed into the same normalized row/object shape once the dedicated PDF intake slice is implemented

Normalization design:

- Spreadsheet import produces a `Record<string, string>` row map.
- Future PDF import should produce the same logical output shape after label extraction.
- Both paths should feed the same field alias mapper.

Implementation rule:

- Do not add separate form-writing logic for PDF imports.
- Add a PDF parsing adapter that outputs the same normalized import payload shape used by the tabular importer when the PDF slice is built.

Current-state clarification:

- The live admin import flow currently supports `.csv`, `.txt`, `.tsv`, and pasted tabular content from Excel.
- The live admin import flow does not yet accept PDF files.
- The artifact must distinguish between current shipped behavior and planned PDF support.

### Validation Design

Validation must be split into:

- required identity/location validation
- subtype validation
- informational economics validation
- compatibility validation for collection/tokenization

Validation rules for the new economics block:

- currency-like fields must be numeric and non-negative
- core economics fields must be present for active brief-based project types
- `projectedNetRoiPct` must be numeric and non-negative
- `totalProjectCostUsd` should not be lower than the obvious sum of known cost components when all component values are present

Compatibility rule:

- existing records missing the new fields must remain readable
- new create/edit flows must validate the new fields for the target subtype(s)

### Marketplace API Payload Design

`/api/admin/marketplace/entries` should be extended with a dedicated economics payload instead of flattening everything into `highlights` and `investmentNotes`.

Recommended request structure:

- preserve current top-level identity/location/media fields
- preserve current token/investment baseline
- add `economics`
- add `governance`

Recommended `economics` object:

- `purchasePriceUsd`
- `afterRepairValueUsd`
- `rehabBudgetUsd`
- `closingCostsUsd`
- `holdingCostsUsd`
- `sellingCostsUsd`
- `totalProjectCostUsd`
- `minimumCapitalRequiredUsd`
- `structuringFeeUsd`
- `grossProfitProjectedUsd`
- `managementFeeUsd`
- `brokerFeeUsd`
- `netInvestorProfitUsd`
- `projectedNetRoiPct`

Recommended `governance` object:

- `projectStage`
- `developerName`
- `exitStrategy`
- `projectDurationLabel`
- `riskNotes`

Payload compatibility:

- current fields such as `nftPriceUsd`, `annualRoiPct`, `highlights`, and `investmentNotes` remain supported
- new structured sections become the preferred source for rendering public detail content

### Persistence Design

The persistence layer should store the new economics data as first-class marketplace entry content.

Preferred approach:

- add dedicated JSON columns for `economics_json` and `governance_json`

Why:

- reduces schema churn for brief-driven informational fields
- keeps the public read model structured
- allows compatibility with existing rows by defaulting missing JSON to null/empty state

Persistence requirements:

- create path writes the economics/governance payload
- read path hydrates these payloads into the marketplace read model
- existing rows without these payloads remain valid

Migration approach:

- add tracked migration if DB-backed schema changes are needed
- backfill is optional for legacy rows; display logic must tolerate absence

### Marketplace Read Model Design

The current `PropertyDetail` and `PropertyListItem` contracts are too small for this fix.

Recommended additions to `PropertyDetail`:

- `project`: subtype/stage/operator/duration information
- `economics`: full user-visible deal economics block
- `governance`: transparency and risk context

Recommended `project` object:

- `subtype`
- `stage`
- `developerName`
- `exitStrategy`
- `durationLabel`

Recommended `economics` object:

- `purchasePriceUsd`
- `afterRepairValueUsd`
- `rehabBudgetUsd`
- `closingCostsUsd`
- `holdingCostsUsd`
- `sellingCostsUsd`
- `totalProjectCostUsd`
- `minimumCapitalRequiredUsd`
- `structuringFeeUsd`
- `grossProfitProjectedUsd`
- `managementFeeUsd`
- `brokerFeeUsd`
- `netInvestorProfitUsd`
- `projectedNetRoiPct`

Recommended `governance` object:

- `riskNotes`
- `transparencyHighlights` or equivalent structured bullet list

Recommended additions to `PropertyListItem`:

- `minimumCapitalRequiredUsd`
- `projectDurationLabel`
- optional `projectSubtype`

List item rule:

- keep the card payload compact
- do not push the full economics block into list cards

### Marketplace Presentation Design

The marketplace should split presentation into summary and detail layers.

Card design:

- keep title, location, status
- replace or augment fraction-price emphasis with business signals that matter for these projects
- show:
  - minimum capital
  - ROI
  - duration
  - optional subtype badge

Card must remain concise and scan-friendly.

Detail page design:

- keep hero section with title, location, image, CTA
- add a new `Deal Economics` section
- add a new `Fees and Profit` section
- add a new `Execution and Exit` section
- add a new `Transparency and Governance` section
- keep documents and blockchain info sections

Recommended detail layout:

- Hero
- Fractional/participation summary
- Deal economics grid
- Fees and projected returns grid
- Property/project narrative
- Transparency/governance
- Documents
- Blockchain info

Rendering rule:

- missing legacy values should hide their row gracefully
- user-visible labels must be plain-language and localized
- use compact metric cards or definition-list rows for scanability

### Component-Level Plan

Primary components affected:

- `components/admin/asset-creation-form.tsx`
- `components/marketplace/MarketplaceCard.tsx`
- `components/marketplace/PropertyDetailContent.tsx`
- `lib/property-service.ts`
- `app/api/admin/marketplace/entries/route.ts`
- persistence/read-model server code in marketplace property services

Recommended UI decomposition for marketplace detail:

- `PropertyDetailHero`
- `PropertyInvestmentSummary`
- `PropertyDealEconomics`
- `PropertyFeesAndProfit`
- `PropertyExecutionGovernance`
- existing `Documents` and `Blockchain` sections

This decomposition is optional if the existing file is still manageable, but it is the preferred direction if the detail view grows materially.

### Backward Compatibility Plan

- old marketplace rows remain readable with partial economics data
- old admin-created entries continue to render existing summary fields
- UI hides absent structured economics blocks cleanly
- no existing purchase CTA behavior should break when new economics fields are absent

### Verification Plan

Verification must cover:

- admin field entry and import preview
- payload generation from admin
- persistence and read-back
- marketplace list rendering
- marketplace detail rendering
- legacy-row compatibility

Expected evidence:

- test coverage for mapping/validation
- response contract checks for marketplace entry API
- UI evidence that the detail page shows the new economics fields

## Slice Plan

### Slice 1: Contract and Validation

- Update admin form model (`AssetForm`) with informative deal-economics fields required by the brief.
- Introduce project subtype alignment (`fix_flip`, `new_construction`, keep `rental` as needed).
- Add validation rules for required economics fields by subtype.
- Keep legacy fields readable while deprecating proxy semantics.
- Preserve `assetName` as the commercial project name.
- Map `internalCode` to `Deal Number` / `Numero de Referencia`.
- Keep address exclusively in the location contract rather than using it as project identity.
- Extend the existing import contract rather than creating a separate asset-ingestion model.
- Preserve the existing collection/tokenization derivation flow.
- Exclude generic media/documents remapping from this fix scope.

Deliverables:

- Updated type definitions
- Updated compatibility checks
- Updated import alias mapping for new fields

Identification rule:

- `assetName`: human-readable commercial name for admin and marketplace
- `internalCode`: brief identifier (`Deal Number` / `Numero de Referencia`)
- `address`: location-only field, never the replacement for `assetName`

Confirmed existing-field semantics:

- `buildingProjectStage` <- brief stage / execution context
- `buildingDeveloperName` <- operator / sponsor / developer identity from the brief
- `buildingFundingGoal` <- `Minimum Capital Required`
- `buildingExitStrategy` <- `Exit Strategy`
- `buildingProjectDurationMonths` <- `Total Estimated Duration`
- `geoLat` / `geoLng` <- Google-derived location data, not PDF-extracted values

Import contract rule:

- `Excel/CSV` remains the primary deterministic source for auto-fill.
- future `PDF` import must normalize extracted content into the same internal mapping layer used by the current tabular import flow.
- Imported values must pass through the same preview and correction step before they are committed to the form.

### Slice 2: Admin UI Capture

- Add an informational `Deal Economics` section (purchase, ARV, rehab, costs, total project cost).
- Add an informational `Fees and Profit` section (structuring fee, gross profit, management fee, broker fee, net investor profit, ROI).
- Add timeline phase fields and governance/security metadata fields.
- Keep mobile-safe and responsive behavior per frontend UI policy.
- Keep the commercial description block, but formalize how it is sourced from the PDF.

Deliverables:

- Updated `/admin/assets/new` UX
- Clear mandatory vs optional field labeling
- No horizontal overflow at required breakpoints

Informational fields to add:

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

Commercial description population rule:

- `shortDescription` is generated from the brief's project identity, project type, geography, and exit framing.
- `longDescription` is built from the brief's project overview and execution language, edited into readable marketplace/admin prose.
- `investmentThesis` is populated from the brief's narrative logic around ARV spread, rehabilitation/construction upside, capital structure, and expected return logic.
- `riskNotes` is populated from the brief's governance and control language plus explicit execution risks when present.

How it will be done:

1. Parse reusable narrative phrases from the PDF or source brief.
2. Classify each extracted phrase into one of four buckets: summary, execution narrative, investment rationale, risk/governance.
3. Normalize wording for clarity in `shortDescription` and `longDescription`.
4. Preserve exact or near-exact wording in `investmentThesis` and `riskNotes` when the brief already states the point clearly.
5. Exclude raw financial tables from the description block and map them into dedicated economics fields instead.

Examples of reusable source phrases:

- `Fix & Flip Residential`
- `Private Lender + Collective Investor Capital`
- `Full rehabilitation and improvements`
- `Escrow Account`
- `LLC Independiente`
- `Private Lender Oversight`
- `Contracts & Reports`

Import UX rule:

- Keep the current import entrypoint and extend it carefully as new supported source formats actually ship.
- Do not build a second disconnected "PDF-only" asset creation path.
- Spreadsheet rows and future parsed PDF payloads must converge into the same form-population workflow.

Immediate UX decision:

- `Quick import` should become the first visible block on `/admin/assets/new`.
- The page should reflect the real operator sequence: import first, review/correct second, enrich third, mint last.
- The import copy must describe only the formats that are truly available in the running product.

Implementation mapping contract:

| Source label / column | Internal field contract | Notes |
| --- | --- | --- |
| `Deal Number`, `Numero de Referencia` | `internalCode` | Direct mapping |
| Derived commercial name | `assetName` | Generated from project subtype + city + reference |
| Derived slug | `slug` | Generated from normalized commercial identity |
| `Project Type`, `Type of Project` | `projectSubtype` | New canonical subtype field |
| `Address` | `address` | Parsed directly; city/state/country may be derived |
| `Purchase Price` | `purchasePriceUsd` | New informational field |
| `After Repair Value (ARV)` | `afterRepairValueUsd` | New informational field |
| `Rehab Budget`, `Construction / Rehab Budget` | `rehabBudgetUsd` | New informational field |
| `Closing Costs` | `closingCostsUsd` | New informational field |
| `Holding & Misc.` | `holdingCostsUsd` | New informational field |
| `Selling Costs` | `sellingCostsUsd` | New informational field |
| `Total Project Cost` | `totalProjectCostUsd` | New informational field |
| `Minimum Capital Required...` | `buildingFundingGoal` | Confirmed reuse of existing field |
| `Structuring fee`, `Activation Capital Structuring fee` | `structuringFeeUsd` | New informational field |
| `Net Profit (before distribution)` | `grossProfitProjectedUsd` | New informational field |
| `Management Fee` | `managementFeeUsd` | New informational field |
| `Broker Fee` | `brokerFeeUsd` | New informational field |
| `Net Profit for Investor` | `netInvestorProfitUsd` | New informational field |
| ROI value shown to investor | `projectedNetRoiPct` | New informational field |
| `Exit Strategy` | `buildingExitStrategy` | Confirmed reuse of existing field |
| `Total Estimated Duration` | `buildingProjectDurationMonths` | Confirmed reuse of existing field |
| brief stage / execution status | `buildingProjectStage` | Confirmed reuse of existing field |
| operator / sponsor / developer identity | `buildingDeveloperName` | Confirmed reuse of existing field |
| escrow / SPV / oversight / reporting language | governance + narrative fields | Populate structured fields and `riskNotes` |
| Google location resolution | `geoLat`, `geoLng` | Derived outside PDF parsing |

Legacy bridge rule:

- Existing fields `buildingFundingGoal`, `buildingExitStrategy`, and `buildingProjectDurationMonths` remain active semantic targets for this fix and are not treated as temporary bridges for those specific concepts.
- Fields such as `buildingNftCost`, `buildingExpectedAnnualReturn`, and `buildingTotalUnits` should not absorb the new informative brief values unless a separate explicit decision is documented.

### Slice 3: Marketplace Payload and Persistence

- Extend `/api/admin/marketplace/entries` payload normalization with the new informative economics payload.
- Extend persistence contract to store the informative economics payload.
- Extend the marketplace read model (`PropertyDetail`, list items, and persistence mapping) so the new fields are available to public surfaces.
- Add compatibility behavior so old entries still resolve safely.
- Ensure marketplace detail/list consumers do not regress.

Deliverables:

- API contract update
- Storage/read-model update
- Safe handling for legacy records

### Slice 4: Marketplace Presentation

- Update marketplace card content to reflect the highest-signal economics without overcrowding the card.
- Update marketplace detail content so the user can see the important deal economics from the brief in a structured section.
- Surface transparency/governance context in the user-facing detail view.
- Keep the public UI readable and scannable while exposing materially relevant investment information.

User-facing visibility target:

- Card: concise summary such as minimum capital, ROI, duration, and one or two deal signals when appropriate.
- Detail view: purchase price, ARV, rehab budget, closing costs, holding/misc., selling costs, total project cost, structuring fee, gross profit, management fee, broker fee, net profit for investor, ROI, exit strategy, duration, and governance/transparency notes.

Deliverables:

- Updated marketplace card contract when needed
- Updated marketplace detail contract
- Public rendering of the new economics fields
- No loss of existing purchase CTA and blockchain visibility

### Slice 5: QA and Hardening

- Unit tests for validation and mapping logic.
- Integration tests for admin create-asset payload formation.
- API tests for payload normalization and persistence guards.
- Frontend responsive checks for the updated form.
- Import tests for both structured spreadsheet input and normalized PDF-derived input.
- Marketplace rendering checks for the new user-visible economics fields.

Deliverables:

- Passing targeted tests
- Evidence of no regressions in existing create/mint handoff flow
- Evidence that the new economics fields are visible in marketplace user surfaces

### Slice 6: Admin UX and Import Entry Refresh

- Move `Quick import` to the first visible position on `/admin/assets/new`.
- Reframe the page hierarchy around the real operator workflow for these briefs.
- Update import help text, labels, and affordances so supported formats are described truthfully.
- Remove the `Guardar borrador` / save-draft affordance from this flow because it does not currently persist a recoverable draft.
- Preserve existing preview/apply/async import behavior while changing the section order.
- Improve the rapid-import surface using `UI Ux Pro Max` guidance while preserving the existing button and card style system.

Current-state constraint:

- This slice must not imply that PDF import is already available.
- Supported formats to describe as shipped are:
  - `.csv`
  - `.txt`
  - `.tsv`
  - pasted tabular content from Excel

UI/UX quality bar for this slice:

- Keep the existing card and button visual language already present in admin.
- Improve hierarchy, spacing, and scanability around the import-first workflow.
- Preserve visible focus states, minimum touch-target sizing, and no horizontal overflow.
- Avoid adding a second disconnected import path or a hidden expert-only control cluster.

Deliverables:

- Updated section ordering on `/admin/assets/new`
- Updated import copy and affordances
- Removal of the misleading draft-save control until real draft persistence exists
- No regression in import preview/apply/queue behavior

### Slice 7: Reserved Follow-Up Slice

This slice is now dedicated to simplifying the quick-import interaction model.

Goals:

- Remove the visible async-import controls from the interface.
- Remove the quick-import QStash integration and related async-import wiring from this screen.
- Remove the explicit `Preview` button from the interface.
- Trigger preview automatically as soon as a valid import source is loaded.
- Add replacement confirmation before a second import overwrites the current imported state.

Behavior contract:

1. User lands on `/admin/assets/new` and sees `Quick import` first.
2. User uploads a supported file or pastes valid tabular content.
3. The system parses and previews immediately without requiring a separate preview action.
4. If no prior imported state exists, the preview/apply flow continues directly.
5. If prior imported state already exists and the user attempts a new import, show a confirmation modal.
6. Modal copy must explain that current imported changes will be lost and replaced by the new import.
7. Confirm replaces the imported state with the new parsed payload.
8. Cancel preserves the current imported state and dismisses the modal.

Interface removals for this slice:

- remove the visible `Queue async import` action
- remove the visible import-job tracker from this screen
- remove the visible `Preview and apply first row` action
- remove QStash-driven async import actions and status wiring that only exist to support the removed queue flow

Technical rule:

- The underlying canonical import parsing/mapping pipeline should continue to be reused.
- This slice changes interaction flow, not the canonical field-mapping contract.
- QStash-linked async import behavior should be removed from `/admin/assets/new`, including no-op or orphaned UI state that only exists to support the removed queue flow.
- If any generic import utilities remain for future use, they must not leak queue-specific UX concepts into this screen after the simplification.

Modal quality rule:

- Confirmation modal must follow the existing design system rather than introducing a new ad hoc pattern.
- It must be keyboard-accessible, focus-managed, and explicit about destructive replacement.
- Primary and secondary actions must remain consistent with the existing button system.

Deliverables:

- Auto-preview behavior on import load
- Replacement-confirmation modal for second import attempts
- Removal of preview/async controls from the visible interface
- Removal of QStash-related quick-import flow dependencies from this screen
- Preserved parsing/mapping compatibility underneath the UX simplification

### Slice 8: PDF Brief Intake

This slice adds real PDF support to the quick-import flow.

Goals:

- Accept PDF files from the same `Quick import` entrypoint used by spreadsheet imports.
- Extract text from the supported investment brief family without introducing a second asset-creation path.
- Normalize PDF-derived values into the same canonical import shape already used by spreadsheet imports.
- Preserve the same safety model: parse, preview automatically, let the user review/correct in the form.

Scope rule:

- This slice targets the recurring brief format already reviewed in BRI-161.
- It is not a generic “any PDF” ingestion feature.
- If a PDF does not match the supported brief family with enough confidence, the UI should fail clearly instead of silently mapping partial or incorrect values.

Technical design:

1. File intake accepts `.pdf` in the quick-import surface.
2. PDF text is extracted through a dedicated parser adapter.
3. The parser identifies supported labels and repeated sections from the brief family.
4. Extracted values are normalized into the same `Record<string, string>`-compatible shape expected by the current import mapping layer.
5. That normalized payload flows through the same preview/apply behavior already used by spreadsheet imports.

Parsing contract:

- Prefer deterministic label extraction over free-form inference.
- Use explicit label aliases for bilingual/variant headings where the brief family repeats them.
- Support the economics fields already modeled in this fix, including:
  - `Deal Number`
  - `Address`
  - `Purchase Price`
  - `After Repair Value (ARV)`
  - `Rehab Budget`
  - `Closing Costs`
  - `Holding & Misc.`
  - `Selling Costs`
  - `Total Project Cost`
  - `Minimum Capital Required`
  - `Structuring Fee`
  - `Net Profit (before distribution)`
  - `Management Fee`
  - `Broker Fee`
  - `Net Profit for Investor`
  - `ROI`
  - `Exit Strategy`
  - `Total Estimated Duration`
  - operator / sponsor / developer identity

Failure behavior:

- If no supported labels are found, show a clear import error message.
- If only a partial extraction is achieved, the result should surface as an incomplete preview, not as silent success.
- No background queueing or deferred processing should be reintroduced through this slice.

Review bar for implementation:

- The parser should be small, deterministic, and easy to audit.
- Mapping logic should remain centralized rather than duplicated between PDF and spreadsheet paths.
- Any heuristic extraction should be documented inline by naming and tests, not hidden in broad regex ambiguity.

Deliverables:

- PDF acceptance in the quick-import UI
- PDF-to-normalized-import parser adapter
- Shared import-path compatibility with existing spreadsheet mapping
- Clear error states for unsupported or weakly matched PDFs

### Slice 9: Clean-Code Audit

This fix must end with a dedicated `clean-code audit` slice using the repository's `clean-code` skill and the final reviewer gate.

Audit focus:

- intention-revealing names for economics fields, render helpers, and import adapters
- functions that do exactly one thing in admin mapping and marketplace rendering code
- reduction of duplication between import normalization, payload building, persistence mapping, and UI rendering
- extraction of coherent subcomponents when marketplace detail rendering becomes too large
- minimizing comments by improving naming and structure first
- reviewing argument count, side effects, and readability in helpers introduced by this fix
- ensuring compatibility code remains explicit and small instead of spreading ambiguity

Expected outputs:

- explicit list of clean-code findings or an explicit no-findings result
- follow-up refactors for any blocking readability/design issues
- confirmation that the final touched modules read as a clear top-down narrative

Completion rule:

- if the clean-code audit finds blocking issues, the fix remains incomplete until they are resolved or consciously documented for reviewer sign-off

### Slice 10: Reviewer Completion

- run the final reviewer gate after QA and clean-code audit are complete
- verify definition of done, governance alignment, and no unresolved blocking findings

### Slice 11: Admin Sidebar Visual Alignment

This slice improves the admin shell sidebar presentation.

Problem:

- the current sidebar exposes a native scrollbar that visually clashes with the glass-shell treatment
- the scrollbar reads like a browser artifact instead of part of the interface
- the current shell couples the full sidebar card to the scroll behavior, which makes the composition feel heavier than necessary

Goals:

- preserve full navigation overflow behavior
- remove the intrusive scrollbar presentation from the desktop sidebar
- keep the sidebar visually consistent with the existing BRIDS card, shell, and button language
- improve the internal composition so the sidebar header and navigation feel more intentional

UX rules:

- sidebar content must remain scrollable when navigation exceeds viewport height
- keyboard navigation and focus behavior must not regress
- the desktop shell is the primary target, but mobile drawer cleanup may share the same structural treatment where appropriate

Technical direction:

1. Refactor `AdminShell` so the sidebar uses a stable outer frame and a dedicated inner scroll region.
2. Keep identity content such as shell title and wallet summary visually anchored instead of forcing the entire shell to scroll as one slab.
3. Reuse an existing utility or introduce a tightly scoped sidebar scroll utility instead of scattering ad hoc overflow styles.
4. Prefer a CSS-first solution over a JS-driven workaround.

Acceptance criteria:

- `/admin/assets/new` no longer shows the intrusive sidebar scrollbar treatment from the current shell
- sidebar navigation remains fully usable and scrollable
- the result feels visually coherent with the rest of the admin interface
- no regression appears in desktop or mobile admin navigation behavior

## Test-First Contract

Before implementation closes:

- Add/adjust unit tests for subtype-specific required fields.
- Add tests for economics mapping into marketplace payload.
- Add tests for economics mapping into marketplace read model and public detail rendering.
- Add tests for backward compatibility with legacy records.
- Add tests proving the reused import pipeline accepts the extended spreadsheet mapping and normalized PDF payloads.
- Add tests proving auto-preview triggers on valid import load.
- Add tests proving replacement confirmation protects existing imported state until confirmed.
- Add tests proving supported PDF briefs normalize into the same import candidate shape as spreadsheet input.
- Add tests proving unsupported PDFs fail clearly instead of creating silent partial mappings.
- Complete the dedicated clean-code audit slice.
- Run `npm run validate`.

If any of these fail, fix is incomplete.

## Risk Controls

- Backward compatibility: preserve legacy fields and map defaults where needed.
- Migration safety: gate DB changes with tracked migration flow if schema changes are required.
- UI complexity: section-based form organization to avoid field clutter.
- Semantic integrity: avoid overloading tokenization derivation fields and out-of-scope media fields with brief economics meaning.

## Definition of Done Alignment

- `npm run validate` passes.
- Required docs for fix are present and current.
- Admin create flow can represent active deal model without proxy misuse.
- Marketplace receives and persists required economics fields.
- Marketplace users can see the required economics fields in the public experience.
- Dedicated `clean-code audit` slice completed with no unresolved blocking issues.
- No unresolved blocking findings in final reviewer pass.

## Linear Sync

Primary issue:

- `BRI-161` — Fix admin asset form alignment with Fix & Flip / New Construction investment model

This implementation artifact is the source of truth for execution slices and acceptance gating.
