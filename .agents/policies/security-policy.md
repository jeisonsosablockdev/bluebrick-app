# Security Policy (Gemini/Antigravity)

## Canonical Sources
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/nft-policy.md`
- `knowledge/governance/documentation-policy.md`

## Apply When
- Blockchain, auth, admin, wallet, payment, or other privileged-path changes

## Antigravity Execution Constraints
- Use `grep_search` and code analysis tools to thoroughly validate trust boundaries, authority transitions, signer assumptions, replay protection, and privileged-path authorization.
- On-chain code cannot rely on unchecked CPI, unchecked accounts, unchecked signers, or floating point arithmetic.
- Frontend and auth code cannot make client-side authority decisions or allow unsigned state transitions.
- Blocking findings must be fixed before completion; waivers belong in canonical PR or RFC records, not in agent prompts.
- Keep threat-model and mitigation docs aligned through `docs-policy` when the risk surface changes.
- **Delegation**: If complex security verification is needed, use `invoke_subagent` to spawn a dedicated `security` expert to audit your code in parallel.

## Required Evidence
- Security findings and mitigations listed in the conversation or `walkthrough.md`
- Test, devnet, or browser proof for each resolved high-risk path
- Updated docs paths using `write_to_file` when the trust model changed
