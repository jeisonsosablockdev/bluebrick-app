---
type: Runbook
title: Incident Response - Solana Program Deployment
description: Runbook for failed or problematic Solana program deployments on devnet
tags: [operations, runbook, incident, solana, deployment, anchor, devnet]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/programs
---

# Incident Response: Solana Program Deployment

## Trigger
- CI/CD pipeline fails on `anchor deploy`
- Program deployment succeeds but verification fails
- On-chain program behaves unexpectedly after deploy

## Triage Steps

### 1. Check Deployment Logs
```bash
# View recent deploy logs
anchor deploy --provider.cluster devnet --verbose
```

### 2. Verify Program State
```bash
# Check program account
solana program show <PROGRAM_ID> --url devnet

# Check buffer account (if upgrade)
solana account <BUFFER_ACCOUNT> --url devnet
```

### 3. Common Failure Modes
| Error | Cause | Resolution |
|-------|-------|------------|
| `Insufficient funds` | Deploy wallet lacks SOL | Fund wallet (`solana airdrop 2`) |
| `Account in use` | Buffer not cleared | `solana program close <BUFFER> --url devnet` |
| `Program compile failed` | Rust/Anchor version mismatch | Pin toolchain in `flake.nix` |
| `Upgrade authority mismatch` | Wrong upgrade authority | Verify `upgrade_authority` keypair |

### 4. Verification Checklist
- [ ] Program ID matches expected
- [ ] `solana program show` shows correct upgrade authority
- [ ] Test instruction works: `anchor test --skip-local-validator --provider.cluster devnet`
- [ ] Devnet proof recorded (signature + explorer link)

## Resolution

### Failed Deploy
1. Fix compilation/test errors
2. Ensure devnet wallet funded (>2 SOL)
3. Clear any stale buffer accounts
4. Re-run deploy

### Verification Failed
1. Run integration tests against deployed program
2. Check instruction discriminators match
3. Verify PDA derivations correct
4. Confirm account sizes sufficient

## Rollback
If critical bug in deployed program:
```bash
# Deploy previous known-good version
git checkout <last-good-tag>
anchor deploy --provider.cluster devnet
```

## Escalation
- **10 min**: Deploy fails → Page on-call
- **30 min**: Verification fails → Engage Solana engineer
- **60 min**: Production-blocking → Team lead + stakeholders

## Related
- [Devnet Proof](../architecture/devnet-proof.md)
- [Anchor Toolchain Policy](../architecture/toolchain-policy.md)
- [Solana RPC Methods](../api/rpc/solana-methods.md)