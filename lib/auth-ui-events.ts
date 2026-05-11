export const WALLET_MODAL_OPEN_EVENT = "brids:open-wallet-modal";

export type WalletModalOpenDetail = {
  loginMethod?: "mail" | "wallet";
};

export function dispatchOpenWalletModal(detail: WalletModalOpenDetail = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<WalletModalOpenDetail>(WALLET_MODAL_OPEN_EVENT, { detail }));
}
