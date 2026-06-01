# Fix: Marketplace map pin leader stacking

## Linear
- Parent issue: `BRI-164`

## Problem
When two marketplace map pins are geographically close, one pin's vertical leader line can render over another pin card. This makes the map feel visually noisy and makes the overlapping card harder to read.

## Why It Matters
The map is intended to feel premium and exploratory. Overlapping leader lines break the visual hierarchy: cards should read as primary objects, while leader lines should feel secondary and recede behind nearby cards.

## Expected Outcome
When marketplace map pins overlap visually:
- pin cards remain visually dominant
- leader lines do not appear on top of nearby pin cards
- hover/focus activation remains unchanged
- selected/hovered camera behavior remains unchanged

## Scope
Change only marketplace map pin rendering order in `MarketplaceMapClient`.

Keep unchanged:
- marker content
- marker size
- leader color
- anchor dot
- Mapbox style
- map camera focus behavior
- marketplace list/detail behavior

## Gaps Today
- Pins render in source order, so a northern marker can be painted after a southern marker and place its leader line over the southern card.
- No test confirms marker render order for overlapping leader/card cases.

## Open Questions
- None for this slice. The desired behavior is deterministic visual stacking where cards below/south render above leader lines from cards above/north.

## Acceptance Criteria
- Marketplace map markers render north-to-south by latitude.
- Southern/lower marker cards paint after northern markers, allowing their cards to cover crossed leader lines.
- Existing pin activation and camera behavior still pass.
