# BBC-020 SPEC-09 — Problem Spec: Modal Fallback Validation

**Linear Issue:** BBC-020  
**SPEC Index:** 09  
**Feature Branch:** `feature/jaymusicmachine-BBC-020-image-detail-implementation`  
**Author:** jaymusicmachine  
**Created:** 2026-09-04  
**Status:** IN PROGRESS

---

## 1. Problem Statement

When a user opens the `ImageDetailModal` (lightbox) for a project phase whose image URL resolves to a dead/broken server (e.g., `https://drive.blue-brick.com/vn/cimentacion-3.jpg`), the modal expands to full-screen and renders a blank/broken image, providing no feedback and breaking the UX.

Root cause: The `ImageDetailModal` currently has **zero URL error handling**. The `ProjectPhaseMediaCard` handles card-level errors via `imageError` state + `handleImageError()`, but this protection is not mirrored in the modal.

---

## 2. Affected User Scenario

- Projects: CARROLLWOOD (CW-04), BK-02, BT-05, DC-03, LL-06, RM-08
- Phase 5: "Demoliciones y/o cimentación" — `imagen_url_1 = 'https://drive.blue-brick.com/vn/cimentacion-3.jpg'` (dead domain, DNS failure)
- User taps on the phase card → modal opens → full-screen blank image renders
- No brand presence, no error message, no fallback

---

## 3. Requirements

### R1 — Modal Must Show Compact Fallback When Image Fails
If the currently displayed image in the lightbox fails to load (network error / broken URL), the modal MUST NOT stretch a blank image to full-screen. Instead it must display a compact, bounded brand fallback (BlueBrick logo + phase name) centered at a natural contained size (~320×240px), not filling the full viewport.

### R2 — Fallback Must Match Card Fallback Visual Style
The modal fallback must use the same brand language as `ProjectPhaseMediaCard`'s fallback: BlueBrick logo with blurred/brand background + phase name badge. Size is bounded and centered in the overlay.

### R3 — Navigation Works on Broken Photos
Nav arrows still function when current photo is in fallback. The error state belongs to that specific index — navigating away resets to normal for the next photo.

### R4 — Error State is Per-Photo-Index
Each photo in the flattened collection has independent error state. An error on photo index 2 does not mark index 0 as broken.

### R5 — No Regression on Card Preview
The card-level `handleImageError` fallback in `ProjectPhaseMediaCard` must remain fully functional and unaffected.

---

## 4. Out of Scope

- Removing broken URLs from the database (data-layer fix, separate task).
- URL pre-validation in `enrichItemsWithProjectPhases` (server-side filtering, separate fix).

---

## 5. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | When a photo URL fails to load in the modal, the full-screen image area is replaced by a compact brand fallback (≤ natural size, centered) |
| AC-2 | The modal overlay remains open so the user can navigate with arrows to other photos |
| AC-3 | Phase badge / title still renders correctly when in fallback state |
| AC-4 | Navigation arrows still function to move to adjacent photos when current is in fallback |
| AC-5 | No regression: card-level fallback continues to work independently |
| AC-6 | All new and existing tests pass (`pnpm validate` GREEN) |
| AC-7 | Fallback state is per-index and resets when navigating away and returning |
