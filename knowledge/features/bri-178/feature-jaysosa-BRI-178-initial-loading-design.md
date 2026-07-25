---
type: Feature Spec
title: Feature Jaysosa BRI- 178 Initial Loading Design
description: Feature Jaysosa BRI- 178 Initial Loading Design - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-178/feature-jaysosa-BRI-178-initial-loading-design.md
---

# Problem Artifact: Initial Loading Screen Design

## What problem exists
The current initial loading screen (splash screen) for the BRIDS application does not match the premium dark look and feel of the main landing page, which features diffuse violet and cyan radial glow effects over a deep night-blue (`#04060F`) background. It also includes loading text ("BRIDS") and lacks a high-end, immersive exit transition, leaving the entrance to the application feeling basic and static.

## Why it matters
The first few seconds of a user's experience on a premium fintech platform are crucial to setting their expectation of quality. A loading screen that lacks polished animations and consistent branding detracts from the high-fidelity aesthetic of the rest of the application.

## What outcome is expected
* The loading screen uses the exact dark night-blue base (`#04060F`) and diffuse purple/cyan radial glow lights from the landing page.
* The BRIDS geometric logo mark is the sole, dominant element, positioned in the vertical center and slightly shifted to the left (no loading texts, indicators, or bars).
* The background diffuse lights have a slow, breathing or orbital animation.
* Upon completion of loading, the logo scales up exponentially (zoom-in effect) to seamlessly transition the user into the main application.

## What gaps exist today
* The current splash screen shows the "BRIDS" label.
* The current splash background gradient does not match the landing page lighting.
* The current exit transition is a simple fade-out (`opacity: 0`).

## What questions remain open
None. All layout constraints (vertical mobile aspect ratio) and visual characteristics (no loading indicators, logo-dominant) were clarified.
