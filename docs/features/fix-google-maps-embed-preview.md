# Fix Google Maps Embed Preview

## Summary
- switched the admin collection location preview from a generic `google.com/maps?...&output=embed` URL to the official `Maps Embed API` URL shape
- passed the embed API key explicitly into the location editor so the iframe preview can keep working after client-side place selection
- left the outbound `Open in Google Maps` CTA unchanged as the reliable fallback navigation path

## Why
- the previous iframe URL was not a stable embedded contract and could render a blocked-content panel instead of a usable preview
- the location editor needs one embeddable URL format that works for persisted content and local draft preview alike

## Notes
- the preview now expects a valid Google Maps embed-capable API key
- autocomplete still uses `GOOGLE_MAPS_API_KEY` server-side
- the map preview may still require `Maps Embed API` to be enabled in the Google Cloud project for the same key
