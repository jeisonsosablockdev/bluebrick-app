# Blockchain Cycle (Gemini/Antigravity)

## Trigger
- Changes to `/programs`
- Solana runtime, signer, PDA, RPC, or devnet-proof changes in shared code
- On-chain behavior changes that require real devnet evidence

## Subagents
- `planner` (You, orchestrating)
- `solana` (invoke via `invoke_subagent`)
- `security` (invoke via `invoke_subagent`)
- `qa` (invoke via `invoke_subagent`)
- Add `nft` when mint, metadata, collection, or royalty scope exists.

## Required Policies
- `.agents/policies/blockchain-policy.md`
- `.agents/policies/security-policy.md`
- `.agents/policies/docs-policy.md`
- `.agents/policies/testing-policy.md`

## Antigravity Execution Sequence
| Step | Goal | Gemini Action |
| --- | --- | --- |
| 1 | Detect blockchain scope | Read `implementation_plan.md`. If architecture-new, run `reasoning-cycle` first. |
| 2 | Define runtime invariants | Spawn `solana` subagent to validate PDA and signer logic. |
| 3 | Review trust surface | Spawn `security` subagent in parallel to run `grep_search` on CPIs and signers. |
| 4 | Implement with in-code commentary | `solana` subagent implements code with module headers, Rust doc (`///`), and step-by-step logic indicators. |
| 5 | Sync docs | Update `knowledge/devnet-proof.md` using `write_to_file`. |
| 6 | Execute devnet flow | Use `run_command` to execute tests. Use `schedule` if it takes > 10s. |
| 7 | Run QA | Spawn `qa` subagent to run `pnpm validate`. |
| 8 | Review & Gate 2 | Perform Gate 2 audit verifying 4-layer isolation and in-code commentary; log findings in `walkthrough.md`. |

## Required Evidence in Walkthrough
- Commands run and background task status
- Transaction signatures
- Fetched account or state proof
- In-code commentary & clean-code findings
- Updated docs paths
