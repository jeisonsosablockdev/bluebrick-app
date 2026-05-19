# Responsive QA

## Trigger
- UI changes that affect layout or critical actions
- Browser-critical flows that need mobile and desktop proof
- Any task explicitly requesting responsive verification

## Participants
- `planner`
- `frontend`
- `qa`
- `reviewer`
- Add `security` when the responsive surface also carries auth or wallet trust boundaries.

## Required Policies
- `frontend-policy`
- `testing-policy`

## Execution Sequence
| Step | Owner | Goal | Gate |
| --- | --- | --- | --- |
| 1 | `planner` | Select the routes and critical states that need responsive proof | Target surfaces, required artifacts, and blocking states are fixed |
| 2 | `frontend` | Resolve layout risk before final verification | Global overflow is addressed before local polish, and touch targets plus modal states are ready to inspect |
| 3 | `qa` | Capture evidence at 320, 375, 768, and 1024 widths | Every required artifact exists, evidence is readable, and overflow notes are explicit |
| 4 | `reviewer` | Confirm the checklist and artifacts are sufficient for closeout | No ambiguous evidence, no unresolved overflow, and no missing browser-critical proof remain |

## Blocking Gates
- Any horizontal overflow failure blocks completion.
- Any ambiguous or unreadable capture blocks completion.
- Missing touch-target or modal evidence blocks completion.
- Missing route-state coverage for browser-critical flows blocks completion.
- Missing checklist output blocks completion.

## Required Evidence
- Artifact set for 320, 375, 768, and 1024 widths
- Route-state artifact index for each browser-critical surface under review
- No-overflow confirmation, starting with global page overflow before local component notes
- Touch-target and modal notes
- Browser or MCP evidence references
