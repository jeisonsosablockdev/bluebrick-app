/**
 * @vitest-environment jsdom
 * =========================================================================================
 * Test Suite: Project Selector Card (Layer 1 — Presentation Component Tests)
 * Feature: STORY-UX-UI-FIXES / SPEC-02 (TDD - RED Phase)
 *
 * Description:
 * Tests the visual preview card, dropdown selector, thumbnail rendering, and notary badges.
 * =========================================================================================
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectSelectorCard } from "@/features/admin/presentation/project-selector-card";
import type { ProjectDistributionCandidate } from "@/features/admin/domain/project-distribution-view-model";

describe("ProjectSelectorCard Presentation Component", () => {
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
      periodStartAt: "2026-08-01T00:00:00.000Z",
      periodEndAt: "2026-08-31T23:59:59.000Z",
      periodKey: "2026-08",
      notaryVersion: 0,
      syncStatus: "UNINITIALIZED",
      isReadyForDistribution: false
    }
  ];

  it("renders loading state cleanly", () => {
    render(
      <ProjectSelectorCard
        projects={[]}
        selectedProject={null}
        isLoading={true}
        onSelectProject={vi.fn()}
      />
    );

    expect(screen.getByText(/cargando proyectos/i)).toBeInTheDocument();
  });

  it("renders project dropdown options and selected project details with thumbnail", () => {
    render(
      <ProjectSelectorCard
        projects={mockCandidates}
        selectedProject={mockCandidates[0]}
        isLoading={false}
        onSelectProject={vi.fn()}
      />
    );

    // Assert Title and ID
    expect(screen.getByText("Bella Vista Luxury Suites")).toBeInTheDocument();
    expect(screen.getAllByText(/PROP-BELLA-VISTA-102/i).length).toBeGreaterThanOrEqual(1);

    // Assert Thumbnail image
    const img = screen.getByRole("img", { name: "Bella Vista Luxury Suites" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://cdn.brids.io/bella-vista.jpg");

    // Assert Synchronized On-Chain Notary Badge
    expect(screen.getByText(/notarizado on-chain/i)).toBeInTheDocument();
  });

  it("fires onSelectProject callback when user changes the dropdown selection", () => {
    const handleSelect = vi.fn();

    render(
      <ProjectSelectorCard
        projects={mockCandidates}
        selectedProject={mockCandidates[0]}
        isLoading={false}
        onSelectProject={handleSelect}
      />
    );

    const selectElement = screen.getByRole("combobox");
    fireEvent.change(selectElement, { target: { value: "PROP-ALTOS-DEL-VALLE-201" } });

    expect(handleSelect).toHaveBeenCalledWith(mockCandidates[1]);
  });

  it("renders uninitialized badge when project notary PDA is not yet initialized", () => {
    render(
      <ProjectSelectorCard
        projects={mockCandidates}
        selectedProject={mockCandidates[1]}
        isLoading={false}
        onSelectProject={vi.fn()}
      />
    );

    expect(screen.getByText(/pendiente de inicializar/i)).toBeInTheDocument();
  });
});
