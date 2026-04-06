# Toolchain Maintenance Policy

## Purpose
Establish a predictable and auditable maintenance policy for development tooling in this repository.

## Scope
This policy covers pinned versions and maintenance cadence for:
- Nix dev environment (`flake.nix`, `flake.lock`)
- Node.js and npm toolchain
- Solana CLI and Anchor-related workflow dependencies
- Rust toolchain used by Solana development tasks
- Browser testing toolchain (Playwright and Synpress)

## Source of truth
- Runtime/tooling definitions: `flake.nix`
- Exact resolved versions: `flake.lock`
- Application dependencies: `package.json` + `package-lock.json`

## Rules
1. Tooling versions are pinned and reviewed, not updated ad hoc.
2. No direct toolchain updates on `main` or `develop`.
3. Every toolchain update must be isolated in a dedicated branch and PR.
4. Every toolchain update PR must include rollback instructions.

## Review cadence
- Monthly lightweight review:
  - check critical CVEs
  - check broken CI signals
  - verify that devShell still builds cleanly
- Quarterly deep review:
  - assess planned upgrades
  - run full validation suite
  - re-evaluate compatibility constraints (Solana/Node/Rust)

## Mandatory update triggers
A toolchain update becomes mandatory if any of the following occurs:
1. Critical/high security advisory impacting current pinned tooling.
2. Current pin blocks required project workflows (build, lint, tests, or devnet operations).
3. Upstream Solana ecosystem changes introduce incompatibilities for active roadmap work.

## Controlled update workflow
1. Create branch: `chore/toolchain-<yyyy-mm>`.
2. Update only toolchain files (and related docs).
3. Validate locally:
   - `npm ci`
   - `npm run validate`
   - run E2E suites when update touches browser/test stack
4. Open PR with:
   - motivation
   - impact/risk analysis
   - rollback plan
   - validation evidence

## Rollback policy
If a toolchain update degrades core workflows, revert `flake.lock` and associated toolchain changes immediately, then open a follow-up issue with root-cause analysis.

## Ownership
- Primary owner: Platform/Infra maintainer assigned in PR.
- Secondary owner: one backup reviewer for continuity.

## Minimal acceptance checklist for toolchain PRs
- [ ] Limited scope (toolchain + docs only)
- [ ] `npm run validate` passes
- [ ] Impact notes added to PR
- [ ] Rollback instructions included
- [ ] Reviewer approval from designated owner
