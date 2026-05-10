# Blockchain Policy

## Canonical Sources
- `docs/governance/security-quality-policy.md`
- `docs/governance/nft-policy.md`
- `docs/governance/documentation-policy.md`

## Apply When
- `/programs`, Solana runtime, on-chain admin flows, devnet proof, or NFT on-chain behavior changes

## Hard Constraints
- Devnet is the only acceptance cluster.
- Final acceptance requires real transactions, real signatures, on-chain confirmation, and fetched account state.
- Local simulation, LiteSVM, Mollusk, and mocked RPC are valid for development only, never for final proof.
- Do not hardcode balances, fake accounts, or placeholder signatures.
- Use `solana` as the primary specialist; add `nft` for metadata, royalty, or collection work and `security` for privileged flows.
- If Helius or MCP tooling is used, keep the network on `devnet` and treat tool output as supporting evidence, not completion proof.

## Required Evidence
- Real transaction hash or hashes
- Account or state readback
- Matching docs updates, including `docs/devnet-proof.md` when required
