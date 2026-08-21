/**
 * Layer 4: Infrastructure / Squads Protocol v4 Proposal Builders
 * Module: squads-proposals
 * 
 * =========================================================================================
 * 🏛️ ARCHITECTURAL ROLE & SQUADS V4 CPI PROPOSAL PIPELINE
 * =========================================================================================
 * This module assembles the instruction data and account metadata necessary to submit
 * a Squads Protocol v4 Multisig Proposal that invokes the `initialize_policy` instruction
 * on the Anchor `payout_settlement` program.
 * 
 * 3-Layer Squads Vault Model Enforced:
 * 1. Layer 1 (Signer Check): `authority_vault` is marked `isSigner: true` (Squads signs via CPI).
 * 2. Layer 2 (PDA Binding): `authority_vault` PDA is deterministically bound to `multisig_pda`.
 * 3. Layer 3 (Multisig Ownership): `multisig` is passed as an immutable reference account.
 * 
 * Anti-Sybil Validation:
 * - Attester A and Attester B MUST be distinct public keys.
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §2.1 Authority Manifest & §2.2 Canonic Setup
 * @spec STORY-015-01-SPEC-06
 */

import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
  type Address,
} from "@solana/kit";
import {
  SQUADS_V4_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  deriveSquadsPdasFromCreateKey,
} from "../../../lib/solana-kit/compat/squads";

/**
 * Anchor 8-byte instruction discriminator for `initialize_policy`.
 * Calculated as: `sha256("global:initialize_policy")[0..8]`
 * Hex: `b227c4ea90e7a2cc`
 */
export const INITIALIZE_POLICY_DISCRIMINATOR = new Uint8Array([
  0xb2, 0x27, 0xc4, 0xea, 0x90, 0xe7, 0xa2, 0xcc,
]);

/** Canonical System Program ID */
export const SYSTEM_PROGRAM_ID = address("11111111111111111111111111111111");

/**
 * Parameters for encoding an `initialize_policy` Anchor instruction.
 */
export interface InitializePolicyInstructionParams {
  settlementProgramId: Address | string;
  multisigPda: string;
  authorityVaultPda: string;
  mint: string;
  vaultIndex?: number;
  payoutAttesterA: string;
  payoutAttesterB: string;
  emergencyPauseAuthority: string;
  payer: string;
}

/**
 * Account metadata representation compatible with Solana Kit / Web3.js transaction builders.
 */
export interface AccountMeta {
  address: string;
  isWritable: boolean;
  isSigner: boolean;
}

/**
 * Solana instruction representation.
 */
export interface InstructionModel {
  programAddress: Address | string;
  accounts: AccountMeta[];
  data: Uint8Array;
}

/**
 * Parameters for building a full Squads setup proposal.
 */
export interface SquadsSetupProposalParams {
  createKey: string;
  transactionIndex: bigint | number;
  vaultIndex?: number;
  settlementProgramId: Address | string;
  mint: string;
  payoutAttesterA: string;
  payoutAttesterB: string;
  emergencyPauseAuthority: string;
  proposer: string;
}

/**
 * Result structure of a prepared Squads setup proposal.
 */
export interface SquadsSetupProposalResult {
  multisigPda: string;
  vaultPda: string;
  proposalPda: string;
  treasuryPolicyPda: string;
  innerInstruction: InstructionModel;
}

/**
 * Derives the TreasuryPolicy PDA for a given Squads Multisig PDA.
 * Seeds: `[b"treasury_policy", multisig_pda]`
 * 
 * @param multisigPda - The base58 Squads Multisig PDA address
 * @param programId - The base58 payout_settlement Program ID
 * @returns Tuple containing [derivedPdaAddress, bumpSeed]
 */
export async function deriveTreasuryPolicyPda(
  multisigPda: string,
  programId: Address | string
): Promise<[string, number]> {
  // Step 1: Validate input addresses
  const multisigAddr = address(multisigPda);
  const progAddr = address(programId);

  // Step 2: Derive PDA with canonical seeds [b"treasury_policy", multisig_pda]
  const [pda, bump] = await getProgramDerivedAddress({
    programAddress: progAddr,
    seeds: [
      new TextEncoder().encode("treasury_policy"),
      getAddressEncoder().encode(multisigAddr),
    ],
  });

  return [pda, bump];
}

/**
 * Encodes the Anchor `initialize_policy` instruction with 3-Layer Squads Vault security.
 * 
 * @param params - Parameters containing program IDs, accounts, and attester public keys
 * @returns Instruction model ready to be embedded into a Squads VaultTransaction
 */
export async function encodeInitializePolicyInstruction(
  params: InitializePolicyInstructionParams
): Promise<InstructionModel> {
  const {
    settlementProgramId,
    multisigPda,
    authorityVaultPda,
    mint,
    vaultIndex = 0,
    payoutAttesterA,
    payoutAttesterB,
    emergencyPauseAuthority,
    payer,
  } = params;

  // Step 1: Anti-Sybil validation — attester keys must be distinct
  if (payoutAttesterA === payoutAttesterB) {
    throw new Error(
      "Payout attesters A and B must be distinct public keys (Anti-Sybil invariant)"
    );
  }

  // Step 2: Validate all addresses
  const progAddr = address(settlementProgramId);
  const attesterAAddr = address(payoutAttesterA);
  const attesterBAddr = address(payoutAttesterB);
  const pauseAuthAddr = address(emergencyPauseAuthority);
  const payerAddr = address(payer);
  const mintAddr = address(mint);

  // Step 3: Derive TreasuryPolicy PDA
  const [treasuryPolicyPda] = await deriveTreasuryPolicyPda(
    multisigPda,
    progAddr
  );

  // Step 4: Encode instruction data buffer (105 bytes total)
  // Layout: [8B discriminator, 1B vault_index, 32B attester_a, 32B attester_b, 32B pause_authority]
  const data = new Uint8Array(8 + 1 + 32 + 32 + 32);
  data.set(INITIALIZE_POLICY_DISCRIMINATOR, 0);
  data[8] = vaultIndex;
  data.set(getAddressEncoder().encode(attesterAAddr), 9);
  data.set(getAddressEncoder().encode(attesterBAddr), 41);
  data.set(getAddressEncoder().encode(pauseAuthAddr), 73);

  // Step 5: Assemble 7 account metas matching 3-layer Squads Vault authentication
  const accounts: AccountMeta[] = [
    { address: treasuryPolicyPda, isWritable: true, isSigner: false },
    { address: multisigPda, isWritable: false, isSigner: false },
    { address: authorityVaultPda, isWritable: true, isSigner: true }, // Squads CPI Signer
    { address: mintAddr, isWritable: false, isSigner: false },
    { address: TOKEN_PROGRAM_ID.toString(), isWritable: false, isSigner: false },
    { address: payerAddr, isWritable: true, isSigner: true },
    { address: SYSTEM_PROGRAM_ID.toString(), isWritable: false, isSigner: false },
  ];

  return {
    programAddress: progAddr,
    accounts,
    data,
  };
}

/**
 * Builds the complete Squads setup proposal data model linking Squads PDAs and the CPI instruction.
 * 
 * @param params - Proposal parameters
 * @returns Fully resolved SquadsSetupProposalResult
 */
export async function buildSquadsSetupProposalData(
  params: SquadsSetupProposalParams
): Promise<SquadsSetupProposalResult> {
  const {
    createKey,
    transactionIndex,
    vaultIndex = 0,
    settlementProgramId,
    mint,
    payoutAttesterA,
    payoutAttesterB,
    emergencyPauseAuthority,
    proposer,
  } = params;

  // Step 1: Anti-Sybil validation
  if (payoutAttesterA === payoutAttesterB) {
    throw new Error(
      "Payout attesters A and B must be distinct public keys (Anti-Sybil invariant)"
    );
  }

  // Step 2: Derive Squads PDAs
  const squadsPdas = await deriveSquadsPdasFromCreateKey(
    createKey,
    transactionIndex,
    vaultIndex
  );

  // Step 3: Derive TreasuryPolicy PDA
  const [treasuryPolicyPda] = await deriveTreasuryPolicyPda(
    squadsPdas.squadsMultisigPda,
    settlementProgramId
  );

  // Step 4: Encode inner initialize_policy instruction
  const innerInstruction = await encodeInitializePolicyInstruction({
    settlementProgramId,
    multisigPda: squadsPdas.squadsMultisigPda,
    authorityVaultPda: squadsPdas.squadsVaultPda,
    mint,
    vaultIndex,
    payoutAttesterA,
    payoutAttesterB,
    emergencyPauseAuthority,
    payer: proposer,
  });

  return {
    multisigPda: squadsPdas.squadsMultisigPda,
    vaultPda: squadsPdas.squadsVaultPda,
    proposalPda: squadsPdas.proposalPda,
    treasuryPolicyPda,
    innerInstruction,
  };
}
