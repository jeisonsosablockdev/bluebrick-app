import { DomainAdapter, AdaptedModule } from "./index";

const SOLANA_HINTS = `
Solana-specific adaptation patterns:
- "List facts, constraints, unknowns" → "List PDA seeds, rent-exempt lamports, signer requirements, authority constraints, program IDs, remaining accounts"
- "Make a table, list, or diagram" → "Create account table: seeds, owner program, space, initializer, rent; or instruction flow diagram"
- "Consider counterexamples" → "What if PDA collides? What if authority missing? What if rent insufficient? What if CPI fails?"
- "Check consistency" → "Verify all: rent-exempt, signers match, PDA seeds derive correctly, program owns accounts, CPI signatures valid"
- "Devise algorithm/procedure" → "Algorithm: derive PDA → validate authority → build instruction → sign → submit → confirm"
- "Step-by-step reasoning" → "Derive PDA seeds → Check rent → Validate signers → Build TX → Sign → Submit → Confirm → Read account state"
- "Break into sub-problems" → "Split: account design, instruction logic, validation, CPI calls, error handling, tests"
- "Identify goal" → "Final answer must include: PDA seeds, account layout, instruction data, signer requirements, devnet proof"
`;

export const SOLANA_ADAPTER: DomainAdapter = {
  name: "solana",
  getAdaptationHints: () => SOLANA_HINTS,
  enhanceAdaptation: (modules: AdaptedModule[]): AdaptedModule[] => {
    const solanaKeywords = [
      "PDA", "seeds", "rent", "lamports", "signer", "authority", "CPI",
      "program", "account", "instruction", "devnet", "keypair", "transaction"
    ];
    
    return modules.map(m => {
      const hasSolanaTerms = solanaKeywords.some(k => m.adapted.toLowerCase().includes(k.toLowerCase()));
      if (!hasSolanaTerms && m.original.toLowerCase().includes("fact")) {
        return { ...m, adapted: m.adapted + " (include PDA seeds, rent, signers, authorities)" };
      }
      if (!hasSolanaTerms && m.original.toLowerCase().includes("table")) {
        return { ...m, adapted: m.adapted + " (account table: seeds, owner, space, rent)" };
      }
      if (!hasSolanaTerms && m.original.toLowerCase().includes("counterexample")) {
        return { ...m, adapted: m.adapted + " (PDA collision, missing auth, insufficient rent, CPI failure)" };
      }
      if (!hasSolanaTerms && m.original.toLowerCase().includes("consistency")) {
        return { ...m, adapted: m.adapted + " (rent-exempt, signer match, PDA derivation, program ownership)" };
      }
      return m;
    });
  },
};