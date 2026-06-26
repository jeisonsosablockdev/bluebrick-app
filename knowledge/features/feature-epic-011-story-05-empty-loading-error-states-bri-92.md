# EPIC-011 Story 05: Empty, Loading, and Error States

## Summary
- Added polished operational states for `/admin/collections` before the richer card grid slices.
- Loading now communicates the server-side ownership, snapshot, and editable-section checks with a responsive skeleton.
- Empty state now explains that no owned/indexed collections are available and links to collection creation and mint tools.
- Error state now presents a degraded workspace message, preserves the server error text, and exposes a retry action.

## Boundaries
- No read-model contract changes.
- No client-side authority or ownership decisions.
- No collection detail navigation or final card layout in this slice.
- The states remain server-rendered and only reflect `loadAdminCollectionsPageState()`.

## Validation
- `tests/app/admin-collections-page.test.ts` covers loading, empty, error, and existing success rendering.
- Loading state exposes polite live-region metadata for assistive technology.
- Error state uses assertive live-region metadata and keeps the error copy inside the admin shell.
