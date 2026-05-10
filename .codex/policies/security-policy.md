# Security Policy

## Canonical Sources
- `docs/governance/security-quality-policy.md`
- `docs/governance/nft-policy.md`
- `docs/governance/documentation-policy.md`

## Apply When
- Blockchain, auth, admin, wallet, payment, or other privileged-path changes

## Hard Constraints
- Validate trust boundaries, authority transitions, signer assumptions, replay protection, and privileged-path authorization.
- On-chain code cannot rely on unchecked CPI, unchecked accounts, unchecked signers, or floating point arithmetic.
- Frontend and auth code cannot make client-side authority decisions or allow unsigned state transitions.
- Blocking findings must be fixed before completion; waivers belong in canonical PR or RFC records, not in agent prompts.
- Keep threat-model and mitigation docs aligned through `docs-policy` when the risk surface changes.

## Required Evidence
- Security findings and mitigations
- Test, devnet, or browser proof for each resolved high-risk path
- Updated docs paths when the trust model changed
