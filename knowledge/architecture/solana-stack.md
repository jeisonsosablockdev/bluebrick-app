# Solana Ecosystem Stack Skills

Use this guide when evaluating RFCs involving infrastructure, DeFi, security, or NFTs.

## @helius (Infrastructure & Indexing)
- **DAS API**: Prefer `getAsset` / `searchAssets` over standard RPC calls for NFT data.
- **Webhooks**: Use for tracking sales, mints, or transfers. Avoid cron jobs polling the chain.
- **Jito**: Mention Jito bundles if transaction landing speed is critical (MEV protection).

## @jupiter (DeFi & Pricing)
- **Swap API**: Use for any in-app token exchange.
- **Price API**: Source of truth for USD conversion rates.
- **Payments**: If accepting payments in arbitrary tokens, route through Jupiter.

## @squads (Security & Governance)
- **Multisig**: ALL Program Authorities and Treasuries on Mainnet MUST be Squads v4.
- **Proposal Workflow**: Code updates should be proposed via Squads transaction builder.
- **Emergency Brake**: Designate a Squads multisig as the freeze authority.

## @metaplex (NFTs & Assets)
- **Core**: Default for new collections (cheaper, plugin system).
- **Token Metadata**: Legacy standard, use only if backward compatibility is needed.
- **Bubblegum**: Mandatory for high-volume, low-cost assets (cNFTs).
- **Umi**: Use Umi library over web3.js for Metaplex interactions.