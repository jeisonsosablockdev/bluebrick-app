# Refactor Cycle

## Trigger
- Explicit `refactor/*` work
- Clean-code findings that require runtime changes
- Requests to split a large component, hook, module, service, or test surface
- Follow-up debt slices from audits
- Any implementation where the primary goal is improving structure while preserving behavior

## Participants
- `planner`
- Domain specialist for the touched runtime surface, such as `frontend`, `backend`, `solana`, or `nft`
- `qa`
- `docs`
- `reviewer`
- Add `security` when the refactor touches auth, wallet, admin, payment, signer, persistence, or other trust-boundary code.

## Required Policies
- `docs-policy`
- `testing-policy`
- Add the dominant runtime policy, such as `frontend-policy`, `blockchain-policy`, or `security-policy`, according to the touched surface.

## Required Skills
- `tdd-workflows-tdd-refactor`: use during planning and execution when a refactor slice needs RED/GREEN/REFACTOR discipline, characterization tests, or coverage-strengthening before moving code.
- `code-refactoring-refactor-clean`: use for the explicit clean-code/refactor pass before each slice merge and for the final strict audit slice.
- `code-refactoring-tech-debt`: use when a clean-code audit finds non-blocking P2/P3 debt that must be split into future atomic slices instead of bundled into the current slice.
- `code-refactoring-context-restore`: use when resuming a paused refactor to reconstruct branch state, artifact status, completed slices, pending slices, and validation history before editing.
- `clean-code`: use as the general reviewer gate when no more specific refactor skill is needed, or alongside `code-refactoring-refactor-clean` for broad naming, duplication, dead-code, and coupling review.

## Optional Tooling References
- OpenAI Developers tooling is not mandatory for every refactor.
- When a refactor slice depends on AI-assisted API, SDK, framework, or tooling guidance, record the OpenAI Developers docs/tooling reference in the governing artifact before implementation closes.
- Motion/UI refactors must also follow the `frontend-cycle` Motion 12 and OpenAI Developers documentation requirements when motion behavior, syntax, or tooling is in scope.

## Execution Sequence
| Step | Owner | Goal | Gate |
| --- | --- | --- | --- |
| 1 | `planner` | Identify the refactor target, behavioral invariants, affected tests, required artifact, and branch shape | The work has a governing artifact and no implementation starts from an underspecified cleanup wish |
| 2 | `docs` | Create or update the refactor artifact with the atomic slice map | The artifact lists each slice, branch, one-change scope, test-first plan, merge target, and rollback note |
| 3 | Domain specialist | Add or tighten tests for the one behavior protected by the slice | The slice has a RED or coverage-strengthening test before runtime code changes |
| 4 | Domain specialist | Apply the smallest behavior-preserving refactor for that slice | The diff changes only the slice target and keeps public behavior stable |
| 5 | `qa` | Run targeted tests for the slice plus any workflow-specific checks | Targeted validation passes and evidence is recorded in the artifact |
| 6 | `reviewer` | Run a clean-code pass on the slice before merge | No blocking smell, hidden behavior change, dead code, or over-broad scope remains |
| 7 | `docs` | Sync artifact status and Linear after each merged slice | The artifact reflects exact commits, validation, residual risks, and next slice |
| 8 | `reviewer` | Run final strict audit after the last slice | No unresolved blocking findings remain and any P2 debt is explicitly documented as future slices |

## Slice Model
- Use one branch per slice.
- Each slice owns exactly one extraction, one naming cleanup, one dependency inversion, one test-hardening move, or one dead-code removal.
- Do not bundle unrelated files just because they are nearby.
- If a refactor reveals another smell, document it as a new slice instead of expanding the current slice.
- Merge each slice into the integration branch before starting the next implementation slice.
- For small single-slice refactors, the slice branch can merge directly to the target branch when the artifact says so.

## Required Artifact Content
- Refactor work uses the same artifact enforcement path as feature/security/nft work: `docs/features/feature-<slug>.md` and `docs/features/feature-<slug>-implementation.md`.
- Problem: what structure is hurting maintainability, testability, reliability, or clarity.
- Current behavior: what must not change.
- Invariants: user-visible behavior, API contracts, data contracts, security assumptions, and performance boundaries.
- Slice map: one branch per change with runtime scope and test scope.
- TDD plan: which tests go RED or which existing tests are tightened before code changes.
- Validation plan: targeted tests, `npm run validate`, browser evidence, devnet proof, or DB validation as applicable.
- Review plan: explicit clean-code/reviewer pass before each merge and final strict audit after the last slice.
- Linear sync: what will be reported after every slice and at closeout.

## TDD Contract
- Refactor slices still start with tests.
- A valid RED can be a new regression test, a characterization test, or a tightened assertion that proves behavior before moving code.
- When true RED is impossible because the behavior is already covered, record the coverage-strengthening rationale in the artifact before runtime changes.
- Never rely on "it compiles" as the only proof for a behavior-preserving refactor.

## Branching Contract
- Multi-slice refactors use the Linear initiative branch as the integration branch: `initiative/bri-<id>-<name>`.
- The Linear initiative branch starts from latest `develop` and must match the parent Linear issue `git branch name` field.
- Slice branches start from the Linear initiative branch, not directly from `develop`.
- Spec/documentation slice: `refactor/<scope>-<slug>-bri-<id>-s01-spec`.
- Delivery slices: `refactor/<scope>-<slug>-bri-<id>-sNN-<one-change-name>`.
- Final audit slice: `refactor/<scope>-<slug>-bri-<id>-sNN-clean-code-audit`.
- Commit messages should identify the preserved behavior or extracted boundary, not just say "cleanup".

## Blocking Gates
- No non-trivial refactor proceeds without the required artifact.
- No multi-slice refactor proceeds without a spec slice.
- No slice can merge if it changes behavior outside its stated invariant without artifact approval.
- No slice can merge with failing targeted tests.
- No final closeout without `npm run validate`.
- No final closeout without an explicit clean-code/reviewer pass.
- Security-sensitive refactors cannot close without the matching security review and trust-boundary evidence.

## Required Evidence
- Updated artifact paths.
- Slice branch name and commit hash.
- Tests added or tightened before implementation.
- Targeted test command output.
- `npm run validate` at final closeout, or at each slice when the artifact requires it.
- Browser, responsive, DB, devnet, or security evidence required by the dominant runtime workflow.
- Clean-code findings or explicit no-findings result.
- Linear update summary.

## Handoffs
- `planner -> docs`: refactor target, invariants, slice boundaries, Linear ID, and target integration branch.
- `docs -> domain specialist`: exact slice scope, tests to add/tighten, and runtime files allowed.
- `domain specialist -> qa`: changed files, preserved behavior, targeted test commands, and risk notes.
- `qa -> reviewer`: validation output and any unresolved uncertainty.
- `reviewer -> docs`: clean-code outcome, residual debt, and whether the slice can merge.
