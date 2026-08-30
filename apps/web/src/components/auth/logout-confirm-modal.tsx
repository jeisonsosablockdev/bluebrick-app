/**
 * @file apps/web/src/components/auth/logout-confirm-modal.tsx
 * @description Layer 1: Presentation - Accessible Logout Confirmation Modal Dialog.
 * Provides explicit user confirmation before session termination with a "Don't ask again" preference toggle.
 */

"use client";

import React, { useState, useEffect } from "react";
import { LogOut, X, AlertTriangle, Check } from "lucide-react";
import { useI18n } from "@/features/i18n";

export interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dontAskAgain: boolean) => Promise<void> | void;
  isSubmitting?: boolean;
}

/**
 * LogoutConfirmModal displays a luxury confirmation dialog before terminating an investor session.
 */
export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: LogoutConfirmModalProps): React.JSX.Element | null {
  // Step 1: Hook localization and local checkbox state
  const { t } = useI18n();
  const [dontAskAgain, setDontAskAgain] = useState<boolean>(false);

  // Step 2: Handle escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Step 3: Guard early return if modal is not open
  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm(dontAskAgain);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[rgba(237,241,245,0.12)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "linear-gradient(160deg, #111B2E 0%, #0A1220 100%)",
          color: "#EDF1F5",
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[rgba(237,241,245,0.08)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(232,73,95,0.15)] border border-[rgba(232,73,95,0.3)] text-[#E8495F]">
              <AlertTriangle size={18} />
            </div>
            <h3
              id="logout-modal-title"
              className="font-bold text-lg text-[#EDF1F5]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t("logoutModal.title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7C8A9C] hover:bg-[rgba(237,241,245,0.06)] hover:text-[#EDF1F5] transition-colors"
            aria-label={t("common.close")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body & Description */}
        <div className="my-5">
          <p className="text-sm leading-relaxed text-[#7C8A9C]">
            {t("logoutModal.description")}
          </p>

          {/* "Don't ask again" Checkbox Control */}
          <label
            className="mt-4 flex items-center gap-3 cursor-pointer select-none rounded-xl bg-[rgba(237,241,245,0.03)] border border-[rgba(237,241,245,0.06)] p-3 hover:bg-[rgba(237,241,245,0.06)] transition-colors"
          >
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                dontAskAgain
                  ? "border-[#E8495F] bg-[#E8495F] text-[#0A1220]"
                  : "border-[rgba(237,241,245,0.2)] bg-[rgba(237,241,245,0.04)]"
              }`}
            >
              {dontAskAgain && <Check size={14} strokeWidth={3} />}
            </div>
            <span className="text-xs font-medium text-[#EDF1F5]">
              {t("logoutModal.dontAskAgain")}
            </span>
          </label>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[rgba(237,241,245,0.1)] bg-[rgba(237,241,245,0.04)] px-4 py-2.5 text-xs font-semibold text-[#EDF1F5] hover:bg-[rgba(237,241,245,0.08)] transition-colors disabled:opacity-50"
          >
            {t("logoutModal.cancelButton")}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8495F] to-[#C41230] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[rgba(196,18,48,0.3)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <LogOut size={14} />
            <span>{t("logoutModal.confirmButton")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
