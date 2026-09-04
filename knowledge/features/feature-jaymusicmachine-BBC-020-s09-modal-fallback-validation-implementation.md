# BBC-020 SPEC-09 — Solution Spec: Modal Fallback Validation Implementation

**Linear Issue:** BBC-020  
**SPEC Index:** 09  
**Feature Branch:** `feature/jaymusicmachine-BBC-020-image-detail-implementation`  
**Author:** jaymusicmachine  
**Created:** 2026-09-04  
**Status:** IN PROGRESS

---

## 1. Solution Overview

Add per-photo error tracking to `ImageDetailModal`. When an `<img>` fires `onError`, set that photo's index into a `Set<number>` state. Render a compact brand fallback card (≤ 320×240 natural size, centered in the modal overlay) instead of the full-screen stretched `<img>` when the current photo index is in the error set. Navigation arrows remain functional; error state resets on re-open.

---

## 2. 4-Layer Architecture Mapping

| Layer | File | Change |
|-------|------|--------|
| **Presentation (L1)** | `apps/web/src/features/image-detail/image-detail-modal.tsx` | Add `imageErrorIndexes` state (`Set<number>`), `handleImageLoadError` callback, conditional `ModalFallback` render |
| **Presentation (L1)** | `apps/web/src/features/image-detail/image-detail-modal.tsx` | New internal `ModalFallbackCard` sub-component (≤ 320×240, brand logo + phase name) |
| **Tests** | `apps/web/src/features/image-detail/image-detail-modal.test.tsx` | 4 new test cases: broken URL shows fallback, fallback is compact, navigation from fallback, state per-index |

**No other files need modification.** The `ProjectPhaseMediaCard` and `ProjectPhaseProgress` are untouched.

---

## 3. Implementation Details

### 3.1 — `imageErrorIndexes: Set<number>` State

```tsx
// Step 1: Track which flattened photo indexes failed to load.
const [imageErrorIndexes, setImageErrorIndexes] = useState<ReadonlySet<number>>(
  new Set()
);

// Step 2: Reset error set when modal opens (new session).
useEffect(() => {
  if (isOpen) setImageErrorIndexes(new Set());
}, [isOpen]);

// Step 3: Mark index as broken on native image load failure.
const handleImageLoadError = useCallback(
  (index: number) => () => {
    setImageErrorIndexes((prev) => new Set([...prev, index]));
  },
  []
);
```

### 3.2 — `ModalFallbackCard` Sub-Component

- Renders BlueBrick logo (same asset used by `ProjectPhaseMediaCard` fallback).
- Fixed natural size: `w-[320px] h-[240px]` — does NOT fill the modal.
- Glassmorphism background matching existing card fallback style.
- Phase name badge rendered below logo.
- No `object-fit: cover` full-bleed — it's a contained box, centered in the overlay.

### 3.3 — Conditional Render in `ImageDetailModalPortal`

```tsx
// Step 4: Decide whether to show real image or compact fallback.
const isCurrentImageBroken = imageErrorIndexes.has(currentIndex);

// In JSX:
{isCurrentImageBroken ? (
  <ModalFallbackCard phaseName={currentPhoto.phaseName} />
) : (
  <img
    src={currentPhoto.url}
    onError={handleImageLoadError(currentIndex)}
    // ... zoom transforms, alt, etc.
  />
)}
```

### 3.4 — Zoom Controls Hidden on Fallback

When `isCurrentImageBroken`, the ZoomIn/ZoomOut/Reset controls are hidden (no-op since there's no image to zoom). The close button and nav arrows remain visible.

---

## 4. ModalFallbackCard Visual Spec

```
┌────────────────────────────────────┐  ← 320px wide
│  [blur brand bg ~ emerald/slate]  │
│                                    │  
│    🔵  BlueBrick           │  ← logo + text
│                                    │
│    ● Fase 5 · Sin fotografía       │  ← phase badge
└────────────────────────────────────┘  ← 240px tall
```

- Background: `bg-slate-900/60 backdrop-blur-md` matching existing card fallback.
- Logo: `/logo-bluebrick.svg` or `/bluebrick-logo-text.svg` (same as card).
- Phase pill: same `bg-emerald-500/20 text-emerald-300 border border-emerald-500/30` styling as existing phase badges.
- Caption: "Sin fotografía disponible" in `text-slate-400 text-xs`.

---

## 5. Test Plan (TDD — RED first)

### New Tests in `image-detail-modal.test.tsx`

| Test ID | Description |
|---------|-------------|
| T09-1 | When `onError` fires for index 0, fallback card renders instead of `<img>` |
| T09-2 | Fallback card has bounded dimensions (not full-screen) |
| T09-3 | Navigating from a broken photo (index 0) to next (index 1) shows the next photo normally |
| T09-4 | Error on index 0 does NOT affect index 1 (independent state) |
| T09-5 | Zoom controls are hidden when current image is in error state |
| T09-6 | Error set resets when modal is closed and reopened |

---

## 6. Files Changed

| File | Change Type | Description |
|------|------------|-------------|
| `apps/web/src/features/image-detail/image-detail-modal.tsx` | MODIFY | Add `imageErrorIndexes` state, `handleImageLoadError`, `ModalFallbackCard`, conditional render |
| `apps/web/src/features/image-detail/image-detail-modal.test.tsx` | MODIFY | Add 6 new SPEC-09 test cases |

---

## 7. Definition of Done

- [ ] `pnpm validate` GREEN (zero type errors, all tests pass)
- [ ] Explicit clean-code + in-code commentary pass
- [ ] `data-testid="modal-fallback-card"` present on fallback element
- [ ] No regression: SPEC-01 through SPEC-08 tests still pass
