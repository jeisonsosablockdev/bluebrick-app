/**
 * @file tests/unit/project-phase-media-card-modal.test.tsx
 * @description Layer 1 & QA: Behavioral Integration Test Suite for ProjectPhaseMediaCard modal invocation.
 * Verifies that clicking the thumbnail opens ImageDetailModal, while corner arrows navigate without opening modal.
 * @spec BBC-020-SPEC-03
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ProjectPhaseMediaCard } from "@/components/dashboard/project-phase-media-card";

describe("BBC-020 SPEC-03: Media Card to Lightbox Modal Integration", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  const mockImages = [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
  ];

  it("should open ImageDetailModal when user clicks on the media card container", async () => {
    // Step 1: Render card with real images
    render(
      <ProjectPhaseMediaCard
        phaseName="Construcción de estructuras"
        images={mockImages}
        isDark={true}
        onHoverChange={vi.fn()}
      />
    );

    // Step 2: Ensure modal is initially not in document
    expect(screen.queryByRole("dialog")).toBeNull();

    // Step 3: Click the media card
    const card = screen.getByTestId("phase-media-card-container");
    fireEvent.click(card);

    // Step 4: Verify modal is opened
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveTextContent(/Construcción de estructuras/i);
    });
  });

  it("should NOT open modal when user clicks on corner navigation arrows", async () => {
    // Step 1: Render card
    render(
      <ProjectPhaseMediaCard
        phaseName="Construcción de estructuras"
        images={mockImages}
        isDark={true}
        onHoverChange={vi.fn()}
      />
    );

    // Step 2: Hover to reveal arrows
    const card = screen.getByTestId("phase-media-card-container");
    fireEvent.mouseEnter(card);

    const nextArrow = screen.getByTestId("phase-media-arrow-next");
    expect(nextArrow).toBeInTheDocument();

    // Step 3: Click the corner arrow (should propagate stopPropagation)
    fireEvent.click(nextArrow);

    // Step 4: Verify modal was NOT opened
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should open modal when user presses Enter on the media card", async () => {
    render(
      <ProjectPhaseMediaCard
        phaseName="Construcción de estructuras"
        images={mockImages}
        isDark={true}
        onHoverChange={vi.fn()}
      />
    );

    const card = screen.getByTestId("phase-media-card-container");
    fireEvent.keyDown(card, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should close modal when user clicks the modal close button", async () => {
    render(
      <ProjectPhaseMediaCard
        phaseName="Construcción de estructuras"
        images={mockImages}
        isDark={true}
        onHoverChange={vi.fn()}
      />
    );

    // Open modal
    const card = screen.getByTestId("phase-media-card-container");
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Click close button
    const closeBtn = screen.getByLabelText("Cerrar detalle de imagen");
    fireEvent.click(closeBtn);

    // Verify modal is closed / unmounted
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("should NOT open modal if images array is empty (placeholder state)", () => {
    render(
      <ProjectPhaseMediaCard
        phaseName="Estudios y licencias"
        images={[]}
        isDark={true}
        onHoverChange={vi.fn()}
      />
    );

    const card = screen.getByTestId("phase-media-card-container");
    fireEvent.click(card);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
