## Summary
This PR cleans up the duplicate `BRI-164` marketplace 3D visual markdown files from the `knowledge/features/` root directory. All references across README tables, roadmaps, and feature files have been updated to point to the correct versions under `bri-164-marketplace-3d-visual/`.

**Key Changes**
- Deleted 28 root-level duplicate files under `knowledge/features/`.
- Updated `knowledge/README.md` and rebuilt the index.
- Corrected roadmap files (`app-technical-roadmap-investor-brief.md` and `.tex`).
- Fixed internal paths in subdirectory files and fixes files.

---

## Issue
- **Linear:** `BRI-164`

## RFC
- **RFC:** `N/A`

## Risks / Riesgos
- **Risk:** Low. Documentation cleanup only, no runtime code changes.

## Rollback Plan
- **Rollback:** Revert the merge commit or restore the deleted markdown files.

## Devnet Proof / Prueba Devnet
- **Devnet Proof:** `N/A` (No on-chain interactions are performed).

## Feature Flag Strategy
- **Feature Flag:** N/A.

## Human Acceptance
Status: approved
> ✅ Approved and manually verified in the local workspace session.
> **Approved by:** Jay / Jaymusicmachine

## Walkthrough Artifact
- **Path:** [walkthrough.md](file:///Users/jaymusicmachine/.gemini/antigravity-ide/brain/a95525be-a6f3-425c-8824-89637ae7935e/walkthrough.md)

## Validation
- Documentation validation completed successfully:
  `npm run validate`

## Required Labels
- [x] `scope:docs`
- [x] `type:refactor`
- [x] `risk:low`