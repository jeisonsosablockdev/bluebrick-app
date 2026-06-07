🟠 NFT EXTENSION POLICY (SOLANA)

When building NFTs on Solana:
	1.	Follow official SPL Token standards.
	2.	Follow Metaplex metadata structure.
	3.	Use PDA for metadata accounts.
	4.	Explicitly validate mint authority.
	5.	Explicitly validate update authority.
	6.	Prevent duplicate mint.
	7.	Validate supply constraints.
	8.	Confirm metadata account owner.
	9.	Confirm token account owner.
	10.	Enforce royalty configuration integrity.

Solana Developer MCP rule:
	•	Prefer Solana Developer MCP tools over model memory for Solana and NFT-specific decisions.
	•	Use `list_sections` first for non-trivial Solana, Metaplex, SPL Token, wallet, RPC, or NFT questions.
	•	Use `get_documentation` for canonical docs from selected source ids such as `solana-docs`, `solana-kit-docs`, `anchor-docs`, `metaplex-docs`, SPL, wallet, or Helius sources.
	•	Use `Solana_Documentation_Search` or `Solana_Expert__Ask_For_Help` for narrow how-to questions, errors, or API usage.
	•	Whenever Solana program Rust is written or modified, run `program_autofixer`, apply fixes, and repeat until `require_another_tool_call_after_fixing` is false.

Never:
	•	Hardcode metadata
	•	Skip PDA seed validation
	•	Trust client-provided mint addresses
	•	Assume update authority implicitly

⸻

🔴 NFT GLOBAL SECURITY RULE

If program handles NFTs:
	•	Always validate collection authority
	•	Always verify verified creators field
	•	Always validate seller fee basis points
	•	Never allow unauthorized metadata update

⸻

🟡 NFT WORKFLOW (@nft-cycle)

Trigger

Run @nft-cycle

Mandatory Execution Order
	1.	concise-planning
	2.	solana
	3.	nft
	4.	Design mint authority model
	5.	Define PDA seeds explicitly
	6.	test-driven-development
	7.	Bootstrap program test stack (`cargo add --dev litesvm mollusk-svm mollusk-svm-programs-token proptest`)
	8.	Deploy to devnet
	9.	Execute real mint on devnet
	10.	Validate metadata on-chain
	11.	Validate royalty configuration
	12.	clean-code
	13.	lint-and-validate
	14.	security-audit
	15.	production-code-audit

Strict Rules
	•	Devnet only
	•	Real mint transaction required
	•	Real metadata account verification required
	•	No mocked mint
	•	No fake supply
	•	No unchecked authority
	•	Use Solana/NFT specialists only (`solana`, `nft`) for NFT workflow in Codex
	•	Do not use Ethereum/EVM-focused skills unless explicitly requested
