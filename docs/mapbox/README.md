# BRIDS Marketplace Mapbox Style

## Artifact
- Style JSON: `docs/mapbox/brids-marketplace-decimal-style.json`
- Intended Mapbox style name: `BRIDS Marketplace Decimal`
- Runtime env var after publishing: `NEXT_PUBLIC_MAPBOX_STYLE_URL`
- Safe runtime fallback: `mapbox://styles/mapbox/dark-v11`

## Visual Contract
The marketplace map uses a `Decimal x BRIDS` direction:
- dark editorial land and water
- muted generic POIs
- readable city, state, neighborhood, and major road labels
- subtle cyan/violet highlights
- marketplace entries are the primary points of interest through React Map GL markers

The style JSON handles the base map only. Property pins are injected by the app at runtime from marketplace entry coordinates.

## Publish Options
Use Mapbox Studio when possible:
1. Open Mapbox Studio.
2. Create a new style.
3. Import `docs/mapbox/brids-marketplace-decimal-style.json`.
4. Publish the style.
5. Copy the `mapbox://styles/{username}/{style_id}` URL.
6. Set `NEXT_PUBLIC_MAPBOX_STYLE_URL` to that URL.

Use the Styles API only with a private token that has `styles:write`:

```bash
curl -X POST "https://api.mapbox.com/styles/v1/$MAPBOX_USERNAME?access_token=$MAPBOX_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data @docs/mapbox/brids-marketplace-decimal-style.json
```

Do not commit `MAPBOX_ACCESS_TOKEN`. The app only needs the public `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to render the published style.

## Sources
- Mapbox Style Specification root object: `version: 8`, `sources`, `sprite`, `glyphs`, and `layers`
- Mapbox Styles API style creation requires a token with `styles:write`
