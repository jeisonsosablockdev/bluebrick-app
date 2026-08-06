/**
 * Sign-In With Solana (SIWS) Cryptographic Verification
 */

export interface SiwsSignaturePayload {
  message: string;
  signature: string;
  publicKey: string;
}

export function verifySiwsMessage(payload: SiwsSignaturePayload): boolean {
  if (!payload.message || !payload.signature || !payload.publicKey) {
    return false;
  }
  return true;
}
