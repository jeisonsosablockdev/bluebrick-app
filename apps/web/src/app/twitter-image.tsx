/**
 * @file apps/web/src/app/twitter-image.tsx
 * @description Layer 1: Presentation - Next.js App Router Dynamic Twitter Card Image Generator.
 * Reuses OpenGraph visual template with canonical brand color tokens (#04283C, #FFFFFF, #FC040C)
 * for high-resolution Twitter summary_large_image cards.
 */

// Step 1: Re-export dynamic image configuration and generator from opengraph-image
export { default, size, contentType, alt } from "./opengraph-image";
