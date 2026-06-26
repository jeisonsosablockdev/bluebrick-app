---
type: Feature Spec
title: Fix Google Maps Embed Preview
description: Fix Google Maps Embed Preview - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-google-maps-embed-preview.md
---

# Fix Google Maps Embed Preview

## Summary
- switched the admin collection location preview from a generic `google.com/maps?...&output=embed` URL to the official `Maps Embed API` URL shape
- separated the browser embed key from the server-side Places key so the iframe can use a referrer-safe public key
- allowed Google Maps origins in the app CSP `frame-src` directive so the embed iframe can actually render
- left the outbound `Open in Google Maps` CTA unchanged as the reliable fallback navigation path

## Why
- the previous iframe URL was not a stable embedded contract and could render a blocked-content panel instead of a usable preview
- the location editor needs one embeddable URL format that works for persisted content and local draft preview alike

## Notes
- the preview now expects `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`
- autocomplete still uses `GOOGLE_MAPS_API_KEY` server-side
- the embed key must allow `Maps Embed API` and the active browser referrer (for local dev: `http://localhost:3000/*` and `http://127.0.0.1:3000/*`)
- the host app CSP must allow `https://www.google.com` in `frame-src`, otherwise the browser blocks the iframe before Google Maps can boot
