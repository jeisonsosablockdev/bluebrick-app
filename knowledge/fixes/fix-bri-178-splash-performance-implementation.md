# FIX IMPLEMENTATION: Splash Screen Performance (BRI-178)

## 1. Goal
Implement GPU acceleration for `AppSplashScreen` animations to ensure a fluid 60fps experience on modest mobile hardware (e.g., Samsung A15, iPhone 13 Pro).

## 2. Changes Implemented
- **File**: `components/brand/app-splash-screen.tsx`
- **React Hooks**: Extracted the literal variant objects (`cyanVariants`, `violetVariants`, `blueVariants`, `centerVariants`, `bMarkVariants`, `letterVariants`, `wordmarkVariants`) into `useMemo` hooks, keyed by `prefersReducedMotion`.
- **CSS Styles**: Added `style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}` to the main container and the animating glow divs. Added `willChange: "transform, opacity"` to the SVG elements.
- **Visual & Math Refactor (Centering and timed swallowing)**:
  - Adjusted B-Mark's `collapsed.x` and `exiting.x` targets to `47.7px`. Since the B-Mark starting center is `10.5px`, this mathematically aligns the B-Mark center perfectly at `58.185px` (the exact center of the `116.37px` wide SVG viewbox).
  - Adjusted Wordmark's `collapsed.x` and `exiting.x` targets to `-51.5px` to align the center of the letter 'S' (`109.5px - 51.5px = 58.0px`) directly with the centered B-Mark.
  - Refactored `letterVariants` fade-out timings during collapse phase to achieve the "swallowing" visual effect:
    - 'R' and 'I' (indexes 0, 1, 2) fade instantly (`duration: 0.05s`, `delay: 0.0s`) before moving.
    - 'D' (index 3) barely moves (`duration: 0.12s`, `delay: 0.06s`).
    - 'S' (index 4) slides all the way to the center (`duration: 0.45s`, `delay: 0.15s`) to merge/fuse with 'B'.

## 3. Rollback Plan
- Revert the commit on `components/brand/app-splash-screen.tsx`.

## 4. Verification
- Validate the PR locally using `npm run validate`.
- Test on the affected devices (Samsung A15, iPhone 13 Pro) to confirm the lag is resolved.
