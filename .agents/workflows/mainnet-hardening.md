# Mainnet Hardening (Gemini/Antigravity)

## Trigger
- Pre-mainnet release work
- Security-critical rollout or authority-model changes
- Explicit hardening, audit, or launch-readiness requests

## Subagents
- `planner` (You)
- `security` (invoke via `invoke_subagent`)
- `qa` (invoke via `invoke_subagent`)

## Required Policies
- All policies in `.agents/policies/` apply.

## Antigravity Execution Sequence
| Step | Goal | Gemini Action |
| --- | --- | --- |
| 1 | Detect surfaces | Check if threat modeling requires `reasoning-cycle` first. |
| 2 | Threat modeling | Spawn `security` subagent to list trust boundaries, CPI chains, and replay vectors. |
| 3 | Close gaps | Apply fixes using `multi_replace_file_content`. |
| 4 | QA Validation | Use `run_command` for full repo validation. Send long checks to background. |
| 5 | Update Docs | Record hardening traceability using `write_to_file`. |
| 6 | Final Review | Audit the final risk profile and write a detailed `walkthrough.md`. |

## Required Evidence in Walkthrough
- Full validation outputs
- Security findings and mitigations
- Devnet proof links
