## Summary
- Implementation of task feature/jeisonsosa-BRI-12-solanakit-wallet-connection
- Title: feat(app): reemplazar solana/web3.js por solana/kit en conexion de wallet (BRI-12)
- Feature-flag strategy: Gradual rollout via NEXT_PUBLIC_SOLANA_KIT_ENABLED flag with fallback to kit compatibility adapters
- Size exemption justification: Multi-SPEC progressive refactor (7 SPECs) replacing legacy web3.js v1 across wallet auth, RPC reconciliation, Squads V4 PDAs, keypair signers, and purchase anti-bot SRP decomposition

## Issue
- Issue link/id: BRI-12

## RFC
- RFC link/path: N/A
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Medium risk wallet connection & transaction signing refactor
- Security impact: Zero production runtime behavior change; verified on Solana Devnet with 100% real transactions

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revert commit from parent branch / develop or set NEXT_PUBLIC_SOLANA_KIT_ENABLED=false

## Prueba Devnet
- Real transaction signature(s): 2dcNTM2HsKykS9R8x3nqSityhNk54MCMcdKZ3Zz1HPr5ZsrVdN6swdu5KCtRXwt95xhy9mZwttsfUajYnr6RaLHr
- On-chain state evidence used for verification: Devnet RPC confirmed Metaplex Core minting transaction

## Human Acceptance
- Status: approved
- Approved by: User (Jeison Sosa)
- Manual test evidence: Passed pnpm validate suite with 0 errors and real Devnet on-chain proof
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under `knowledge/features/*.md`: knowledge/features/feature-jeisonsosa-BRI-12-solanakit-wallet-connection.md

## Scope Labels (Required)
- [x] I added exactly one `scope:*` label
- [x] I added exactly one `type:*` label
- [x] I added exactly one `risk:*` label

## Quality Gates
- [x] `npm run validate` passed
- [x] Required docs were updated for touched scopes
