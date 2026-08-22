/**
 * @vitest-environment jsdom
 * =========================================================================================
 * Test Suite: Admin Collection Notary Dates Panel (Layer 1 — Presentation Component Tests)
 * Feature: STORY-UX-UI-FIXES / SPEC-05 (TDD - RED Phase)
 *
 * Description:
 * Tests the on-chain Notary Dates panel rendered on /admin/collections/[id],
 * verifying date visualization, status badges, and the date change request modal flow.
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
    // Mock fetch for date-change-request GET/PDA state
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

    // Verify loading or resolved date
    await waitFor(() => {
      expect(screen.getByText(/fechas operativas notarizadas/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-08-01/i)).toBeInTheDocument();
      expect(screen.getByText(/2026-08-31/i)).toBeInTheDocument();
      expect(screen.getByText(/notarizado on-chain/i)).toBeInTheDocument();
    });
  });

  it("opens request modal and submits date change proposal to API", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              requestId: "dcr_123456",
              status: "PENDING_MULTISIG"
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
