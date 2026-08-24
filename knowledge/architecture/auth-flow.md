---
type: ADR
title: Authentication Flow Specification
description: Client and wallet authentication flow — SIWS (Sign-In with Solana), session verification, and role-based access.
tags: [auth, siws, solana, security]
timestamp: 2026-08-23T00:00:00Z
resource: local
---

# Authentication Flow Specification

## Scope
- Wallet connection, message challenge creation, cryptographic signature verification, and session binding.

## Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Client as Next.js Client
  participant Server as Next.js Server / API
  participant Solana as Solana Devnet RPC

  User ->> Client: Connect Wallet (Phantom / Adapter)
  Client ->> Server: Request Auth Challenge (Nonce / CSRF)
  Server -->> Client: Return Structured Challenge Message
  Client ->> User: Request Signature (signMessage)
  User ->> Client: Approve & Sign Challenge
  Client ->> Server: Submit Signature + Public Key
  Server ->> Server: Verify Ed25519 Signature
  Server -->> Client: Issue Session Token / Cookie
```

## Security Invariants
- Nonces must be cryptographically random and time-bound (TTL <= 120s).
- Signatures must match the claiming public key with zero replay allowance.
