---
type: Feature Spec
title: Feature Contextual Hints Admin Assets New Exclude Location BRI- 10 Implementation
description: Feature Contextual Hints Admin Assets New Exclude Location BRI- 10 Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-contextual-hints-admin-assets-new-exclude-location-bri-10-implementation.md
---

# Implementation: Contextual hints in `/admin/assets/new` excluding Location (BRI-10)

## Resolution

Extend the existing hint UX from the differential asset-type section into the rest of the asset creation route by introducing shared guided-field primitives for inputs, textareas, selects, and file labels.

The implementation keeps `Location` untouched and does not alter validation or payload behavior.

## Slice Plan

### Slice BRI-10
- Add reusable guided field helpers under `components/admin/asset-creation/sections/`.
- Migrate non-location sections to those helpers:
  - `AssetTypeSelectionSection`
  - `AssetIdentificationSection`
  - `AssetCommercialDescriptionSection`
  - `AssetMediaSection`
  - `AssetCollectionSection`
  - read-only `Mint seed data` fields in `asset-creation-form.tsx`
- Preserve `AssetLocationSection` without hint affordances.
- Add targeted component tests proving hint presence outside `Location` and absence inside `Location`.

## Test-First Contract

Targeted regression coverage will verify:

- guided hints render in identification/commercial/media/collection surfaces,
- location fields do not receive the new hint affordance,
- multisection rendering stays stable in jsdom,
- no validation contract changes are required.

## Tooling

- `vitest` with `jsdom` for component rendering assertions
- existing `npm run lint`
- existing `npm run typecheck`
- docs governance validation through `scripts/ci/check-required-docs.sh` or `npm run validate:docs-governance`

## Gates

- Frontend-cycle participants: `planner`, `frontend`, `qa`, `docs`, `reviewer`
- Required evidence:
  - updated docs paths,
  - targeted test command output,
  - lint/typecheck/docs-governance output,
  - explicit clean-code pass/no-blockers result

## Linear Sync

Linear issue `BRI-10` stays aligned to this artifact:

- scope is UX guidance only,
- `Location` remains excluded,
- backend contracts and save/import/mint logic remain unchanged.
