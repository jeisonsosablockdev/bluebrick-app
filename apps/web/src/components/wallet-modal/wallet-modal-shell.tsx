"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

import { createPanelMotionVariants, createReducedMotionVariants, MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";

type WalletModalFeedback = {
  isStatus: boolean;
  text: string;
};

type WalletModalShellProps = {
  children: ReactNode;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  closeLabel: string;
  feedback?: WalletModalFeedback | null;
  isOpen: boolean;
  shouldReduceMotion: boolean;
  title: string;
  onClose: () => void;
};

export function WalletModalShell({
  children,
  closeButtonRef,
  closeLabel,
  feedback,
  isOpen,
  shouldReduceMotion,
  title,
  onClose
}: WalletModalShellProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="wallet-modal-overlay"
          data-testid="wallet-modal-overlay"
          className="fixed inset-0 z-[70] flex min-h-svh items-start justify-center overflow-y-auto bg-black/65 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-6"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : MOTION_FAST_OPACITY_TRANSITION}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            key="wallet-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
            className="glass-surface max-h-[calc(100svh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain p-5 sm:max-h-[calc(100svh-3rem)] sm:p-6"
            variants={shouldReduceMotion ? createReducedMotionVariants() : createPanelMotionVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -left-8 top-4 h-20 w-20 rounded-full bg-cyan-300/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 bottom-4 h-20 w-20 rounded-full bg-fuchsia-300/15 blur-3xl" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="wallet-modal-title" className="text-xl font-semibold text-white">
                    {title}
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white/80 transition hover:bg-white/20"
                  aria-label={closeLabel}
                >
                  ×
                </button>
              </div>

              {feedback ? (
                <div
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm",
                    feedback.isStatus
                      ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
                      : "border-red-300/35 bg-red-500/10 text-red-200"
                  )}
                  role={feedback.isStatus ? "status" : "alert"}
                  aria-live={feedback.isStatus ? "polite" : "assertive"}
                >
                  {feedback.isStatus ? (
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full border-2 border-cyan-300",
                        shouldReduceMotion ? "bg-cyan-300/60" : "animate-spin border-t-transparent"
                      )}
                    />
                  ) : null}
                  {feedback.text}
                </div>
              ) : null}

              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
