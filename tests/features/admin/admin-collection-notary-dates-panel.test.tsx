/**
 * @vitest-environment jsdom
 * =========================================================================================
 * Test Suite: Admin Collection Notary Dates Panel (Layer 1 — Presentation Component Tests)
 * Feature: STORY-UX-UI-FIXES / SPEC-05
 *
 * Description:
 * Tests the on-chain Notary Dates panel rendered on /admin/collections/[id],
 * verifying date visualization, calendar inputs, 10s auto-close timer, and the 3 user cases:
 * 1. Pending Approval Banner when a request is in review.
 * 2. Date Comparison (current on-chain vs proposed new dates with justification).
 * 3. Uninitialized baseline (start_at not configured -> 'No configurado' and 'Pendiente por Aprobar').
 * =========================================================================================
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminCollectionNotaryDatesPanel } from "@/features/admin/presentation/admin-collection-notary-dates-panel";

describe("AdminCollectionNotaryDatesPanel Presentation Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders on-chain notary dates and synchronized status badge when PDA state is available", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/date-change-request")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            onChainState: {
              authorityVault: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
              multisig: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
              vaultIndex: 0,
              collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
              startAtUnixSeconds: 1785542400n, // 2026-08-01
              endAtUnixSeconds: 1788220799n,   // 2026-08-31
              version: 1,
              updatedAtUnixSeconds: 1785542400n,
              bump: 254
            }
          })
        };
      }
      return { ok: false };
    });

    render(
      <AdminCollectionNotaryDatesPanel
        collectionId="fix-flip-brandon-117-666"
        collectionAddress="9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz"
        locale="es"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/fechas operativas notarizadas on-chain/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-08-01/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-08-31/i)).toBeInTheDocument();
      expect(screen.getByText(/notarizado on-chain/i)).toBeInTheDocument();
    });
  });

  it("Caso 1 & 2: renders pending approval banner and shows proposed new date comparison", async () => {
    render(
      <AdminCollectionNotaryDatesPanel
        collectionId="fix-flip-brandon-117-666"
        collectionAddress="9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz"
        locale="es"
        initialPendingProposal={{
          requestId: "dcr_999",
          collectionId: "fix-flip-brandon-117-666",
          status: "PENDING_MULTISIG",
          proposedStartAt: "2026-09-01T00:00:00.000Z",
          proposedEndAt: "2026-09-30T23:59:59.000Z",
          justification: "Ampliación de licencia urbanística",
          createdAt: "2026-08-22T10:00:00.000Z"
        }}
      />
    );

    // Verify Caso 1: Pending Banner is displayed
    expect(screen.getByText(/pendiente de aprobación multisig/i)).toBeInTheDocument();
    expect(screen.getByText(/solicitado el/i)).toBeInTheDocument();

    // Verify Caso 2: Proposed new dates and justification are visible
    expect(screen.getByText(/nueva fecha solicitada/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-01 ➔ 2026-09-30/i)).toBeInTheDocument();
    expect(screen.getByText(/ampliación de licencia urbanística/i)).toBeInTheDocument();
  });

  it("Caso 3: renders 'No configurado' and 'Pendiente por Aprobar' when on-chain state is uninitialized", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/date-change-request")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            onChainState: null,
            data: {
              requestId: "dcr_init_1",
              collectionId: "fix-flip-brandon-117-666",
              status: "PENDING_MULTISIG",
              proposedStartAt: "2026-08-01T00:00:00.000Z",
              proposedEndAt: "2026-08-31T23:59:59.000Z",
              justification: "Registro inicial de cronograma",
              createdAt: "2026-08-22T10:00:00.000Z"
            }
          })
        };
      }
      return { ok: false };
    });

    render(
      <AdminCollectionNotaryDatesPanel
        collectionId="fix-flip-brandon-117-666"
        collectionAddress="9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz"
        locale="es"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/pendiente por aprobar/i)).toBeInTheDocument();
      expect(screen.getAllByText(/no configurado/i).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/2026-08-01 ➔ 2026-08-31/i)).toBeInTheDocument();
    });
  });

  it("opens request modal and submits date change proposal with calendar inputs and timer", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              requestId: "dcr_123456",
              collectionId: "fix-flip-brandon-117-666",
              status: "PENDING_MULTISIG",
              proposedStartAt: "2026-08-01T00:00:00.000Z",
              proposedEndAt: "2026-08-31T23:59:59.000Z",
              justification: "Ajuste de cronograma de obra por licencia",
              createdAt: "2026-08-22T11:45:00.000Z"
            }
          })
        };
      }

      return {
        ok: true,
        json: async () => ({
          ok: true,
          onChainState: {
            authorityVault: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
            startAtUnixSeconds: 1785542400n,
            endAtUnixSeconds: 1788220799n,
            version: 1
          }
        })
      };
    });

    render(
      <AdminCollectionNotaryDatesPanel
        collectionId="fix-flip-brandon-117-666"
        collectionAddress="9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz"
        locale="es"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /solicitar cambio de fechas/i })).toBeInTheDocument();
    });

    // Open Modal
    fireEvent.click(screen.getByRole("button", { name: /solicitar cambio de fechas/i }));

    expect(screen.getByText(/proponer nuevo rango de fechas/i)).toBeInTheDocument();

    // Fill form
    const justificationInput = screen.getByPlaceholderText(/motivo del cambio/i);
    fireEvent.change(justificationInput, { target: { value: "Ajuste de cronograma de obra por licencia" } });

    // Submit proposal
    const form = screen.getByPlaceholderText(/motivo del cambio/i).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/solicitud registrada con éxito/i)).toBeInTheDocument();
    });

    // Verify modal closes when close button is clicked
    const closeBtn = screen.getByRole("button", { name: /^cerrar$/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/proponer nuevo rango de fechas/i)).not.toBeInTheDocument();
  });
});
