# NFT Cycle (Gemini/Antigravity)

## Trigger
- Mint, metadata, collection, royalty, or update-authority changes
- Metaplex or asset-lifecycle changes in backend, program, or UI code

## Subagents
- `planner` (You)
- `nft` (invoke via `invoke_subagent`)
- `solana` (invoke via `invoke_subagent`)

## Required Policies
- `.agents/policies/blockchain-policy.md`
- `.agents/policies/security-policy.md`

## Antigravity Execution Sequence
| Step | Goal | Gemini Action |
| --- | --- | --- |
| 1 | Detect NFT scope | Activate `reasoning-cycle` if architecture is new. |
| 2 | Define invariants | Spawn `nft` subagent to define mint, metadata, royalty, and collection rules. |
| 3 | Security review | Spawn `security` subagent to review privileged authorities. |
| 4 | Implement | Use `replace_file_content` to apply changes. |
| 5 | Docs sync | Sync `knowledge/nft-spec.md` using `write_to_file`. |
| 6 | Devnet execution | Execute real mint flows via `run_command`. |
| 7 | QA | Capture output and account state for `walkthrough.md`. |

## Required Evidence in Walkthrough
- Real transaction signatures for mint/metadata updates
- Metadata or collection account proof
- Royalty or seller fee validation notes
