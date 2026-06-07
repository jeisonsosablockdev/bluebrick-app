# Implementation: Admin Candy Machine deploy detailed logs

## Resolution

Add structured, security-conscious logs around the current Candy Machine deploy pipeline without changing transaction semantics.

The ongoing investigation memory is tracked in:

- `docs/knowledge/inbox/2026-06/KNOW-2026-06-001-admin-candy-machine-module-worklog.md`

## Design Contract

- Keep the verified snapshot gate unchanged.
- Do not add retry, recovery, or alternate submit behavior in this slice.
- Use server-generated `deployId` as the correlation key.
- Allow the client to echo `deployId` to submit only for log correlation; never use it for authority, ownership, or verification decisions.
- Never log full `transactionBase64`, instruction data, cookies, private keys, wallet secrets, or request bodies.
- It is acceptable to log public keys, signatures, blockhash, last valid block height, transaction kind, index, serialized byte length, instruction count, signer count, and RPC host.

## Slices

1. Documentation and contract
   - Create fix artifact pair.
   - Update `docs/nft-spec.md` with the deploy logging contract.

2. Server deploy logs
   - Add a small logging helper for `core_candy_machine.deploy.*` events.
   - Record prepare start, blockhash fetched, transaction prepared, config-line chunk decisions, and prepare complete.
   - Record submit start, parse/payer validation, RPC send attempts, RPC acceptance, confirmation polling, deferred confirmation, submit complete, and errors.

3. Client correlation logs
   - Pass `deployId` from prepare response to submit request for correlation.
   - Add concise browser console logs for wallet signing and submit boundaries.

4. Tests and validation
   - Add unit coverage for deploy trace logging.
   - Add a lightweight knowledge enforcement that requires a Candy Machine deploy iteration file when deploy paths change.
   - Run targeted tests, typecheck, docs governance, and full validation when feasible.

## Tooling

- Solana Developer MCP was used to confirm transaction lifecycle observability points: recent blockhash, send transaction, and `getSignatureStatuses`.
- Existing `lib/observability` store will receive operability logs for admin monitoring.
- `validate:knowledge` now also checks that Candy Machine deploy changes have a branch-level iteration artifact based on `docs/knowledge/templates/CANDY_MACHINE_DEPLOY_ITERATION.template.md`.

## Acceptance Gates

- `npm run typecheck`
- Targeted Candy Machine tests
- `npm run validate`
- Clean-code pass confirms no secrets or full signed transaction payloads are logged.

## Linear Sync

No Linear issue was provided for this slice. If one is created later, link this artifact and the resulting PR.
