type WalletSigningPreparationInput = {
  activePublicKey: string | null;
  authenticatedPublicKey: string | null;
  hasWalletSession: boolean;
  hasWalletSessionAdapterMismatch: boolean;
  isConnected: boolean;
};

type WalletSigningPreparation =
  | { status: "mismatch" }
  | { status: "already_authenticated" }
  | { status: "needs_connection" }
  | { status: "ready"; activePublicKey: string };

export function resolveWalletSigningPreparation(input: WalletSigningPreparationInput): WalletSigningPreparation {
  if (input.hasWalletSessionAdapterMismatch) {
    return { status: "mismatch" };
  }

  if (input.hasWalletSession && input.isConnected) {
    return { status: "already_authenticated" };
  }

  if (!input.activePublicKey || (input.hasWalletSession && !input.isConnected)) {
    return { status: "needs_connection" };
  }

  if (input.hasWalletSession && input.authenticatedPublicKey && input.activePublicKey !== input.authenticatedPublicKey) {
    return { status: "mismatch" };
  }

  return {
    status: "ready",
    activePublicKey: input.activePublicKey
  };
}
