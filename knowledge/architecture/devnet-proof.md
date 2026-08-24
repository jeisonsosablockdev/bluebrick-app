---
type: ADR
title: Devnet Verification and Proof Policy
description: Protocol for on-chain Devnet verification, real transaction execution, and verifiable proof recording.
tags: [blockchain, solana, devnet, verification]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Devnet Verification and Proof Policy

## Scope
- Rules and standards for executing, recording, and asserting Devnet on-chain proof.

## Invariants
- NEVER use localnet, mocks, or simulated transactions for blockchain verification.
- Every on-chain feature change must record valid Devnet transaction signatures.
