# S44 - Marketplace Security Audit and Remediation Plan

## Status
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan`
- Parent branch: `feature/app-create-a-marketplace-3d-visual-bri-164-integration`
- Date: 2026-05-30
- Scope: documentation-only security audit and remediation plan.
- Runtime changes: none.

## Audit Standard Applied
This audit follows the local `security-audit` workflow:
- reconnaissance and attack-surface mapping
- vulnerability scanning
- web application testing review
- API security testing review
- hardening review
- reporting with risk levels and remediation slices

No external production penetration test was executed because no deployed target was provided. This audit is local code, dependency, route, and configuration review against the current branch.

## Executive Summary
The marketplace implementation has good baseline controls in several high-risk areas:
- admin marketplace entry creation is server-authorized through `getRequestRole`
- purchase challenge, prepare, and submit require authenticated wallet sessions
- purchase challenge signing binds wallet, property, candy machine, quantity, nonce, and expiry
- purchase prepare consumes challenges and validates replay-sensitive context
- submit validates payer ownership and prepared transaction message matching
- marketplace SQL writes and reads use parameterized queries
- public map pins validate latitude and longitude ranges
- Mapbox loads behind a deferred client boundary and falls back to the traditional list

The audit did not find a P0 active compromise path in the marketplace code. It did find release-blocking dependency risk and several P2 hardening gaps that should be sliced before a security-critical release.

## Scope
Audited surfaces:
- `/marketplace`
- `/marketplace/[id]`
- `/properties`
- `/properties/[id]`
- `/api/admin/marketplace/entries`
- `/api/purchase/quote`
- `/api/purchase/challenge`
- `/api/purchase/prepare`
- `/api/purchase/submit`
- `/api/checkout/cart`
- `/api/checkout/order`
- marketplace Mapbox client shell, markers, and fallback behavior
- marketplace detail Google Maps card
- marketplace detail document and blockchain links
- marketplace persistence repositories and row mappers
- security headers and Next.js config
- package dependency audit
- secret-pattern scan across repository files

Out of scope for this document:
- external infrastructure scanning
- production WAF/bot policy verification
- cloud IAM review
- full Solana program Rust audit
- real devnet transaction execution
- Linear mutation unless requested after approval

## Evidence Collected
Commands run:
- `git status --short --branch`
- `sed -n` and `nl -ba` over audited marketplace, API, purchase, repository, header, and config files
- `rg` route and secret-pattern mapping
- `npm audit --omit=dev --json`
- `npm run validate:operability`
- `npm test -- tests/api/public-properties-routes.test.ts tests/api/admin-marketplace-entries-route.test.ts tests/api/purchase-challenge-route.test.ts tests/api/purchase-prepare-route.test.ts tests/api/purchase-submit-route.test.ts tests/lib/security-headers.test.ts tests/lib/marketplace-map-pins.test.ts`

Validation result:
- `npm run validate:operability`: passed, 7 files, 15 tests.
- Targeted security-relevant unit/API tests: passed, 7 files, 30 tests.
- Secret-pattern scan: no committed production-looking Mapbox, Google Maps, private key, or webhook secret found outside `.env.example` placeholders and test fixtures.
- `npm audit --omit=dev --json`: failed with 33 production dependency findings, including 3 high and 30 moderate.

## Threat Model
Primary assets:
- authenticated wallet session and SIWS cookie
- admin-only marketplace creation path
- property inventory and detail data
- public marketplace availability
- on-chain purchase preparation and submit integrity
- third-party API keys and public map tokens
- Solana RPC capacity
- buyer identity, compliance state, and transaction attempt records

Primary attacker profiles:
- unauthenticated public visitor causing availability pressure
- authenticated wallet user trying replay, mismatched wallet, quantity, or idempotency abuse
- compromised or malicious admin payload creating unsafe marketplace content
- dependency-level attacker exploiting vulnerable framework or parser packages
- third-party map/provider visibility over route and location usage

Trust boundaries:
- browser to public marketplace APIs
- browser to authenticated purchase APIs
- admin browser to admin marketplace create API
- server to Postgres
- server to Solana RPC
- server/client to Mapbox and Google Maps
- persisted marketplace content to React rendering and external links

## Positive Controls Verified
- Admin create requires authenticated admin role and pubkey before payload processing: `app/api/admin/marketplace/entries/route.ts`.
- Admin create 500 path already returns a generic message for internal persistence failures.
- Public marketplace map falls back to list-only when Mapbox token or pins are unavailable.
- Map pin projection filters to USA listings and validates coordinate ranges.
- Google Maps embed URL is generated through query encoding for embed mode.
- Purchase challenge requires authenticated wallet.
- Purchase prepare requires authenticated wallet, compliance access, fresh guard snapshot, rate limit, challenge signature, challenge consumption, and price-change checks.
- Purchase submit requires authenticated wallet, payer matching, prepared transaction message matching, idempotency lookup, and ownership check.
- Purchase anti-bot persists rate-limit events and challenges when `DATABASE_URL` is configured.
- SQL read/write paths use parameterized queries.
- `X-Frame-Options`, `frame-ancestors`, `nosniff`, `Permissions-Policy`, COOP, CORP, and referrer policy headers are configured.

## Findings

### P1-01 - Direct Next.js dependency has current high advisories
Evidence:
- `package.json:76` uses `next` `^16.2.4`.
- `npm audit --omit=dev --json` reports direct `next` high findings affecting installed range, including Server Components DoS, App Router middleware/proxy bypass advisories, WebSocket SSRF, cache poisoning, and Image Optimization DoS.

Impact:
- Public routes such as `/marketplace`, `/marketplace/[id]`, and API routes inherit framework-level exposure.
- Some advisories may not be fully exploitable here because there is no `middleware.ts`, but the direct framework package is still below the patched range reported by audit.

Solution:
- Create a dedicated dependency slice to upgrade `next` to the patched range required by npm audit, then run full `npm run validate`, `npm run build`, marketplace/detail browser proof, and auth/admin smoke checks.
- Do not combine this with marketplace code changes.

### P1-02 - Direct `xlsx` dependency has high advisories and no audit fix
Evidence:
- `package.json:87` uses `xlsx` `^0.18.5`.
- `npm audit --omit=dev --json` reports high findings for prototype pollution and ReDoS in SheetJS.
- The app includes an admin import-preview tracing entry in `next.config.ts:10-15`, so parser exposure is relevant to admin asset ingestion that can feed marketplace content.

Impact:
- A malicious or malformed spreadsheet uploaded through an admin/import path could impact server availability or object integrity.
- Admin-only does not make this safe; compromised admin/session or malformed vendor files remain realistic.

Solution:
- Create a dedicated dependency/parser slice.
- Preferred fix: replace `xlsx` with a maintained parser or isolated parsing service with strict file size, MIME, sheet count, row count, timeout, and object-shape controls.
- If replacement is not immediately possible, document a temporary waiver with compensating controls and a tracked expiry date.

### P2-01 - Public property detail endpoint exposes raw internal 500 messages
Evidence:
- `app/properties/[id]/route.ts:31-32` returns `error.message` for non-`PropertyRpcError` 500s.
- The route is public and has shared-cache headers for success.

Impact:
- Unexpected repository, RPC, parsing, or runtime errors can leak internal messages to unauthenticated users.
- If an upstream error includes configuration, URL, SQL, stack-derived text, or provider detail, this becomes information disclosure.

Solution:
- TDD first: add a public route test that injects `new Error("database password leaked")` and asserts a generic 500 response.
- Return a stable public error code/message and log sanitized details through operability logging.

### P2-02 - Purchase API unexpected errors expose raw internal messages
Evidence:
- `/api/purchase/quote` returns raw unexpected `message` in `app/api/purchase/quote/route.ts:96-115`.
- Challenge, prepare, and submit use the same pattern for unexpected errors.
- Purchase service errors may include RPC/provider/internal transaction text.

Impact:
- Authenticated and unauthenticated callers can receive internal provider or runtime details.
- Quote is unauthenticated and can be probed directly.

Solution:
- TDD first per endpoint group.
- Preserve business `PurchaseFlowError` payloads.
- Replace unexpected 500 responses with generic public messages and structured logs containing sanitized context.

### P2-03 - Persisted marketplace document URLs are rendered without URL policy validation
Evidence:
- Admin route accepts document URL strings after trim only at `app/api/admin/marketplace/entries/route.ts:97-110`.
- Detail renders each `document.url` directly as `href` at `components/marketplace/PropertyDetailDocumentsBlockchainCards.tsx:27-34`.
- Admin route injects `snapshot:${payload.snapshotId}` into documents, which then becomes a clickable custom-protocol link.

Impact:
- A malicious persisted document URL can create unsafe external navigation, custom protocol invocation, or `javascript:` style click risk depending on browser/CSP behavior.
- Even if admin-only, persisted content becomes public detail-page content.

Solution:
- Create a shared marketplace external URL policy.
- Allow only `https://` document URLs from approved storage/CDN domains and explicit safe internal routes.
- Render non-HTTP internal refs, such as snapshots, as non-clickable metadata or route them through a controlled internal endpoint.

### P2-04 - Google Maps persisted URL is trusted as a public link
Evidence:
- `lib/admin/collection-bootstrap-mapper.ts:731-752` requires a `googleMapsUrl` string but does not validate scheme, host, or range of lat/lng.
- `lib/admin/admin-collection-location-view.ts:80-82` returns persisted `googleMapsPlace.googleMapsUrl` directly.
- `components/marketplace/PropertyDetailGoogleMapsCard.tsx:73-76` renders it as an external link.

Impact:
- If a malformed Google Maps place payload reaches persistence, the public detail page can expose an unsafe link.
- This also weakens confidence that marketplace location links are actually Google Maps URLs.

Solution:
- TDD first: reject `javascript:`, `data:`, non-HTTPS, and non-Google Maps hosts.
- Validate lat/lng ranges in the reduced Google Maps payload.
- Prefer rebuilding public Google Maps links from place id or encoded query instead of storing/rendering provider URL directly.

### P2-05 - CSP is useful but too permissive for a financial marketplace surface
Evidence:
- Production `script-src` includes `'unsafe-inline'` at `lib/security/headers.ts:27-29`.
- `img-src` allows all `https:` at `lib/security/headers.ts:40`.
- `connect-src` allows all `https:` at `lib/security/headers.ts:42`.

Impact:
- Any content-injection issue has a weaker browser containment layer.
- Broad `connect-src` and `img-src` make exfiltration and third-party sprawl harder to reason about.
- Mapbox and Google Maps are legitimate needs, but the policy should enumerate required provider origins instead of all HTTPS.

Solution:
- Stage a stricter CSP in report-only mode first.
- Add explicit allowlists for Mapbox, Google Maps, approved image/CDN domains, Solana RPC origins, WorkOS, Vercel Blob, and other verified providers.
- Move toward nonce/hash-based scripts where compatible with Next.js.

### P2-06 - Public quote and detail paths can fan out to Solana RPC without public rate limits
Evidence:
- `/api/purchase/quote` is unauthenticated and calls `quotePurchaseForProperty`, which reads property context and guard snapshots.
- `quotePurchaseForProperty` can call Solana RPC when cache misses occur.
- `getMarketplacePropertyDetailOrThrowRpc` calls `resolveMarketplacePropertyRealtimeSyncStatus` for detail reads at `lib/property-marketplace-server.ts:149-178`.
- Purchase rate limiting currently covers `purchase_challenge` and `purchase_prepare`, not quote or public detail.

Impact:
- Unauthenticated callers can create DB and RPC pressure through quote/detail requests.
- The quote cache helps but does not fully protect cache-miss bursts, multi-property probing, or detail RPC refreshes.

Solution:
- Add low-friction public rate limits or request budgets for quote and detail sync.
- Add stale-while-refresh behavior for blockchain sync metadata.
- Keep the detail page serving stale property content when RPC is degraded.

### P2-07 - Detail page fails closed to error on blockchain RPC sync failure instead of degrading
Evidence:
- `getMarketplacePropertyDetailOrThrowRpc` throws `PropertyRpcError` when realtime sync status is `rpc_error` at `lib/property-marketplace-server.ts:177-178`.
- `/marketplace/[id]` calls it directly.
- `/properties/[id]` maps `PropertyRpcError` to 502.

Impact:
- A Solana RPC outage can break public property detail rendering even when persisted property data exists.
- Availability risk is security-relevant because public inventory and purchase conversion depend on detail availability.

Solution:
- TDD first: simulate RPC error and assert detail still renders persisted data with `rpc_error` or stale sync banner.
- Keep API status explicit but do not take down the detail page for non-authority sync metadata.

### P2-08 - Marketplace admin payload lacks strict size and schema limits
Evidence:
- Required text fields are trimmed but have no maximum length at `app/api/admin/marketplace/entries/route.ts:51-64`.
- Highlights and documents are count-limited but individual string lengths are not capped at `app/api/admin/marketplace/entries/route.ts:85-110`.
- Structured project/economics/governance text fields are trimmed without max-length schema.

Impact:
- Admin or compromised admin payloads can persist excessive text/URLs/JSON.
- Large public payloads can harm page render, API response size, indexing, and downstream providers.

Solution:
- Add a `zod` or equivalent schema with explicit max lengths, count limits, URL length limits, numeric bounds, and public response shape constraints.
- Split schema creation into its own slice before changing route behavior.

### P2-09 - Submit flow holds DB transaction/row lock while sending network transaction
Evidence:
- `submitPurchase` opens a transaction at `lib/purchase-service.ts:1113-1115`.
- It locks the attempt with `forUpdate` at `lib/purchase-service.ts:1118-1126`.
- It calls `submitPreparedAttemptWithCurrentState`, which sends the signed transaction at `lib/purchase-service.ts:1069-1071`, before commit at `lib/purchase-service.ts:1146`.

Impact:
- A slow Solana RPC call can hold a database row lock longer than necessary.
- An authenticated attacker or degraded RPC can amplify lock contention and reduce checkout throughput.

Solution:
- TDD first around idempotency and duplicate submit behavior.
- Refactor to mark an attempt as `submitting` or claim it in a short transaction, commit, send the network transaction, then persist submitted/failed result in a second short transaction.
- Preserve idempotent retry behavior.

### P3-01 - Health endpoint remains degraded when `SITE_URL` is unset
Evidence:
- Previously observed `/api/health` returned `503 degraded` due `siteUrlConfigured: false`.
- User decision: environment-only fix, no code change.

Impact:
- Operational readiness checks remain yellow/red until deployment env is corrected.

Solution:
- Set the required `SITE_URL` in the target environment.
- No code slice unless the environment contract changes.

### P3-02 - Rate-limit event table has no documented retention policy
Evidence:
- `purchase_rate_limit_events` is append-only in `lib/purchase-rate-limit-repository.ts:100-127`.
- Migrations add indexes, but no retention job or purge policy was found in the audited scope.

Impact:
- Long-running production can accumulate unnecessary IP/wallet event rows.
- This is privacy and operational hygiene risk.

Solution:
- Add a retention slice that deletes old rate-limit events after an approved window.
- Document retention in operability/security docs.

### P3-03 - Google Maps iframe referrer policy is looser than the marketplace privacy target
Evidence:
- Detail iframe uses `referrerPolicy="no-referrer-when-downgrade"` at `components/marketplace/PropertyDetailGoogleMapsCard.tsx:55-60`.

Impact:
- Google Maps receives more referrer context than necessary for a public property detail page.

Solution:
- Prefer `strict-origin-when-cross-origin` or `no-referrer` after validating the embed still works.
- Document the chosen privacy tradeoff.

### P3-04 - Public marketplace read path loads all records before filtering
Evidence:
- `listMarketplaceProperties` reads all records then filters in memory at `lib/property-marketplace-server.ts:128-130`.
- `filterMarketplacePropertyDetails` performs search/city/status/ROI filtering in memory.

Impact:
- This is acceptable for the current inventory size but becomes an availability and latency risk as inventory grows.
- Search query length is not capped in `app/marketplace/page.tsx:86-101`.

Solution:
- Add server-side pagination and DB-level filters before inventory scales.
- Cap public filter input lengths.

### P3-05 - Mapbox public token is correctly public, but private style-write tokens must remain out of repo
Evidence:
- Runtime uses `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, which is public by design.
- Secret scan found only placeholders and tests.

Impact:
- No committed secret found in repo.
- Any private Mapbox style-write token shared outside a secret manager should be revoked and recreated.

Solution:
- Keep `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` domain-restricted in Mapbox.
- Keep private `MAPBOX_ACCESS_TOKEN` out of `.env.example` values, docs, commits, screenshots, and chat logs.

## OWASP Mapping
- A01 Broken Access Control: purchase and admin controls mostly good; public URL policy and detail degradation need hardening.
- A02 Cryptographic Failures: no direct crypto bug found in marketplace; SIWS/session and challenge signature flow are server-side.
- A03 Injection: no SQL injection found in audited marketplace repositories; persisted unsafe URL injection remains a concern.
- A04 Insecure Design: public RPC fan-out and detail RPC hard-fail are design-level availability risks.
- A05 Security Misconfiguration: CSP broadness and dependency advisories are the main findings.
- A06 Vulnerable Components: P1 dependency findings in Next.js and `xlsx`.
- A07 Identification/Auth Failures: no direct marketplace auth bypass found.
- A08 Software/Data Integrity Failures: persisted marketplace payloads need stricter schema and URL integrity policy.
- A09 Logging/Monitoring Failures: raw public errors should become sanitized logs plus generic responses; degraded health needs env fix.
- A10 SSRF: framework-level Next advisory and broad external provider surface require dependency patch and origin allowlists.

## API Security Mapping
- Authentication: admin create, checkout, challenge, prepare, and submit are guarded server-side.
- Authorization: admin create requires `role === "admin"`; purchase binds authenticated wallet.
- Replay protection: challenge consumption and idempotency checks exist.
- Rate limiting: present for challenge and prepare; missing for quote and public detail sync.
- Input validation: present for many numeric fields and coordinates; missing strict string length and external URL policy.
- Error handling: admin create safe for internal 500; public property detail and purchase unexpected errors need generic responses.
- Logging: purchase flow event logging exists; public property detail should add sanitized operability logging.

## Remediation Plan by Slice
Each remediation must be developed in its own branch and start with tests first.

### S45 - Patch Next.js security advisories
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s45-next-security-patch`
- Type: dependency/security
- TDD/gates first:
  - capture current `npm audit --omit=dev` failure
  - add/adjust no runtime tests unless upgrade breaks snapshots
- Implementation:
  - upgrade `next` to patched version reported by audit
  - update lockfile
- Validation:
  - `npm audit --omit=dev`
  - `npm run validate`
  - `npm run build`
  - browser proof for `/marketplace` and existing detail page

### S46 - Resolve `xlsx` parser risk
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s46-xlsx-parser-risk`
- Type: dependency/security
- TDD/gates first:
  - identify import-preview parser tests
  - add malicious-size/shape tests around spreadsheet parsing limits
- Implementation:
  - replace `xlsx` or isolate/cap parser behavior
  - document temporary waiver only if replacement is not feasible in one slice
- Validation:
  - parser tests
  - `npm audit --omit=dev`
  - `npm run validate`

### S47 - Public property detail safe error contract
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s47-public-detail-safe-errors`
- Type: security/fix
- TDD first:
  - update `tests/api/public-properties-routes.test.ts` to assert internal errors are not returned
- Implementation:
  - generic 500 public response
  - sanitized operability log
- Validation:
  - targeted public properties tests
  - `npm run validate:operability`

### S48 - Purchase API unexpected error contract
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s48-purchase-safe-errors`
- Type: security/fix
- TDD first:
  - add quote/challenge/prepare/submit tests for unexpected internal errors
- Implementation:
  - generic unexpected 500 responses
  - preserve `PurchaseFlowError` business details
  - sanitize flow metadata
- Validation:
  - purchase API tests
  - `npm run validate:operability`

### S49 - Shared marketplace external URL policy
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s49-marketplace-url-policy`
- Type: security/fix
- TDD first:
  - unit tests for allowed and denied URL schemes/hosts
- Implementation:
  - shared helper for marketplace-safe external links
  - allowlist document, image, explorer, Google Maps, and internal routes separately
- Validation:
  - helper tests

### S50 - Admin marketplace document URL validation
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s50-admin-document-url-validation`
- Type: security/fix
- TDD first:
  - admin create tests reject `javascript:`, `data:`, non-HTTPS, and overlong document URLs
- Implementation:
  - apply S49 policy in admin payload normalization
  - stop emitting clickable `snapshot:` documents
- Validation:
  - admin marketplace route tests

### S51 - Detail document safe renderer
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s51-detail-document-safe-renderer`
- Type: security/fix
- TDD first:
  - component tests assert unsafe document refs render as text or are omitted
- Implementation:
  - render only safe link URLs as anchors
  - render internal snapshot metadata through a safe non-link or approved route
- Validation:
  - document/blockchain card tests

### S52 - Google Maps URL and payload hardening
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s52-google-maps-url-hardening`
- Type: security/fix
- TDD first:
  - reject non-Google Maps URLs
  - reject lat/lng out of range
  - verify generated fallback URL stays encoded
- Implementation:
  - validate reduced Google Maps payload
  - rebuild public link from place id/query where possible
- Validation:
  - Google Maps location service/view tests
  - detail Google Maps card tests

### S53 - CSP report-only tightening
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s53-csp-report-only-tightening`
- Type: security/hardening
- TDD first:
  - security header tests for report-only stricter directives
- Implementation:
  - add environment-controlled stricter CSP allowlists
  - keep report-only until browser evidence is clean
- Validation:
  - security header tests
  - browser console/network evidence for marketplace/detail

### S54 - Public quote/detail rate-limit budget
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s54-public-rate-limit-budget`
- Type: security/availability
- TDD first:
  - quote rate-limit tests
  - detail sync budget tests
- Implementation:
  - add lightweight public IP budget for quote and detail sync
  - avoid blocking normal list rendering
- Validation:
  - API tests
  - operability tests

### S55 - Detail RPC degradation instead of hard failure
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s55-detail-rpc-degradation`
- Type: security/availability
- TDD first:
  - page/server tests simulate RPC failure and assert persisted property still renders
- Implementation:
  - return stale/persisted detail with `rpc_error` banner
  - keep API response explicit without leaking internals
- Validation:
  - detail tests
  - screenshot/browser evidence

### S56 - Admin marketplace payload size schema
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s56-admin-payload-size-schema`
- Type: security/fix
- TDD first:
  - reject overlong title, description, notes, highlights, docs, IDs, and URLs
- Implementation:
  - zod or equivalent explicit schema
  - numeric upper bounds for economics and supply values
- Validation:
  - admin marketplace route tests

### S57 - Submit idempotency lock narrowing
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s57-submit-lock-narrowing`
- Type: security/availability/refactor
- TDD first:
  - preserve duplicate submit idempotency
  - preserve ownership mismatch rejection
  - preserve prepared-message mismatch rejection
- Implementation:
  - claim/transition attempt in short DB transaction
  - send Solana transaction outside long row lock
  - persist final status in second transaction
- Validation:
  - purchase service tests
  - purchase submit route tests

### S58 - Marketplace read pagination and filter caps
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s58-read-pagination-filter-caps`
- Type: security/availability
- TDD first:
  - cap search/city lengths
  - pagination contract tests
- Implementation:
  - DB-level filtering/pagination or repository query limits
  - preserve existing UI defaults
- Validation:
  - repository/selectors tests
  - marketplace page tests

### S59 - Rate-limit event retention
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s59-rate-limit-retention`
- Type: security/privacy
- TDD first:
  - repository retention tests
  - migration/check script tests if needed
- Implementation:
  - retention delete helper/job
  - documentation of retention window
- Validation:
  - DB validation when `DATABASE_URL` is available
  - repository tests

### S60 - Marketplace security verification pass
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s60-security-verification`
- Type: security/audit
- TDD/gates:
  - no runtime changes expected
- Validation:
  - `npm audit --omit=dev`
  - `npm run validate`
  - `npm run build`
  - Playwright/browser proof for marketplace and detail
  - marketplace API negative tests
  - final clean-code and security report update

## Release Recommendation
Before first security-sensitive release:
- P1-01 and P1-02 must be resolved or explicitly waived by owner.
- P2-01 through P2-08 should be resolved before broad public traffic.
- P2-09 can be scheduled before high-volume purchase rollout if current purchase volume is controlled.
- P3 items can be accepted short-term only with explicit owner and date.

## Open Decisions
- Approved domains for marketplace document URLs.
- Whether snapshot documents should become internal routes or non-clickable metadata.
- Whether Google Maps links should be rebuilt from place id only.
- CSP rollout mode and provider allowlist owners.
- Public quote/detail rate-limit thresholds.
- Rate-limit event retention window.
- Whether `xlsx` should be replaced immediately or isolated with a time-boxed waiver.

## Security Acceptance Criteria
- No high or critical production dependency audit findings remain, or each has an approved waiver.
- Public unauthenticated APIs never return unexpected internal error messages.
- Persisted public links are allowlisted by scheme and host.
- Detail page degrades on Solana RPC issues instead of breaking public property visibility.
- Quote and detail RPC sync paths have explicit public abuse budgets.
- CSP is staged toward least-privilege provider allowlists.
- Purchase replay, payer ownership, prepared message matching, compliance gating, and idempotency tests remain green.
- `npm run validate` passes after all remediation slices.
