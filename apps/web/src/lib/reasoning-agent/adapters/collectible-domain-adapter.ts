import { DomainAdapter, AdaptedModule } from "./index";

const NFT_HINTS = `
NFT/Metaplex-specific adaptation patterns:
- "List facts, constraints, unknowns" → "List mint authority, metadata URI, royalty basis points, collection verification, update authority, freeze authority, seller fee basis points"
- "Make a table, list, or diagram" → "Create asset table: mint, metadata, royalty, collection, primary sale happened, creators; or mint flow diagram"
- "Consider counterexamples" → "What if royalty > 10000 bps? What if collection unverified? What if metadata mutable? What if authority mismatch?"
- "Check consistency" → "Verify: mint authority matches, royalty in range [0,10000], collection verified, metadata URI accessible, update authority correct"
- "Devise algorithm/procedure" → "Algorithm: create collection → mint asset → attach metadata → verify collection → set royalties → freeze if needed"
- "Step-by-step reasoning" → "Create collection → Mint asset → Write metadata → Verify collection → Set royalty → Confirm on-chain"
- "Break into sub-problems" → "Split: collection creation, asset minting, metadata attachment, royalty config, verification, compliance"
- "Identify goal" → "Final answer must include: mint address, metadata, royalty config, collection address, devnet proof"
`;

export const COLLECTIBLE_ADAPTER: DomainAdapter = {
  name: "nft",
  getAdaptationHints: () => NFT_HINTS,
  enhanceAdaptation: (modules: AdaptedModule[]): AdaptedModule[] => {
    const nftKeywords = [
      "mint", "metadata", "royalty", "collection", "authority", "freeze",
      "creator", "seller fee", "basis points", "verification", "metaplex"
    ];
    
    return modules.map(m => {
      const hasNFTTerms = nftKeywords.some(k => m.adapted.toLowerCase().includes(k.toLowerCase()));
      if (!hasNFTTerms && m.original.toLowerCase().includes("fact")) {
        return { ...m, adapted: m.adapted + " (mint auth, metadata URI, royalty bps, collection, update/freeze auth)" };
      }
      if (!hasNFTTerms && m.original.toLowerCase().includes("table")) {
        return { ...m, adapted: m.adapted + " (asset table: mint, metadata, royalty, collection, creators)" };
      }
      if (!hasNFTTerms && m.original.toLowerCase().includes("counterexample")) {
        return { ...m, adapted: m.adapted + " (royalty > 10000, unverified collection, mutable metadata, auth mismatch)" };
      }
      if (!hasNFTTerms && m.original.toLowerCase().includes("consistency")) {
        return { ...m, adapted: m.adapted + " (mint auth match, royalty range, collection verified, metadata accessible)" };
      }
      return m;
    });
  },
};