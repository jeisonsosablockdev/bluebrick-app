/**
 * @vitest-environment jsdom
 * =========================================================================================
 * Test Suite: Create Distribution Modal (Layer 1 — Presentation Integration Tests)
 * Feature: STORY-UX-UI-FIXES / SPEC-03 (TDD - RED Phase)
 *
 * Description:
 * Tests the full distribution creation modal workflow with project selector,
 * thumbnail preview, automatic date binding from on-chain Notary state, and API submission.
 * =========================================================================================
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/admin/distributions"
}));

import { LocaleProvider } from "@/components/i18n/locale-provider";
import { CreateDistributionModal } from "@/features/admin/presentation/create-distribution-modal";
import type { ProjectDistributionCandidate } from "@/features/admin/domain/project-distribution-view-model";

function renderWithProviders(ui: React.ReactElement) {
  return render(<LocaleProvider initialLocale="es">{ui}</LocaleProvider>);
}

describe("CreateDistributionModal Integration", () => {
  const mockCandidates: ProjectDistributionCandidate[] = [
    {
      id: "PROP-BELLA-VISTA-102",
      title: "Bella Vista Luxury Suites",
      coverImageUrl: "https://cdn.brids.io/bella-vista.jpg",
      collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
      periodStartAt: "2026-08-01T00:00:00.000Z",
      periodEndAt: "2026-08-31T23:59:59.000Z",
      periodKey: "2026-08",
      notaryVersion: 1,
      syncStatus: "SYNCHRONIZED",
      isReadyForDistribution: true
    },
    {
      id: "PROP-ALTOS-DEL-VALLE-201",
      title: "Altos del Valle Residencial",
      coverImageUrl: "https://cdn.brids.io/altos.jpg",
      collectionAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      periodStartAt: "2026-09-01T00:00:00.000Z",
      periodEndAt: "2026-09-30T23:59:59.000Z",
      periodKey: "2026-09",
      notaryVersion: 2,
      syncStatus: "SYNCHRONIZED",
      isReadyForDistribution: true
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = renderWithProviders(
      <CreateDistributionModal
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialProjects={mockCandidates}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders project selector card with thumbnail and auto-populated notary dates when open", () => {
    renderWithProviders(
      <CreateDistributionModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialProjects={mockCandidates}
      />
    );

    // Assert Project Title in Card
    expect(screen.getByText("Bella Vista Luxury Suites")).toBeInTheDocument();

    // Assert Thumbnail
    const img = screen.getByRole("img", { name: "Bella Vista Luxury Suites" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://cdn.brids.io/bella-vista.jpg");

    // Assert On-Chain Notary Badge
    expect(screen.getByText(/notarizado on-chain/i)).toBeInTheDocument();

    // Assert Auto-Populated Period Key
    const periodInput = screen.getByPlaceholderText("2026-08") as HTMLInputElement;
    expect(periodInput.value).toBe("2026-08");
  });

  it("updates form fields automatically when changing selected project in dropdown", () => {
    renderWithProviders(
      <CreateDistributionModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        initialProjects={mockCandidates}
      />
    );

    const selectElement = screen.getByRole("combobox");
    fireEvent.change(selectElement, { target: { value: "PROP-ALTOS-DEL-VALLE-201" } });

    // Assert updated project preview
    expect(screen.getByText("Altos del Valle Residencial")).toBeInTheDocument();

    // Assert updated period key
    const periodInput = screen.getByPlaceholderText("2026-08") as HTMLInputElement;
    expect(periodInput.value).toBe("2026-09");
  });

  it("submits distribution run payload with auto-populated parameters and calls onSuccess", async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    // Mock fetch for /api/admin/distributions/runs
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/admin/distributions/runs")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              run: {
                id: "run-test-12345"
              }
            }
          })
        };
      }
      return { ok: false };
    });

    renderWithProviders(
      <CreateDistributionModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialProjects={mockCandidates}
      />
    );

    // Enter Amount
    const amountInput = screen.getByPlaceholderText("10000");
    fireEvent.change(amountInput, { target: { value: "5000" } });

    // Click submit
    const submitButton = screen.getByRole("button", { name: /create distribution draft|crear borrador/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/distributions/runs",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            periodKey: "2026-08",
            collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
            propertyId: "PROP-BELLA-VISTA-102",
            periodStartAt: "2026-08-01T00:00:00.000Z",
            periodEndAt: "2026-08-31T23:59:59.000Z",
            totalAmountMinor: "5000000000",
            tokenMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
            policyVersion: "v1"
          })
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith("run-test-12345");
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
