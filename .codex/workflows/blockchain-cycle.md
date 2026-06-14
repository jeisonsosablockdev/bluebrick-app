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
| 1 | `planner` | Detect blockchain scope and check if complexity requires reasoning-cycle first | If architecture-new or multi-slice, activate reasoning-cycle before step 2 |
| 2 | `reasoning` | **SELECT/ADAPT**: Define problem type, list PDA seeds, rent-exempt lamports, signer requirements, authority constraints | Problem classification explicit, domain adaptation for Solana documented |
| 3 | `solana` | Define runtime invariants and devnet acceptance plan based on reasoning output | Authority, signer, PDA, and state assumptions validated by reasoning trace |
| 4 | `security` | Review the trust surface before high-risk implementation | Blocking risks are surfaced before the diff grows |
| 5 | `solana` | Implement the smallest safe change with tests first | Relevant tests move before green implementation |
| 6 | `docs` | Sync canonical docs and RFC or feature-note traceability | Required docs paths are updated |
| 7 | `solana` | Execute the real devnet flow | Real transaction is submitted, confirmed, and read back |
| 8 | `qa` | Run repo validation and focused verification | `npm run validate` and required targeted checks pass |
| 9 | `reviewer` | Run explicit clean-code audit, audit the final diff, and gate completion | No unresolved blocking findings remain and clean-code findings are resolved or documented |

## Required Evidence
- Commands run
- Transaction signatures
- Fetched account or state proof
- Clean-code findings or explicit no-findings result
- Updated docs paths
- Validation and test results

## Handoffs
- `planner -> solana/security`: touched paths, open risks, required evidence
- `solana -> docs/qa`: commands, signatures, state readbacks, touched docs
- `qa/security -> reviewer`: gate results and residual risks
