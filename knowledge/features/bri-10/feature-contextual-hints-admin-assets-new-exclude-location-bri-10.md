---
type: Feature Spec
title: Feature Contextual Hints Admin Assets New Exclude Location BRI- 10
description: Feature Contextual Hints Admin Assets New Exclude Location BRI- 10 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-contextual-hints-admin-assets-new-exclude-location-bri-10.md
---

# Feature: Contextual hints in `/admin/assets/new` excluding Location (BRI-10)

## Problem

The admin asset creation flow at `/admin/assets/new` mixes required identity, commercial, collection, media, and type-specific fields without consistent contextual guidance.

Today, only the differential fields by type expose short tooltip-style hints. The rest of the create flow leaves operators guessing:

- what each field expects,
- which format is preferred,
- and how the value is used in admin or marketplace surfaces.

The separate `Location` section is not part of this hint request and must remain unchanged.

## Why It Matters

- UX risk: admin users lose time interpreting internal field names and placeholder-only inputs.
- Data quality risk: ambiguous fields increase inconsistent capture across projects.
- Product consistency risk: the route already has one hint pattern, but only in part of the flow.
- Change management risk: if guidance is not centralized, future field additions will drift again.

## Expected Outcome

`/admin/assets/new` should show short, localized contextual hints for asset-creation inputs outside the `Location` section, reusing the existing `?` guidance pattern already present in type-differential fields.

Expected behavior:

- Non-location input fields show a short hint and a compact `?` helper affordance.
- Hints are available in `ES`, `EN`, and `PT`.
- Hint copy stays short and consistent.
- Import actions such as preview/replace controls remain unchanged.
- Validation, payloads, save/import/mint logic, and responsive behavior remain unchanged.

## Current Gaps

- `Identification` fields rely on placeholders only.
- `Commercial description` textareas rely on placeholders only.
- `Collection` fields have section-level copy but not field-level guidance.
- `Media and documents` file inputs have labels but no field-level context.
- `Mint seed data` shows derived values but does not explain what each read-only field represents.
- The route uses more than one field presentation style, which creates inconsistency.

## Open Questions Resolved For This Slice

- `Location` remains excluded from hint coverage.
- Existing type-differential hints remain the canonical UX pattern to extend.
- The implementation may centralize reusable guided field primitives so copy and styling stay aligned across sections.

## Acceptance Mapping

1. All non-location asset-creation fields on `/admin/assets/new` expose contextual guidance.
2. `Location` fields expose no new hint affordances.
3. Guidance copy is localized in `ES/EN/PT`.
4. No backend contract, validation, or import/mint behavior changes.
5. Responsive layout remains intact.
