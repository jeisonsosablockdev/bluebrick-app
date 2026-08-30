/**
 * @file tests/unit/avatar-upload-modal.test.tsx
 * @description Layer 1 Presentation: TDD Unit & Component Test Suite for AvatarUploadModal.
 * @spec BBC-11
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AvatarUploadModal } from "@/components/profile/avatar-upload-modal";
import { I18nProvider } from "@/features/i18n/presentation/components/i18n-provider";
import * as avatarActions from "@/lib/auth/avatar-actions";

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn((file: Blob) => `blob:http://localhost/${(file as File).name}`);

describe("BBC-11: AvatarUploadModal Component (@spec BBC-11-UI)", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userId: "user_sofia_martinez",
    currentAvatarUrl: "https://public.blob.vercel-storage.com/avatars/old_avatar.png",
    onUploadSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when isOpen is false", () => {
    // Arrange & Act
    const { container } = render(
      <I18nProvider initialLocale="es">
        <AvatarUploadModal {...defaultProps} isOpen={false} />
      </I18nProvider>
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it("should render modal header, instructions, and action buttons when open", () => {
    // Arrange & Act
    render(
      <I18nProvider initialLocale="es">
        <AvatarUploadModal {...defaultProps} />
      </I18nProvider>
    );

    // Assert
    expect(screen.getByText(/Actualizar Avatar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar Avatar/i })).toBeInTheDocument();
  });

  it("should display preview and enable submit button when valid image is selected", async () => {
    // Arrange
    render(
      <I18nProvider initialLocale="es">
        <AvatarUploadModal {...defaultProps} />
      </I18nProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /Guardar Avatar/i });
    expect(submitBtn).toBeDisabled();

    // Act: Select image file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy-image-data"], "sofia_new.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Assert: Preview is shown and submit button is enabled
    expect(screen.getByAltText("Preview")).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  it("should display validation error message when a non-image file is chosen", async () => {
    // Arrange
    render(
      <I18nProvider initialLocale="es">
        <AvatarUploadModal {...defaultProps} />
      </I18nProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const nonImageFile = new File(["dummy-text"], "notes.txt", { type: "text/plain" });

    // Act
    fireEvent.change(fileInput, { target: { files: [nonImageFile] } });

    // Assert: Error message rendered
    expect(
      screen.getByText(/Por favor selecciona un archivo de imagen válido/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Guardar Avatar/i })).toBeDisabled();
  });

  it("should invoke uploadAvatarAction and onUploadSuccess upon confirmation", async () => {
    // Arrange
    const newAvatarUrl = "https://public.blob.vercel-storage.com/avatars/user_sofia_martinez-171000.png";
    const uploadSpy = vi.spyOn(avatarActions, "uploadAvatarAction").mockResolvedValue({
      success: true,
      url: newAvatarUrl,
    });

    render(
      <I18nProvider initialLocale="es">
        <AvatarUploadModal {...defaultProps} />
      </I18nProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["image-bytes"], "avatar.webp", { type: "image/webp" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getByRole("button", { name: /Guardar Avatar/i });

    // Act
    fireEvent.click(submitBtn);

    // Assert
    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(defaultProps.onUploadSuccess).toHaveBeenCalledWith(newAvatarUrl);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should display error message if server action returns an error", async () => {
    // Arrange
    vi.spyOn(avatarActions, "uploadAvatarAction").mockResolvedValue({
      success: false,
      error: "La imagen excede el tamaño máximo permitido de 5 MB.",
    });

    render(
      <I18nProvider initialLocale="es">
        <AvatarUploadModal {...defaultProps} />
      </I18nProvider>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["image-bytes"], "huge.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getByRole("button", { name: /Guardar Avatar/i });

    // Act
    fireEvent.click(submitBtn);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText("La imagen excede el tamaño máximo permitido de 5 MB.")
      ).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it("should close modal when Cancel button or Close icon is clicked", () => {
    // Arrange
    render(
      <I18nProvider initialLocale="es">
        <AvatarUploadModal {...defaultProps} />
      </I18nProvider>
    );

    // Act: Click Cancel button
    const cancelBtn = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelBtn);

    // Assert
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    // Act: Click Close (X) button
    const closeBtn = screen.getByLabelText("Cerrar");
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});
