// @vitest-environment jsdom

/**
 * =========================================================================================
 * Test Suite: Squads Multisig Console Dynamic Data Integration (SPEC-08)
 * Layer: Presentation & Application Verification
 *
 * Description:
 * Tests the Squads Multisig Console component (/admin/treasury/squads) verifying:
 * 1. Clean empty state rendering when no proposal is active (zero hardcoded mock data).
 * 2. Dynamic proposal rendering from API or initial DTO.
 * 3. Automatic BRIDS wallet connection modal trigger on unauthenticated vote attempts.
 * 4. Single-button unified action calculation and execution flow.
 * =========================================================================================
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SquadsMultisigConsole } from "@/features/admin/presentation/squads-multisig-console";
import type { SquadsProposalDTO } from "@/features/admin/domain/squads-multisig-types";

// Mock i18n
vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: () => ({
    t: (key: string, fallback: string) => fallback || key
  })
}));

// Mock release module visibility
vi.mock("@/lib/release-module-visibility", () => ({
  isReleaseControlledRouteVisible: () => true
}));

const mockDispatchOpenWalletModal = vi.fn();
vi.mock("@/lib/auth-ui-events", () => ({
  dispatchOpenWalletModal: (args: unknown) => mockDispatchOpenWalletModal(args)
}));

// Mock web3 transactions
vi.mock("@/lib/solana-kit/compat/web3-transactions", () => ({
  deserializeLegacyVersionedTransaction: vi.fn().mockReturnValue({}),
  serializeLegacyVersionedTransaction: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]))
}));

let mockWalletState = {
  publicKey: null as { toBase58: () => string } | null,
  connected: false,
  signTransaction: undefined as unknown
};

// Mock useWallet
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => mockWalletState
}));

const mockProposal: SquadsProposalDTO = {
  runId: "RUN-LIVE-2026",
  treasuryPolicyPda: "Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuzQpF1D71K",
  multisigPda: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
  vaultPda: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
  threshold: 2,
  membersCount: 4,
  approvedMembers: ["3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd"],
  executed: false,
  onChainDates: {
    projectStartAt: "2026-03-15T00:00:00Z",
    projectEndAt: "2028-12-31T23:59:59Z"
  },
  dbDates: {
    projectStartAt: "2026-03-15T00:00:00Z",
    projectEndAt: "2028-12-31T23:59:59Z"
  },
  beneficiaries: [
    {
      claimId: "CLAIM-LIVE-01",
      holderName: "Investor Alpha",
      originWallet: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
      payoutWallet: "7mQ1...p4N9",
      assetMint: "9xP2...v4M1",
      mintDate: "2026-01-15",
      daysSinceMint: 40,
      stakingDays: 15,
      stakingPeriod: "01/08/2026 al 15/08/2026",
      grossAmountMinor: "1200000000",
      feeAmountMinor: "24000000",
      netAmountMinor: "1176000000",
      overrideCaseNumber: "CASE-2026-0891"
    }
  ]
};

describe("SquadsMultisigConsole Component (SPEC-08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWalletState = {
      publicKey: null,
      connected: false,
      signTransaction: undefined
    };
  });

  it("Step 1: Renders clean empty state when no proposal is active and no runId provided", async () => {
    // Arrange: Mock empty API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: null })
    });

    // Act
    render(<SquadsMultisigConsole initialDto={null} />);

    // Assert: Check empty state message and absence of mock data
    await waitFor(() => {
      expect(
        screen.getByText(/No hay propuestas de dispersión de Squads activas en este momento/i)
      ).toBeDefined();
    });

    expect(screen.queryByText(/Carlos Mendoza/i)).toBeNull();
  });

  it("Step 2: Renders dynamic proposal when initialDto is supplied", () => {
    // Act
    render(<SquadsMultisigConsole initialDto={mockProposal} />);

    // Assert
    expect(screen.getByText(/RUN-LIVE-2026/i)).toBeDefined();
    expect(screen.getByText(/Investor Alpha/i)).toBeDefined();
    expect(screen.getByText(/Quórum 2 de 4/i)).toBeDefined();
  });

  it("Step 3: Triggers BRIDS wallet connection modal when attempting to vote without connected wallet", async () => {
    // Act
    render(<SquadsMultisigConsole initialDto={mockProposal} />);

    const buttons = screen.getAllByRole("button", { name: /Aprobar/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    // Assert: dispatchOpenWalletModal was invoked
    expect(mockDispatchOpenWalletModal).toHaveBeenCalledWith({ loginMethod: "wallet" });
  });

  it("Step 4: Requests wallet signature and displays Solscan transaction link on successful Devnet execution", async () => {
    // Arrange: Connected wallet with signTransaction capability
    const mockSignTransaction = vi.fn().mockImplementation(async (tx) => tx);
    mockWalletState = {
      publicKey: { toBase58: () => "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" },
      connected: true,
      signTransaction: mockSignTransaction
    } as unknown as typeof mockWalletState;

    const mockPrepareResponse = {
      ok: true,
      data: {
        attemptId: "ATTEMPT-2026-999",
        transactionBase64: Buffer.from("mock-unsigned-versioned-transaction").toString("base64"),
        blockhash: "EkSnNWgrAwhHfF5Q81eZ4A8Yn16yvBQp4qWq7Z4q6XyZ"
      }
    };

    const mockVoteResponse = {
      ok: true,
      data: {
        actionTaken: "APPROVED_AND_EXECUTED",
        proposalId: "RUN-LIVE-2026",
        signerWallet: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
        txSignature: "4Yq7mQ1p4N9v4M1EkSnNWgrAwhHfF5Q81eZ4A8Yn16yvBQp4qWq7Z4q6XyZ111111111111111111111",
        solscanUrl: "https://solscan.io/tx/4Yq7mQ1p4N9v4M1EkSnNWgrAwhHfF5Q81eZ4A8Yn16yvBQp4qWq7Z4q6XyZ111111111111111111111?cluster=devnet",
        quorumReached: true,
        executed: true,
        message: "Propuesta aprobada y ejecutada exitosamente en Solana Devnet."
      }
    };

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/prepare-vote")) {
        return { ok: true, json: async () => mockPrepareResponse };
      }
      if (url.includes("/vote")) {
        return { ok: true, json: async () => mockVoteResponse };
      }
      return { ok: true, json: async () => ({ ok: true, data: null }) };
    });

    // Act
    render(<SquadsMultisigConsole initialDto={mockProposal} />);

    const buttons = screen.getAllByRole("button", { name: /Aprobar/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    // Assert
    await waitFor(() => {
      const link = screen.getByRole("link", { name: /Solscan Devnet/i });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toContain("solscan.io");
    });
  });

  it("Step 5: Handles wallet signature cancellation gracefully without crashing", async () => {
    // Arrange: Wallet user rejects signature
    const mockSignTransaction = vi.fn().mockRejectedValue(new Error("User rejected the request."));
    mockWalletState = {
      publicKey: { toBase58: () => "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" },
      connected: true,
      signTransaction: mockSignTransaction
    } as unknown as typeof mockWalletState;

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/prepare-vote")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              attemptId: "ATTEMPT-CANCEL",
              transactionBase64: Buffer.from("mock-tx").toString("base64")
            }
          })
        };
      }
      return { ok: true, json: async () => ({ ok: true, data: null }) };
    });

    // Act
    render(<SquadsMultisigConsole initialDto={mockProposal} />);

    const buttons = screen.getAllByRole("button", { name: /Aprobar/i });
    fireEvent.click(buttons[0]);

    // Assert: Error message rendered gracefully
    await waitFor(() => {
      expect(screen.getByText(/Cancelaste la solicitud de firma en la wallet/i)).toBeDefined();
    });
  });

  it("Step 6: Renders cryptographic seal badge when proposalHash is present in proposal DTO", () => {
    // Arrange: Proposal with cryptographic seal and proposed date change
    const sealedProposal: SquadsProposalDTO = {
      ...mockProposal,
      dbDates: {
        projectStartAt: "2026-04-01T00:00:00Z",
        projectEndAt: "2028-12-31T23:59:59Z",
        modificationReason: "Ajuste de cronograma autorizado."
      },
      proposalHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      nonce: "NONCE-TEST-001"
    };

    // Act
    render(<SquadsMultisigConsole initialDto={sealedProposal} />);

    // Assert
    const badge = screen.getByTestId("proposal-crypto-seal-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain("Sello Criptográfico (Keccak-256)");
    expect(badge.textContent).toContain("Integridad Verificada");
  });
});
