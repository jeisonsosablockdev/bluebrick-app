---
type: Fix Spec
title: Fix Admin Cm Deploy Detailed Logs
description: Fix Admin Cm Deploy Detailed Logs - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-admin-cm-deploy-detailed-logs.md
---

# Fix: Admin Candy Machine deploy detailed logs

## Problem

The `/admin/assets/new` Candy Machine deploy flow can fail or appear stuck across several distinct stages:

- server-side transaction preparation
- wallet signing
- backend transaction submission
- RPC confirmation polling
- snapshot finalization and Create Asset gating

Today the UI shows the current coarse status, but the server logs do not consistently explain which transaction was prepared, signed, sent, accepted by RPC, deferred for later confirmation, confirmed, timed out, or failed. This makes it hard to distinguish a collection-only timeout from a Candy Machine creation failure or a config-line confirmation delay.

## Why It Matters

The deploy flow uses real Solana transactions and a verified snapshot gate before marketplace entry creation. Debugging needs high-resolution evidence without weakening the gate or trusting client claims. Operators need to know:

- which transaction index and kind failed
- whether the transaction was submitted to RPC
- whether confirmation polling saw `processed`, `confirmed`, `finalized`, `err`, or `null`
- which RPC host and blockhash lifetime were used
- whether confirmation was immediate or deferred

## Expected Outcome

The system records structured, correlated logs for the deploy lifecycle. A single `deployId` should connect prepare, sign, submit, confirmation, and snapshot-facing steps. Logs should be detailed enough to diagnose user-reported failures while avoiding sensitive payloads such as full serialized transactions.

## Current Gaps

- Prepare logs do not describe blockhash, transaction count, chunk sizing, byte size, signer count, or instruction count.
- Submit logs are not guaranteed to carry a deploy correlation id.
- Confirmation polling does not log each meaningful status transition.
- Deferred confirmations are not clearly separated from immediate structural confirmations.
- Client-side steps are not correlated with server-side logs.

## Open Questions

- Whether these logs should later persist to a database-backed audit table instead of the current in-memory operability store.
- Whether operators need a dedicated admin UI filter for `core_candy_machine.deploy.*` events.
