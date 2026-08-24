# Problem Fix: Dashboard Mobile Responsiveness & Sticky TopNav

## What problem exists
On small screen devices (mobile viewports < 1024px), the investment dashboard layout forced the "Patrimonio invertido total" and "Distribución del portafolio" cards side-by-side in a fixed grid. This caused text overlap, truncation of invested balance figures, and compressed the Recharts pie chart. In addition, the TopNav was statically positioned, scrolling out of view when users navigated through the portfolio.

## Why it matters
Mobile investors need clear, readable financial figures and an intuitive user experience. The total portfolio balance, ROI, and property allocation must be prominently visible without horizontal clipping, and navigation controls should remain accessible via a sticky header.

## What outcome is expected
1. **Sticky Header**: TopNav fixed to the top of the viewport with a frosted glass backdrop blur.
2. **Mobile-First Stacked Hero Grid**: "Patrimonio invertido total" expands to full width on mobile, with "Distribución del portafolio" cleanly stacked directly underneath.
3. **Fluid Typography & StatChips Grid**: Monospace numbers scale fluidly with `clamp()`, and KPI chips wrap into a clean 2-column mobile layout.
4. **Stacked Carousel Cards & Horizontal Scroll Table**: Investment cards stack vertically on small screens to prevent lateral compression.

## What gaps existed
- Fixed inline CSS `gridTemplateColumns: "1.15fr 1fr"` without responsive breakpoints.
- Header lacked `position: sticky; top: 0; z-index: 50`.
