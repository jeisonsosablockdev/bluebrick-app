# STORY-001-04 Phase 1 Inventory (Peer-Review Artifact)

## Purpose
Formal inventory of implicit logic currently embedded in [`components/admin/asset-creation-form.tsx`](/Users/jaymusicmachine/Documents/Desarrollo/brids/components/admin/asset-creation-form.tsx) to reduce risk of functional drift during refactor.

## Legacy Logic Map
| Legacy concern | Current location | Target module | Risk if omitted |
| --- | --- | --- | --- |
| Core form state initialization (`AssetForm`, upload refs, status flags) | Top-level `useState` declarations | `components/admin/asset-creation/types.ts` + reducer initial state | Broken defaults and hidden regressions on first render |
| Mint quantity derivation from `buildingTotalUnits` | `derivedMintQuantityFromType` + `mintQuantityValue` memos | `selectors.ts` | Incorrect mint setup enablement |
| Validation fusion (`required + type + compatibility`) | `requiredErrors`, `typeValidation`, `compatibilityErrors`, `currentValidationErrors` memos | reducer + selectors + validation helpers | False positives/negatives in continuation gate |
| Auto-suggestion of `collectionName` / `collectionSymbol` | `useEffect` with `suggestCollectionFromIdentity` + manual overrides | container orchestration + reducer actions | Manual overrides being overwritten unexpectedly |
| Upload status patching by field | `patchUploadState` closure | reducer action `patchUploadFieldState` | Cross-field UI state corruption |
| Import job tracking state machine | `importJob` state + parser helpers + polling side effects | `useAssetImportJobs` hook + reducer actions | Stuck progress UI and inconsistent error reporting |
| Marketplace payload derivation (`deriveNftPriceUsd`, docs/highlights builders) | pure helpers in legacy file | keep pure in dedicated helper module | Wrong business payload and failed submissions |
| Continuation tone/message UX guard | `continuationTone` / `continuationMessage` memos | selector + presentational layer | Incorrect UX instructions for operator |
| Snapshot payload composition | `snapshotFormData` memo | selector `selectSnapshotFormData` | Mismatch in mint snapshot handoff |
| Validation-error recovery effect | `useEffect` syncing `formStatus` and `validationErrors` | reducer-driven transition rules | Form blocked in stale error mode |

## Engineering Contracts Extracted in Phase 1
- Canonical state and field shapes must come only from:
  - `components/admin/asset-creation/types.ts`
- State transitions must be reducer-based:
  - `components/admin/asset-creation/reducer.ts`
- Action surface is explicit and typed:
  - `components/admin/asset-creation/actions.ts`
- Derived business values must be selectorized:
  - `components/admin/asset-creation/selectors.ts`

## Peer Review Checklist
- [ ] Two-engineer walkthrough completed over legacy file sections (`state`, `effects`, `submit`, `uploads`, `imports`).
- [ ] Each row in Legacy Logic Map mapped to concrete target module/owner.
- [ ] No known implicit behavior left without destination module.
- [ ] Any intentionally deferred behavior documented in follow-up task list.
