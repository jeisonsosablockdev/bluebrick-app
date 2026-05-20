# Mainnet Hardening

## Trigger
- Pre-mainnet release work
- Security-critical rollout or authority-model changes
- Explicit hardening, audit, or launch-readiness requests

## Participants
- `planner`
- `security`
- `reviewer`
- `qa`
- `docs`
- Add `solana`, `frontend`, and `nft` according to the touched runtime surfaces.

## Required Policies
- `security-policy`
- `blockchain-policy`
- `frontend-policy`
- `docs-policy`
- `testing-policy`

## Execution Sequence
| Step | Owner | Goal | Gate |
| --- | --- | --- | --- |
| 1 | `planner` | Detect the affected runtime surfaces and activate the hardening path | Scope and dependent workflows are locked |
| 2 | `security` | Run the threat and trust-boundary review first | High-risk findings are visible before closure work |
| 3 | Domain specialists | Close implementation gaps and produce missing proofs | Each active workflow has the required evidence |
| 4 | `qa` | Run the full validation and regression set required by the scope | Validation and required E2E checks pass |
| 5 | `docs` | Record hardening traceability and any required governance docs updates | Canonical records stay current |
| 6 | `reviewer` | Run explicit clean-code audit and block or clear completion based on the remaining risk profile | No unresolved critical or high findings remain and clean-code findings are resolved or documented |

## Blocking Gates
- No mainnet hardening task closes with unresolved critical or high-risk findings.
- No release hardening task closes without the underlying workflow evidence already captured.

## Required Evidence
- Validation results
- Security findings and mitigations
- Relevant devnet proof links
- Dependency or audit outputs when applicable
- Clean-code findings or explicit no-findings result
- Updated docs paths
