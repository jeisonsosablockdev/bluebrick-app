use anchor_lang::prelude::*;

#[error_code]
pub enum PayoutSettlementError {
    #[msg("Signer is not the authorized Squads v4 Vault PDA")]
    UnauthorizedVaultPda,

    #[msg("Multisig account owner must be the canonical Squads v4 program (SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf)")]
    InvalidMultisigOwner,

    #[msg("Squads Multisig and Vault Index bindings are immutable")]
    ImmutableSquadsBinding,

    #[msg("Dual Ed25519 verification instructions missing from Instructions Sysvar")]
    MissingEd25519Instruction,

    #[msg("Attester A and Attester B cannot be the identical public key (Sybil attack prevention)")]
    IdenticalAttestersForbidden,

    #[msg("Attestation message does not match snapshot preimage parameters")]
    AttestationDataMismatch,

    #[msg("Attestation has expired")]
    AttestationExpired,

    #[msg("Unsupported token program. Only canonical SPL Token program is supported in V1")]
    UnsupportedTokenProgram,

    #[msg("Unsupported token mint. Only authorized USDC mint is supported in V1")]
    UnauthorizedMint,

    #[msg("Escrow token account is underfunded. Exact total_amount_minor required")]
    EscrowUnderfunded,

    #[msg("Escrow token account balance does not match total_amount_minor")]
    EscrowBalanceMismatch,

    #[msg("Payout run is already sealed and active")]
    RunAlreadyActive,

    #[msg("Payout run is not in Draft state")]
    RunNotInDraftState,

    #[msg("Invalid Merkle proof")]
    InvalidMerkleProof,

    #[msg("Claim receipt already exists (double claim prevention)")]
    ClaimAlreadySettled,

    #[msg("Emergency pause authority signature invalid or expired")]
    UnauthorizedEmergencyPause,
}
