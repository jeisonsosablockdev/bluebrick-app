# Blockchain Cycle

## Trigger
- Changes to `/programs`
- Solana runtime, signer, PDA, RPC, or devnet-proof changes in shared code
- On-chain behavior changes that require real devnet evidence

## Participants
- `planner`
- `solana`
- `security`
- `docs`
- `qa`
- `reviewer`
- Add `nft` when mint, metadata, collection, or royalty scope exists.

## Required Policies
- `blockchain-policy`
- `security-policy`
- `docs-policy`
- `testing-policy`

## Execution Sequence
| Step | Owner | Goal | Gate |
| --- | --- | --- | --- |
| 1 | `planner` | Detect impacted blockchain scope and activate the workflow | Paths, policies, and required docs are identified |
| 2 | `solana` | Define runtime invariants and devnet acceptance plan | Authority, signer, PDA, and state assumptions are explicit |
| 3 | `security` | Review the trust surface before high-risk implementation | Blocking risks are surfaced before the diff grows |
| 4 | `solana` | Implement the smallest safe change with tests first | Relevant tests move before green implementation |
| 5 | `docs` | Sync canonical docs and RFC or feature-note traceability | Required docs paths are updated |
| 6 | `solana` | Execute the real devnet flow | Real transaction is submitted, confirmed, and read back |
| 7 | `qa` | Run repo validation and focused verification | `npm run validate` and required targeted checks pass |
| 8 | `reviewer` | Audit the final diff and gate completion | No unresolved blocking findings remain |

## Required Evidence
- Commands run
- Transaction signatures
- Fetched account or state proof
- Updated docs paths
- Validation and test results

## Handoffs
- `planner -> solana/security`: touched paths, open risks, required evidence
- `solana -> docs/qa`: commands, signatures, state readbacks, touched docs
- `qa/security -> reviewer`: gate results and residual risks
