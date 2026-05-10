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
| 1 | `planner` | Select the routes and critical states that need responsive proof | Target surfaces and artifacts are fixed |
| 2 | `frontend` | Ensure mobile-safe layouts before final verification | Touch targets, modals, and overflow risks are addressed |
| 3 | `qa` | Capture evidence at 320, 375, 768, and 1024 widths | Required artifacts and checklist are produced |
| 4 | `reviewer` | Confirm the checklist and artifacts are sufficient for closeout | No unresolved responsive blockers remain |

## Blocking Gates
- Any horizontal overflow failure blocks completion.
- Missing touch-target or modal evidence blocks completion.
- Missing checklist output blocks completion.

## Required Evidence
- Artifact set for 320, 375, 768, and 1024 widths
- No-overflow confirmation
- Touch-target and modal notes
- Browser or MCP evidence references
