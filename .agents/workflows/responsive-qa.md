# Responsive QA (Gemini/Antigravity)

## Trigger
- UI changes that affect layout or critical actions
- Browser-critical flows that need mobile and desktop proof
- Any task explicitly requesting responsive verification

## Subagents
- `qa` (invoke via `invoke_subagent`)
- `frontend` (invoke via `invoke_subagent`)

## Antigravity Execution Sequence
| Step | Goal | Gemini Action |
| --- | --- | --- |
| 1 | Identify target routes | Record routes in `task.md`. |
| 2 | Resolve layout risk | Execute frontend adjustments via `replace_file_content`. |
| 3 | QA Check | Use Chrome DevTools MCP tools or Playwright to capture evidence at 320, 375, 768, and 1024 widths. |
| 4 | Review | Verify global overflow and touch targets. Document missing coverage as a block. |
| 5 | Finalize | Provide artifact list and states in `walkthrough.md`. |

## Blocking Gates
- Any horizontal overflow failure blocks completion.
- Missing touch-target or modal evidence blocks completion.
- ambiguous or unreadable capture blocks completion.
- Route-state artifact index is required.
