"use client";

/**
 * features/navigation/presentation/nav-modal-icons.tsx
 * Layer 1 — Presentation: pure SVG icon components.
 * Extracted from main-top-navigation-modal.tsx.
 */

export function WalletCtaIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h10.5A2.25 2.25 0 0 1 18.75 7.5v1.125H6A2.25 2.25 0 0 0 3.75 10.875V7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8.625H6A2.25 2.25 0 0 0 3.75 10.875v5.625A2.25 2.25 0 0 0 6 18.75h12A2.25 2.25 0 0 0 20.25 16.5v-5.625A2.25 2.25 0 0 0 18 8.625Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.125 13.5h.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MailMethodIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v7.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.75v-7.5a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m4.5 8.25 7.5 5.25 7.5-5.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
