# Refactor Cycle (Gemini/Antigravity)

## Trigger
- Explicit `refactor/*` work
- Clean-code findings that require runtime changes
- Requests to split a large component, hook, module, service, or test surface
- Follow-up debt slices from audits

## Subagents
- `planner` (You)
- Domain specialist subagents depending on scope (`frontend`, `solana`, etc.)

## Antigravity Execution Sequence
| Step | Goal | Gemini Action |
| --- | --- | --- |
| 1 | Plan Slice | Use `task.md` to map each specific, atomic refactor slice. DO NOT bundle unrelated changes. |
| 2 | TDD Contract | Use `run_command` to add or tighten characterization tests before modifying code. |
| 3 | Refactor | Apply minimal changes using `multi_replace_file_content`. |
| 4 | QA | Run targeted tests via `run_command`. |
| 5 | Clean Code Pass | Use `grep_search` to audit for remaining debt (naming, coupling). |
| 6 | Iteration | Mark slice as `[x]` in `task.md`. Start next slice. |
| 7 | Final Audit | Ensure `pnpm validate` passes and write final `walkthrough.md`. |

## Required Evidence in Walkthrough
- Slice boundaries and test validations
- Explicit `pnpm validate` success
- Clean-code findings explicitly documented
