# Reasoning Cycle (Gemini/Antigravity)

## Trigger
- RFC creation o actualización para features complejos
- Feature planning que requiere arquitectura descubierta
- Security threat modeling con múltiples stakeholders
- Algorithm design con procedimientos step-by-step
- Architecture Decision Records (ADRs) con trade-offs explícitos

## Subagents
- `reasoning` (invoke via `invoke_subagent` configured for high reasoning effort)
- `planner` (You)

## Required Policies
- `.agents/policies/docs-policy.md`

## Antigravity Execution Sequence
| Step | Goal | Gemini Action |
| --- | --- | --- |
| 1 | Detect & Verify | Locate/verify the OKF Problem and Solution artifacts (`knowledge/features/` or `knowledge/fixes/`) automatically scaffolded by `git-start.sh`. |
| 2 | Spawn Reasoning | Use `invoke_subagent` to analyze the scope and map out the problem/solution details. Wait for subagent to return the analysis. |
| 3 | Generate Artifacts | Fill out the OKF Problem and Solution artifacts in the repository. |
| 4 | Mirror Plan & Approve | Copy the exact contents of the repository's OKF Solution Artifact into `implementation_plan.md` (internal session artifact) and set `RequestFeedback: true` to request user approval. |
| 5 | Iterate | If user rejects, update both the repository OKF file and the mirrored session `implementation_plan.md` with new details. |
| 6 | Handoff | Once approved, proceed to downstream workflows (blockchain-cycle, frontend-cycle, etc.). |

## Output Artifacts
- `knowledge/features/feature-<slug>.md`
- `knowledge/features/feature-<slug>-implementation.md`
- `knowledge/rfc/rfc-<slug>.md`
- `knowledge/adr/adr-<slug>.md`
- `knowledge/reasoning-plan-<timestamp>.md`
