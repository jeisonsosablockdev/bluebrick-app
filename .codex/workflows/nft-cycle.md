# NFT Cycle

## Trigger
- Mint, metadata, collection, royalty, or update-authority changes
- Metaplex or asset-lifecycle changes in backend, program, or UI code
- Any task where NFT rules add constraints on top of blockchain or frontend work

## Participants
- `planner`
- `nft`
- `solana`
- `security`
- `docs`
- `qa`
- `reviewer`
- Add `frontend` when the mint or inventory flow has user-facing UI changes.

## Required Policies
- `blockchain-policy`
- `security-policy`
- `docs-policy`
- `testing-policy`

## Execution Sequence
| Step | Owner | Goal | Gate |
| --- | --- | --- | --- |
| 1 | `planner` | Detect NFT scope and layer this workflow over the active domain workflows | NFT-specific evidence and docs are identified |
| 2 | `nft` | Define the mint, metadata, royalty, collection, and authority invariants | Asset rules are explicit before implementation |
| 3 | `solana` | Align runtime, PDA, and devnet execution details | On-chain execution plan matches the NFT model |
| 4 | `security` | Review privileged authorities and mutation paths | Blocking authority or ownership risks are surfaced early |
| 5 | `nft` + `solana` | Implement the smallest safe change with tests first | Relevant tests lead the implementation |
| 6 | `docs` | Sync `docs/nft-spec.md`, `docs/devnet-proof.md`, and traceability docs when required | Canonical NFT documentation is current |
| 7 | `qa` | Verify the mint or metadata flow with repo gates and targeted checks | Required validation and evidence are captured |
| 8 | `reviewer` | Run explicit clean-code audit and audit the final diff plus completion status | No unresolved blocking findings remain and clean-code findings are resolved or documented |

## Blocking Gates
- No NFT task closes without real mint or metadata evidence when acceptance depends on on-chain behavior.
- Authority or royalty changes do not close without explicit review.

## Required Evidence
- Real transaction signatures when on-chain acceptance applies
- Metadata or collection account proof
- Royalty or seller fee validation notes
- Clean-code findings or explicit no-findings result
- Updated docs paths
- Validation and targeted test results

## Handoffs
- `planner -> nft/solana/security`: affected asset flows, evidence expectations, required docs
- `nft/solana -> docs/qa`: mint plan, proof artifacts, touched files
- `qa/security -> reviewer`: gate results and unresolved risks
