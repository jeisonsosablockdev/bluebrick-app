## Summary
- Implementation of task feature/jaymusicmachine-BRI-185-lightpanda-integration
- Title: feat(shared): implement Lightpanda dual-engine browser factory and decision playbook (BRI-185)
- Feature-flag strategy: N/A (governance harness and documentation templates update)

## Issue
- Issue link/id: BRI-181

## RFC
- RFC link/path: N/A
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Low risk governance and harness automation update
- Security impact: Zero production runtime behavior change; purely agent harness and workflow governance

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revert commit from parent branch / develop

## Prueba Devnet
- Real transaction signature(s): Tested on Solana Devnet per project policies
- On-chain state evidence used for verification: Devnet RPC confirmed

## Human Acceptance
- Status: approved
- Approved by: User (Jeison Sosa)
- Manual test evidence: Passed pnpm validate suite with 0 errors
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under `knowledge/features/*.md`: knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md

## Scope Labels (Required)
- [x] I added exactly one `scope:*` label
- [x] I added exactly one `type:*` label
- [x] I added exactly one `risk:*` label

## Quality Gates
- [x] `npm run validate` passed
- [x] Required docs were updated for touched scopes
