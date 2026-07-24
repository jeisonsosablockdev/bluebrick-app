---
type: Feature Spec
title: Feature Shared Cleanup Marketplace 3d Visual Docs
description: Feature Shared Cleanup Marketplace 3d Visual Docs - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-cleanup-marketplace-3d-visual-docs.md
---

# Problem Artifact: cleanup-marketplace-3d-visual-docs

## What problem exists
Duplicate feature markdown files for BRI-164 marketplace 3D visual exist in the root of `knowledge/features/`, which causes confusion and redundant lists. The clean versions reside inside the `bri-164-marketplace-3d-visual/` subdirectory.

## Why it matters
Keeps the repository clean and prevents dead/incorrect links in knowledge base indices.

## What outcome is expected
All root duplicate files are deleted, index files and roadmaps are updated to point to the subdirectory versions, and internally referenced paths are fixed.

## What gaps exist today
Duplicates in root, incorrect paths in indices.

## What questions remain open
None.
