/**
 * @file apps/web/src/components/profile/avatar-upload-modal.tsx
 * @description Layer 1: Presentation - Investor avatar upload dialog with Vercel Blob integration.
 */

"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { uploadAvatarAction } from "@/lib/auth/avatar-actions";

export interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (newUrl: string) => void;
}

/**
 * AvatarUploadModal provides a modal dialog for uploading profile pictures.
 */
export function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onUploadSuccess,
}: AvatarUploadModalProps): React.JSX.Element | null {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Step 1: Extract selected file
    const file = e.target.files?.[0];
    if (!file) return;

    // Step 2: Validate file MIME type on client side
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor selecciona un archivo de imagen válido (PNG, JPEG, WEBP, GIF).");
      return;
    }

    // Step 3: Validate file size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("La imagen excede el tamaño máximo permitido de 5 MB.");
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Step 4: Construct FormData payload with binary file and optional previous blob URL
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (currentAvatarUrl) {
        formData.append("oldAvatarUrl", currentAvatarUrl);
      }

      // Step 5: Invoke server action to execute domain upload pipeline
      const result = await uploadAvatarAction(formData);

      if (result.success && result.url) {
        onUploadSuccess?.(result.url);
        onClose();
      } else {
        setErrorMessage(result.error || "Error al subir la imagen.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const displayImage = previewUrl || currentAvatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-[rgba(237,241,245,0.12)] p-6 shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #111B2E 0%, #0A1220 100%)",
          color: "#EDF1F5",
        }}
      >
        <div className="flex items-center justify-between border-b border-[rgba(237,241,245,0.08)] pb-4">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Actualizar Avatar de Inversionista
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#7C8A9C] hover:bg-[rgba(237,241,245,0.06)] hover:text-[#EDF1F5]"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="my-6 flex flex-col items-center">
          {displayImage ? (
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#C41230] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayImage} alt="Preview" className="h-full w-full object-cover" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-2 border-dashed border-[rgba(237,241,245,0.2)] bg-[rgba(237,241,245,0.03)] text-[#7C8A9C] hover:border-[#E8495F] hover:text-[#E8495F] transition-colors"
            >
              <ImageIcon size={28} />
              <span className="mt-1 text-[11px] font-semibold">Seleccionar</span>
            </button>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-[#E8495F] hover:underline"
            >
              {displayImage ? "Cambiar archivo" : "Elegir archivo"}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          <p className="mt-4 text-center text-xs text-[#7C8A9C]">
            Formatos soportados: PNG, JPG, WEBP, GIF. Máximo 5 MB. Almacenado en Vercel Blob.
          </p>

          {errorMessage && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#E8495F]">
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[rgba(237,241,245,0.1)] px-4 py-2 text-xs font-semibold text-[#8E9BAA] hover:bg-[rgba(237,241,245,0.05)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-[#0A1220] transition-all hover:brightness-110 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #E8495F, #C41230)",
            }}
          >
            {isUploading ? (
              <span>Subiendo...</span>
            ) : (
              <>
                <Upload size={14} />
                <span>Guardar Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
