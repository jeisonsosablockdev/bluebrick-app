# Docs Policy (Gemini/Antigravity)

## Canonical Sources
- `knowledge/governance/documentation-policy.md`
- `knowledge/governance/pr-policy-source-of-truth.json`
- `scripts/ci/check-required-docs.sh`

## Apply When
- Product code, governance summaries, RFCs, or agent orchestration files change

## Antigravity Execution Constraints
- `knowledge/governance/*` remains the single source of truth; `AGENTS.md` and `.agents/*` only reference or compress it.
- Use `replace_file_content` or `multi_replace_file_content` to update required canonical docs by impacted scope before completion.
- RFC structure, status values, and traceability must follow the documentation policy, templates, and enforcement scripts.
- **Planning Mode & OKF Alignment**: Non-trivial work requires a planning artifact. To avoid context drift, the repository-tracked OKF Solution/Implementation Artifact (`knowledge/features/feature-*-implementation.md` or `knowledge/fixes/fix-*-implementation.md`) is the **single source of truth** for the technical plan. The agent MUST keep the internal session artifact (`implementation_plan.md` in the brain folder) perfectly in sync as an exact copy of this OKF Solution Artifact.
- **Graphify & Token Savings**: The agent MUST consult `.agents/graph.json` and OKF indexes first to locate relevant code and documentation nodes before performing recursive directory searches or reading full file contents. This avoids unnecessary context token consumption.
- New features and fixes use a dual artifact pair (problem/solution), which are automatically scaffolded upon branch creation. The agent must fill them out during planning.
- Multi-SPEC work requires the first SPEC before delivery SPECs.
- When RFC applies in the SPEC model, RFC creation or update belongs to that first SPEC.
- **Mandatory Local Validation**: Before pushing commits or opening a PR, the agent MUST run the full local validation check (`pnpm validate`) to catch index drift, lint errors, and typecheck warnings locally. Pushing code with failing local checks is strictly forbidden.
- **CI Wait Strategy**: To wait for GitHub CI check results, the agent MUST NOT poll continuously. Instead, it must schedule a single timer of at least 180 seconds (or look up the average execution duration of past runs) to allow CI checks to complete before querying their status.

## Required Evidence
- Updated canonical docs paths
- Feature-note or RFC traceability paths when required
- Socratic planning evidence for documentation/spec slices using explain-like-socrates
- Delivery slices require a clean-code design contract
- Output from `scripts/ci/check-required-docs.sh` or `pnpm validate` provided in the final `walkthrough.md`.
