# Fix: Remove UI States section from landing (BRI-63)

## Summary
The `UI States` block (Loading/Empty/Error cards) was removed from the public landing page.

## Scope
- Removed `UiStatesSection` import and render call from `app/page.tsx`.
- Deleted unused component `components/sections/ui-states.tsx` to avoid dead code.

## Motivation
The section was placeholder UI and should not be exposed on the landing experience.

## Validation
- `npm run validate`

## Related
- Linear: BRI-63
