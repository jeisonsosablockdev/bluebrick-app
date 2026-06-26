# STORY-011-06 / BRI-98 / Gallery Tabs Shell

## Summary
- Adds a dedicated gallery shell to `/admin/collections/[id]`.
- Keeps `galleryImages` and `propertyImages` in separate tabs instead of collapsing both media groups into one rail.
- Stages per-group `add`, `replace`, and `delete` action handoffs without introducing upload or mutation logic yet.

## Why
- The gallery flow is larger than a text editor and needed its own surface before later media mutation slices.
- Splitting the groups now preserves the approved data model and avoids reopening the detail shell when upload actions land.

## Validation
- `tests/components/admin-collection-gallery-shell.test.ts`
- `tests/app/admin-collection-detail-page.test.ts`
