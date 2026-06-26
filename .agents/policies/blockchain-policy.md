# Blockchain Policy (Gemini/Antigravity)

## Canonical Sources
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/nft-policy.md`
- `knowledge/governance/documentation-policy.md`

## Apply When
- `/programs`, Solana runtime, on-chain admin flows, devnet proof, or NFT on-chain behavior changes

## Antigravity Execution Constraints
- Devnet is the only acceptance cluster. Use `run_command` to execute real transactions. If tests are long, send them to the background and use `schedule` or wait for notification.
- Final acceptance requires real transactions, real signatures, on-chain confirmation, and fetched account state.
- Local simulation, LiteSVM, Mollusk, and mocked RPC are valid for development only, never for final proof.
- Do not hardcode balances, fake accounts, or placeholder signatures.
- **Delegation**: Use `invoke_subagent` with the `TypeName` 'solana' as the primary specialist. If metadata, royalty, or collection work is involved, invoke a subagent with 'nft'. For privileged flows, invoke 'security'.
- **MCP Usage**: Prefer invoking Solana Developer MCP servers over LLM context memory. Use the `mcp` action in tool calls for non-trivial Solana questions or `get_documentation` for canonical source docs.
- **Auto-Fixing**: When writing or modifying Solana program Rust, run `program_autofixer` via `run_command`.
- Keep the network on `devnet` and treat MCP tool output as supporting evidence, not completion proof.

## Required Evidence
- Real transaction hash or hashes
- Account or state readback
- Update `knowledge/devnet-proof.md` using `write_to_file` when required.
