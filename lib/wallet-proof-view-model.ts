import type { LocaleText } from "@/lib/i18n";

export type WalletProofPhase = "idle" | "connecting" | "signing" | "verifying" | "disconnecting";
export type WalletProofStatusTone = "progress" | "warning" | "active" | "pending";

type Translate = (text: LocaleText) => string;

type WalletProofViewModelInput = {
  t: Translate;
  phase: WalletProofPhase;
  hasWalletSession: boolean;
  hasWalletSessionAdapterMismatch: boolean;
  isConnected: boolean;
};

type WalletProofStep = {
  label: string;
  active: boolean;
  complete: boolean;
};

type WalletProofViewModel = {
  eyebrow: string;
  title: string;
  description: string;
  selectedWalletLabel: string;
  disconnectedWalletLabel: string;
  progressLabel: string;
  statusLabel: string;
  statusTone: WalletProofStatusTone;
  steps: WalletProofStep[];
};

export function getWalletProofViewModel(input: WalletProofViewModelInput): WalletProofViewModel {
  const { t, phase, hasWalletSession, hasWalletSessionAdapterMismatch, isConnected } = input;

  const eyebrow = hasWalletSessionAdapterMismatch
    ? t({ en: "Wallet mismatch", es: "Wallet no coincide", pt: "Carteira divergente" })
    : hasWalletSession
      ? t({ en: "Wallet session", es: "Sesion wallet", pt: "Sessao wallet" })
      : t({ en: "Wallet proof", es: "Prueba de wallet", pt: "Prova de wallet" });

  const title = hasWalletSessionAdapterMismatch
    ? t({ en: "Reconnect the signed-in wallet", es: "Reconecta la wallet de la sesion", pt: "Reconecte a carteira da sessao" })
    : phase === "signing"
      ? t({ en: "Confirm the signature in Phantom", es: "Confirma la firma en Phantom", pt: "Confirme a assinatura no Phantom" })
      : phase === "verifying"
        ? t({ en: "Verifying your wallet proof", es: "Verificando tu prueba de wallet", pt: "Verificando sua prova de wallet" })
        : hasWalletSession
          ? t({ en: "Your BRIDS wallet session is active", es: "Tu sesion wallet BRIDS esta activa", pt: "Sua sessao wallet BRIDS esta ativa" })
          : t({ en: "Prove this wallet belongs to you", es: "Prueba que esta wallet es tuya", pt: "Prove que esta wallet e sua" });

  const description = hasWalletSessionAdapterMismatch
    ? t({
        en: "The connected Phantom wallet does not match your BRIDS session. Disconnect it and reconnect the signed-in wallet.",
        es: "La wallet conectada en Phantom no coincide con tu sesion BRIDS. Desconectala y reconecta la wallet de la sesion.",
        pt: "A carteira conectada na Phantom nao corresponde a sua sessao BRIDS. Desconecte e reconecte a carteira da sessao."
      })
    : hasWalletSession
      ? t({
          en: "You can manage this wallet session or link email sign-in.",
          es: "Puedes gestionar esta sesion wallet o vincular ingreso por email.",
          pt: "Voce pode gerenciar esta sessao wallet ou vincular login por email."
        })
      : t({
          en: "BRIDS uses a signed message to create your session. This does not send a transaction.",
          es: "BRIDS usa un mensaje firmado para crear tu sesion. Esto no envia una transaccion.",
          pt: "A BRIDS usa uma mensagem assinada para criar sua sessao. Isso nao envia uma transacao."
        });

  const statusLabel = hasWalletSessionAdapterMismatch
    ? t({ en: "Mismatch", es: "No coincide", pt: "Divergente" })
    : phase === "signing"
      ? t({ en: "Waiting in Phantom", es: "Esperando en Phantom", pt: "Aguardando no Phantom" })
      : phase === "verifying"
        ? t({ en: "Verifying", es: "Verificando", pt: "Verificando" })
        : hasWalletSession
          ? t({ en: "Active", es: "Activa", pt: "Ativa" })
          : t({ en: "Pending", es: "Pendiente", pt: "Pendente" });

  const isProgressState = phase === "connecting" || phase === "signing" || phase === "verifying";
  const statusTone: WalletProofStatusTone = isProgressState
    ? "progress"
    : hasWalletSessionAdapterMismatch
      ? "warning"
      : hasWalletSession
        ? "active"
        : "pending";

  return {
    eyebrow,
    title,
    description,
    selectedWalletLabel: t({ en: "Selected wallet", es: "Wallet seleccionada", pt: "Carteira selecionada" }),
    disconnectedWalletLabel: t({ en: "Phantom not connected", es: "Phantom sin conectar", pt: "Phantom nao conectada" }),
    progressLabel: t({ en: "Wallet sign-in progress", es: "Progreso de ingreso con wallet", pt: "Progresso de login com wallet" }),
    statusLabel,
    statusTone,
    steps: [
      {
        label: t({ en: "Connect", es: "Conectar", pt: "Conectar" }),
        active: phase === "connecting",
        complete: isConnected || hasWalletSession
      },
      {
        label: t({ en: "Sign", es: "Firmar", pt: "Assinar" }),
        active: phase === "signing",
        complete: hasWalletSession
      },
      {
        label: t({ en: "Session", es: "Sesion", pt: "Sessao" }),
        active: phase === "verifying",
        complete: hasWalletSession
      }
    ]
  };
}
