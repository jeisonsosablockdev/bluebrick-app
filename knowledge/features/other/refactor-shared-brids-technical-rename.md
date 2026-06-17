---
type: Feature Spec
title: Refactor Shared BRI-ds Technical Rename
description: Refactor Shared BRI-ds Technical Rename - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/refactor-shared-brids-technical-rename.md
---

Last Updated: 2026-05-06

# BRIDS Technical Rename

- Renamed the root technical identifiers from `solana-test-1` / `solana-test-1-ui` to `brids` across the workspace package manifest, lockfile, and Nix dev shell metadata.
- Updated active Pinata/Core Candy Machine metadata tags so newly generated assets are labeled with `app: "brids"` instead of the previous project slug.
- Aligned the root README scaffold and generated README seed with the `BRIDS` project name to keep future docs sync output consistent after the repository and folder rename.
