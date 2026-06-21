# Blockchain Policy

## Canonical Sources
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/nft-policy.md`
- `knowledge/governance/documentation-policy.md`

## Apply When
- `/programs`, Solana runtime, on-chain admin flows, devnet proof, or NFT on-chain behavior changes

## Hard Constraints
- Devnet is the only acceptance cluster.
- Final acceptance requires real transactions, real signatures, on-chain confirmation, and fetched account state.
- Local simulation, LiteSVM, Mollusk, and mocked RPC are valid for development only, never for final proof.
- Do not hardcode balances, fake accounts, or placeholder signatures.
- Use `solana` as the primary specialist; add `nft` for metadata, royalty, or collection work and `security` for privileged flows.
- Prefer Solana Developer MCP tools over model memory for Solana-specific decisions.
- Use `list_sections` first for non-trivial Solana questions; use `get_documentation` for canonical source, framework, library, or ecosystem docs.
- Use `Solana_Documentation_Search` or `Solana_Expert__Ask_For_Help` for narrow how-to questions, errors, or API usage.
- When writing or modifying Solana program Rust, run `program_autofixer`, apply the fixes, and repeat until `require_another_tool_call_after_fixing` is false.
- If Helius or MCP tooling is used, keep the network on `devnet` and treat tool output as supporting evidence, not completion proof.

## Required Evidence
- Real transaction hash or hashes
- Account or state readback
- Matching docs updates, including `knowledge/devnet-proof.md` when required
