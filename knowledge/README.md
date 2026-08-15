# Knowledge Inbox

This directory is the shared capture-and-promotion layer for reusable workflow knowledge.

Promotion ladder:
1. `knowledge/features/*.md` or RFCs capture delivery-specific evidence.
2. `knowledge/inbox/*` stores reusable observations.
3. `knowledge/proposals/*` stores promotion candidates.
4. `knowledge/guides/*` stores approved reusable guides.
5. `knowledge/governance/*` and CI/scripts store stable mandatory rules and executable enforcement.

Human checkpoints:
- Inbox items can be captured by the agent.
- Promotion to `guide`, `governance`, or `automation` requires human review.
- `AGENTS.md` is updated only after canonical docs or enforcement change.

Commands:
- `npm run knowledge:scan -- --base develop`
- `npm run knowledge:index`
- `npm run knowledge:index -- --check`
- `npm run knowledge:drift`
- `npm run validate:knowledge`

Last Generated: 2026-08-11T00:00:00.000Z

## Snapshot

| Metric | Count |
| --- | ---: |
| Observations | 11 |
| Proposals | 3 |
| Reports | 5 |
| Archived | 530 |
| Observed status | 21 |
| Triaged status | 0 |
| Promoted status | 0 |
| Archived status | 528 |

## Inbox

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| index | observed | none | [2026-05](knowledge/inbox/2026-05/index.md) | n/a |
| KNOW-2026-05-001 | observed | guide | [Governance summaries must defer to canonical policy and enforcement](knowledge/inbox/2026-05/KNOW-2026-05-001-governance-summary-defers-to-canonical-policy.md) | BRI-143 |
| index | observed | none | [2026-06](knowledge/inbox/2026-06/index.md) | n/a |
| KNOW-2026-06-001 | observed | guide | [Admin Candy Machine module worklog](knowledge/inbox/2026-06/KNOW-2026-06-001-admin-candy-machine-module-worklog.md) | n/a |
| KNOW-2026-06-002 | observed | guide | [Candy Machine deploy iteration 2026-06-07](knowledge/inbox/2026-06/KNOW-2026-06-002-candy-machine-deploy-iteration-2026-06-07.md) | n/a |
| KNOW-2026-06-003 | observed | guide | [Candy Machine deploy current system branch](knowledge/inbox/2026-06/KNOW-2026-06-003-candy-machine-deploy-iteration-current-system-branch.md) | BRI-176 |
| KNOW-2026-06-004 | observed | guide | [Stake, distribution, treasury, claim, and traceability draft](knowledge/inbox/2026-06/KNOW-2026-06-004-stake-distribution-traceability-draft.md) | BRI-5, BRI-6, BRI-7, BRI-8 |
| KNOW-2026-06-005 | observed | guide | [Candy Machine deploy iteration 2026-06-11](knowledge/inbox/2026-06/KNOW-2026-06-005-candy-machine-deploy-iteration-2026-06-11-branching-policy-preflight.md) | BRI-173 |
| KNOW-2026-06-006 | observed | guide | [Candy Machine deploy iteration 2026-06-16 (SPEC05 rebase)](knowledge/inbox/2026-06/KNOW-2026-06-006-candy-machine-deploy-iteration-scope05-rebase.md) | BRI-168 |
| KNOW-2026-07-001 | observed | guide | [Candy Machine deploy iteration 2026-07-22 BRI-182](knowledge/inbox/candy-machine-deploy-iteration-2026-07-22-bri-182.md) | BRI-182 |
| KNOW-2026-08-001 | observed | guide | [Candy Machine deploy iteration 2026-08-11 BRI-186](knowledge/inbox/candy-machine-deploy-iteration-2026-08-11-bri-186.md) | BRI-186 |

## Promotion Proposals

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| index | observed | none | [automation](knowledge/proposals/automation/index.md) | n/a |
| index | observed | none | [governance](knowledge/proposals/governance/index.md) | n/a |
| index | observed | none | [guide](knowledge/proposals/guide/index.md) | n/a |

## Reports

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| BRI-181-linear-update | observed | none | [BRI- 181 Linear Update](knowledge/reports/BRI-181-linear-update.md) | n/a |
| governance-drift-2026-05-02 | observed | none | [Governance Drift 2026 05 02](knowledge/reports/governance-drift-2026-05-02.md) | n/a |
| governance-drift-2026-06-07 | observed | none | [Governance Drift 2026 06 07](knowledge/reports/governance-drift-2026-06-07.md) | n/a |
| index | observed | none | [reports](knowledge/reports/index.md) | n/a |
| recent-changes-2026-05-02 | observed | none | [Recent Changes 2026 05 02](knowledge/reports/recent-changes-2026-05-02.md) | n/a |

## Archive

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| admin-assets | archived | none | [Admin Assets API](knowledge/api/endpoints/admin-assets.md) | n/a |
| auth | archived | none | [Auth API](knowledge/api/endpoints/auth.md) | n/a |
| collections | archived | none | [Collections API (Admin)](knowledge/api/endpoints/collections.md) | n/a |
| index | archived | none | [endpoints](knowledge/api/endpoints/index.md) | n/a |
| marketplace | archived | none | [Marketplace API](knowledge/api/endpoints/marketplace.md) | n/a |
| mint-orchestrator | archived | none | [Mint Orchestrator API](knowledge/api/endpoints/mint-orchestrator.md) | n/a |
| purchase-flow | archived | none | [Purchase Flow API](knowledge/api/endpoints/purchase-flow.md) | n/a |
| stake-distribution | archived | none | [Stake Distribution API](knowledge/api/endpoints/stake-distribution.md) | n/a |
| webhooks | archived | none | [Webhooks](knowledge/api/endpoints/webhooks.md) | n/a |
| index | archived | none | [API Reference](knowledge/api/index.md) | n/a |
| index | archived | none | [rpc](knowledge/api/rpc/index.md) | n/a |
| metaplex-core | archived | none | [Metaplex Core RPC](knowledge/api/rpc/metaplex-core.md) | n/a |
| solana-methods | archived | none | [Solana RPC Methods](knowledge/api/rpc/solana-methods.md) | n/a |
| index | archived | none | [schemas](knowledge/api/schemas/index.md) | n/a |
| marketplace-entry | archived | none | [Marketplace Entry Schema](knowledge/api/schemas/marketplace-entry.md) | n/a |
| purchase-webhook-events | archived | none | [Purchase Webhook Events](knowledge/api/schemas/purchase-webhook-events.md) | n/a |
| app-technical-roadmap-investor-brief | archived | none | [App Technical Roadmap and Investor Brief](knowledge/architecture/app-technical-roadmap-investor-brief.md) | n/a |
| architecture-overview | archived | none | [Architecture Overview](knowledge/architecture/architecture-overview.md) | n/a |
| auth-flow | archived | none | [Auth Flow — Hybrid WorkOS + SIWS](knowledge/architecture/auth-flow.md) | n/a |
| authority-model | archived | none | [Authority Model](knowledge/architecture/authority-model.md) | n/a |
| devnet-proof | archived | none | [Devnet Proof](knowledge/architecture/devnet-proof.md) | n/a |
| index | archived | none | [Index](knowledge/architecture/index.md) | n/a |
| linear-context | archived | none | [Linear Context Chat](knowledge/architecture/linear-context.md) | n/a |
| nft-spec | archived | none | [NFT Spec](knowledge/architecture/nft-spec.md) | n/a |
| purchase-tracing | archived | none | [Purchase Tracing Infrastructure](knowledge/architecture/purchase-tracing.md) | n/a |
| rbac | archived | none | [RBAC Model](knowledge/architecture/rbac.md) | n/a |
| rotation-spec | archived | none | [Rotation Spec](knowledge/architecture/rotation-spec.md) | n/a |
| session-model | archived | none | [Session Model](knowledge/architecture/session-model.md) | n/a |
| solana-stack | archived | none | [Solana Stack](knowledge/architecture/solana-stack.md) | n/a |
| stake-audit | archived | none | [Stake Audit](knowledge/architecture/stake-audit.md) | n/a |
| state-machine | archived | none | [State Machine](knowledge/architecture/state-machine.md) | n/a |
| third-party-integrations | archived | none | [Third-Party Integrations & Services Registry](knowledge/architecture/third-party-integrations.md) | n/a |
| threat-model | archived | none | [Threat Model](knowledge/architecture/threat-model.md) | n/a |
| toolchain-policy | archived | none | [Toolchain Maintenance Policy](knowledge/architecture/toolchain-policy.md) | n/a |
| index | archived | none | [archive](knowledge/archive/index.md) | n/a |
| index | archived | none | [Index](knowledge/database/index.md) | n/a |
| authority-registry | archived | none | [Authority Registry](knowledge/database/models/authority-registry.md) | n/a |
| index | archived | none | [models](knowledge/database/models/index.md) | n/a |
| marketplace-entry | archived | none | [Marketplace Entry](knowledge/database/models/marketplace-entry.md) | n/a |
| mint-job | archived | none | [Mint Job](knowledge/database/models/mint-job.md) | n/a |
| purchase-attempt | archived | none | [Purchase Attempt](knowledge/database/models/purchase-attempt.md) | n/a |
| stake-action | archived | none | [Stake Action Attempt](knowledge/database/models/stake-action.md) | n/a |
| user-profile | archived | none | [User Profile](knowledge/database/models/user-profile.md) | n/a |
| feature-contextual-hints-admin-assets-new-exclude-location-bri-10-implementation | archived | none | [Feature Contextual Hints Admin Assets New Exclude Location BRI- 10 Implementation](knowledge/features/bri-10/feature-contextual-hints-admin-assets-new-exclude-location-bri-10-implementation.md) | n/a |
| feature-contextual-hints-admin-assets-new-exclude-location-bri-10 | archived | none | [Feature Contextual Hints Admin Assets New Exclude Location BRI- 10](knowledge/features/bri-10/feature-contextual-hints-admin-assets-new-exclude-location-bri-10.md) | n/a |
| index | archived | none | [bri-10](knowledge/features/bri-10/index.md) | n/a |
| feature-app-wallet-connection-solanakit-bri-12 | archived | none | [Feature App Wallet Connection Solanakit BRI- 12](knowledge/features/bri-12/feature-app-wallet-connection-solanakit-bri-12.md) | n/a |
| index | archived | none | [bri-12](knowledge/features/bri-12/index.md) | n/a |
| feature-app-startup-splash-screen-bri-121 | archived | none | [Feature App Startup Splash Screen BRI- 121](knowledge/features/bri-121/feature-app-startup-splash-screen-bri-121.md) | n/a |
| index | archived | none | [bri-121](knowledge/features/bri-121/index.md) | n/a |
| fix-admin-shell-cleancode-bri-123 | archived | none | [Fix Admin Shell Cleancode BRI- 123](knowledge/features/bri-123/fix-admin-shell-cleancode-bri-123.md) | n/a |
| index | archived | none | [bri-123](knowledge/features/bri-123/index.md) | n/a |
| feature-shared-knowledge-promotion-system-bri-143 | archived | none | [Feature Shared Knowledge Promotion System BRI- 143](knowledge/features/bri-143/feature-shared-knowledge-promotion-system-bri-143.md) | n/a |
| index | archived | none | [bri-143](knowledge/features/bri-143/index.md) | n/a |
| fix-next-proxy-convention-bri-144 | archived | none | [Fix Next Proxy Convention BRI- 144](knowledge/features/bri-144/fix-next-proxy-convention-bri-144.md) | n/a |
| index | archived | none | [bri-144](knowledge/features/bri-144/index.md) | n/a |
| feature-shared-single-issue-slice-planning-bri-149 | archived | none | [Feature Shared Single Issue Slice Planning BRI- 149](knowledge/features/bri-149/feature-shared-single-issue-slice-planning-bri-149.md) | n/a |
| index | archived | none | [bri-149](knowledge/features/bri-149/index.md) | n/a |
| feature-app-profile-completion-reward-prompt-bri-151 | archived | none | [Feature App Profile Completion Reward Prompt BRI- 151](knowledge/features/bri-151/feature-app-profile-completion-reward-prompt-bri-151.md) | n/a |
| index | archived | none | [bri-151](knowledge/features/bri-151/index.md) | n/a |
| fix-app-hide-release-modules-bri-152 | archived | none | [Fix App Hide Release Modules BRI- 152](knowledge/features/bri-152/fix-app-hide-release-modules-bri-152.md) | n/a |
| index | archived | none | [bri-152](knowledge/features/bri-152/index.md) | n/a |
| fix-app-footer-links-bri-153 | archived | none | [Fix App Footer Links BRI- 153](knowledge/features/bri-153/fix-app-footer-links-bri-153.md) | n/a |
| fix-app-marketplace-release-placeholder-graphs-bri-153 | archived | none | [Fix App Marketplace Release Placeholder Graphs BRI- 153](knowledge/features/bri-153/fix-app-marketplace-release-placeholder-graphs-bri-153.md) | n/a |
| fix-app-profile-tour-emphasis-bri-153 | archived | none | [Fix App Profile Tour Emphasis BRI- 153](knowledge/features/bri-153/fix-app-profile-tour-emphasis-bri-153.md) | n/a |
| fix-app-wallet-ingresar-cta-bri-153 | archived | none | [Fix App Wallet Ingresar Cta BRI- 153](knowledge/features/bri-153/fix-app-wallet-ingresar-cta-bri-153.md) | n/a |
| index | archived | none | [bri-153](knowledge/features/bri-153/index.md) | n/a |
| feature-shared-hybrid-auth-workos-wallet-bri-154 | archived | none | [Feature Shared HyBRI-d Auth Workos Wallet BRI- 154](knowledge/features/bri-154/feature-shared-hybrid-auth-workos-wallet-bri-154.md) | n/a |
| index | archived | none | [bri-154](knowledge/features/bri-154/index.md) | n/a |
| fix-shared-db-migration-enforcement-bri-156 | archived | none | [Fix Shared Db Migration Enforcement BRI- 156](knowledge/features/bri-156/fix-shared-db-migration-enforcement-bri-156.md) | n/a |
| index | archived | none | [bri-156](knowledge/features/bri-156/index.md) | n/a |
| feature-shared-agents-orchestration-enforcement-bri-157 | archived | none | [Feature Shared Agents Orchestration Enforcement BRI- 157](knowledge/features/bri-157/feature-shared-agents-orchestration-enforcement-bri-157.md) | n/a |
| feature-shared-pwa-web-push-bri-157 | archived | none | [Feature Shared Pwa Web Push BRI- 157](knowledge/features/bri-157/feature-shared-pwa-web-push-bri-157.md) | n/a |
| index | archived | none | [bri-157](knowledge/features/bri-157/index.md) | n/a |
| feature-shared-human-acceptance-gated-merge-implementation | archived | none | [Feature Shared Human Acceptance Gated Merge Implementation](knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/feature-shared-human-acceptance-gated-merge-implementation.md) | n/a |
| feature-shared-human-acceptance-gated-merge | archived | none | [Feature Shared Human Acceptance Gated Merge](knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/feature-shared-human-acceptance-gated-merge.md) | n/a |
| feature-shared-hybrid-auth-clean-code-bri-159-implementation | archived | none | [Feature Shared HyBRI-d Auth Clean Code BRI- 159 Implementation](knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/feature-shared-hybrid-auth-clean-code-bri-159-implementation.md) | n/a |
| feature-shared-hybrid-auth-clean-code-bri-159 | archived | none | [Feature Shared HyBRI-d Auth Clean Code BRI- 159](knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/feature-shared-hybrid-auth-clean-code-bri-159.md) | n/a |
| index | archived | none | [bri-159-feature-shared-hybrid-auth-clean-code](knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/index.md) | n/a |
| feature-shared-referral-marketing-system-bri-16 | archived | none | [Feature Shared Referral Marketing System BRI- 16](knowledge/features/bri-16/feature-shared-referral-marketing-system-bri-16.md) | n/a |
| index | archived | none | [bri-16](knowledge/features/bri-16/index.md) | n/a |
| feature-shared-wallet-modal-clean-code-bri-160-implementation | archived | none | [Feature Shared Wallet Modal Clean Code BRI- 160 Implementation](knowledge/features/bri-160/feature-shared-wallet-modal-clean-code-bri-160-implementation.md) | n/a |
| feature-shared-wallet-modal-clean-code-bri-160 | archived | none | [Feature Shared Wallet Modal Clean Code BRI- 160](knowledge/features/bri-160/feature-shared-wallet-modal-clean-code-bri-160.md) | n/a |
| index | archived | none | [bri-160](knowledge/features/bri-160/index.md) | n/a |
| feature-app-wide-motion-12-ux-polish-bri-163-implementation | archived | none | [Feature App Wide Motion 12 Ux Polish BRI- 163 Implementation](knowledge/features/bri-163/feature-app-wide-motion-12-ux-polish-bri-163-implementation.md) | n/a |
| feature-app-wide-motion-12-ux-polish-bri-163 | archived | none | [Feature App Wide Motion 12 Ux Polish BRI- 163](knowledge/features/bri-163/feature-app-wide-motion-12-ux-polish-bri-163.md) | n/a |
| index | archived | none | [bri-163](knowledge/features/bri-163/index.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-implementation | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 Implementation](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-implementation.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s15-web-vitals-seo-audit | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S15 Web Vitals Seo Audit](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s15-web-vitals-seo-audit.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s16-clean-code-refactor-audit | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S16 Clean Code Refactor Audit](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s16-clean-code-refactor-audit.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-inventory | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S21 P2 Debt Inventory](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s21-p2-debt-inventory.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s22-admin-safe-create-errors | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S22 Admin Safe Create Errors](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s22-admin-safe-create-errors.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S23 Read Result Contract](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s24-page-degraded-state | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S24 Page Degraded State](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s24-page-degraded-state.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s25-read-failure-logging | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S25 Read Failure Logging](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s25-read-failure-logging.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s26-row-mapper-extraction | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S26 Row Mapper Extraction](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s26-row-mapper-extraction.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s27-read-repository-extraction | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S27 Read Repository Extraction](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s27-read-repository-extraction.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s28-write-repository-extraction | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S28 Write Repository Extraction](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s28-write-repository-extraction.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s29-selector-extraction | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S29 Selector Extraction](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s29-selector-extraction.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s30-sync-status-extraction | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S30 Sync Status Extraction](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s30-sync-status-extraction.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s31-server-facade-cleanup | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S31 Server Facade Cleanup](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s31-server-facade-cleanup.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s32-detail-formatters-extraction | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S32 Detail Formatters Extraction](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s32-detail-formatters-extraction.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s33-detail-google-maps-card | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S33 Detail Google Maps Card](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s33-detail-google-maps-card.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s34-detail-hero-section | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S34 Detail Hero Section](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s34-detail-hero-section.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s35-detail-investment-summary | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S35 Detail Investment Summary](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s35-detail-investment-summary.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s36-detail-property-info | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S36 Detail Property Info](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s36-detail-property-info.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s37-detail-deal-economics | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S37 Detail Deal Economics](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s37-detail-deal-economics.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s38-detail-fees-return | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S38 Detail Fees Return](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s38-detail-fees-return.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s39-detail-execution-governance | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S39 Detail Execution Governance](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s39-detail-execution-governance.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s40-detail-documents-blockchain | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S40 Detail Documents Blockchain](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s40-detail-documents-blockchain.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s41-coordinate-range-validation | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S41 Coordinate Range Validation](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s41-coordinate-range-validation.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s42-mapbox-lazy-boundary | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S42 Mapbox Lazy Boundary](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s42-mapbox-lazy-boundary.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S43 Web Vitals Recheck](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164 S44 Security Audit Plan](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164-s44-security-audit-plan.md) | n/a |
| feature-app-create-a-marketplace-3d-visual-bri-164 | archived | none | [Feature App Create A Marketplace 3d Visual BRI- 164](knowledge/features/bri-164-marketplace-3d-visual/feature-app-create-a-marketplace-3d-visual-bri-164.md) | n/a |
| index | archived | none | [bri-164-marketplace-3d-visual](knowledge/features/bri-164-marketplace-3d-visual/index.md) | n/a |
| feature-app-marketplace-detail-media-carousel-bri-164-implementation | archived | none | [Feature App Marketplace Detail Media Carousel BRI- 164 Implementation](knowledge/features/bri-164-media-carousel/feature-app-marketplace-detail-media-carousel-bri-164-implementation.md) | n/a |
| feature-app-marketplace-detail-media-carousel-bri-164 | archived | none | [Feature App Marketplace Detail Media Carousel BRI- 164](knowledge/features/bri-164-media-carousel/feature-app-marketplace-detail-media-carousel-bri-164.md) | n/a |
| index | archived | none | [bri-164-media-carousel](knowledge/features/bri-164-media-carousel/index.md) | n/a |
| feature-czambrano-bri-168-ui-ux-fixes-and-improvements-implementation | archived | none | [Feature Czambrano BRI- 168 Ui Ux Fixes And Improvements Implementation](knowledge/features/bri-168/feature-czambrano-bri-168-ui-ux-fixes-and-improvements-implementation.md) | n/a |
| feature-czambrano-bri-168-ui-ux-fixes-and-improvements | archived | none | [Feature Czambrano BRI- 168 Ui Ux Fixes And Improvements](knowledge/features/bri-168/feature-czambrano-bri-168-ui-ux-fixes-and-improvements.md) | n/a |
| feature-landing-dark-hero-look-and-feel-implementation | archived | none | [Feature Landing Dark Hero Look And Feel Implementation](knowledge/features/bri-168/feature-landing-dark-hero-look-and-feel-implementation.md) | n/a |
| feature-landing-dark-hero-look-and-feel | archived | none | [Feature Landing Dark Hero Look And Feel](knowledge/features/bri-168/feature-landing-dark-hero-look-and-feel.md) | n/a |
| index | archived | none | [bri-168](knowledge/features/bri-168/index.md) | n/a |
| feature-app-investor-dashboard-overview-real-data-bri-171-implementation | archived | none | [Feature App Investor Dashboard Overview Real Data BRI- 171 Implementation](knowledge/features/bri-171/feature-app-investor-dashboard-overview-real-data-bri-171-implementation.md) | n/a |
| feature-app-investor-dashboard-overview-real-data-bri-171 | archived | none | [Feature App Investor Dashboard Overview Real Data BRI- 171](knowledge/features/bri-171/feature-app-investor-dashboard-overview-real-data-bri-171.md) | n/a |
| index | archived | none | [bri-171](knowledge/features/bri-171/index.md) | n/a |
| feature-czambrano-BRI-173-branching-policy-preflight-implementation | archived | none | [Feature Czambrano BRI- 173 Branching Policy Preflight Implementation](knowledge/features/bri-173/feature-czambrano-BRI-173-branching-policy-preflight-implementation.md) | n/a |
| feature-czambrano-BRI-173-branching-policy-preflight | archived | none | [Feature Czambrano BRI- 173 Branching Policy Preflight](knowledge/features/bri-173/feature-czambrano-BRI-173-branching-policy-preflight.md) | n/a |
| index | archived | none | [bri-173](knowledge/features/bri-173/index.md) | n/a |
| feature-app-investor-portfolio-real-holdings-bri-174-implementation | archived | none | [Feature App Investor Portfolio Real Holdings BRI- 174 Implementation](knowledge/features/bri-174/feature-app-investor-portfolio-real-holdings-bri-174-implementation.md) | n/a |
| feature-app-investor-portfolio-real-holdings-bri-174 | archived | none | [Feature App Investor Portfolio Real Holdings BRI- 174](knowledge/features/bri-174/feature-app-investor-portfolio-real-holdings-bri-174.md) | n/a |
| index | archived | none | [bri-174](knowledge/features/bri-174/index.md) | n/a |
| feature-business-logic-reasoner-bri-177-implementation | observed | guide | [Business Logic Reasoner - Implementation Plan](knowledge/features/bri-177/feature-business-logic-reasoner-bri-177-implementation.md) | BRI-177 |
| feature-business-logic-reasoner-bri-177 | observed | guide | [Business Logic Reasoner - Self-Discover Agent](knowledge/features/bri-177/feature-business-logic-reasoner-bri-177.md) | BRI-177 |
| index | archived | none | [bri-177](knowledge/features/bri-177/index.md) | n/a |
| feature-jaysosa-BRI-178-initial-loading-design-implementation | archived | none | [Feature Jaysosa BRI- 178 Initial Loading Design Implementation](knowledge/features/bri-178/feature-jaysosa-BRI-178-initial-loading-design-implementation.md) | n/a |
| feature-jaysosa-BRI-178-initial-loading-design | archived | none | [Feature Jaysosa BRI- 178 Initial Loading Design](knowledge/features/bri-178/feature-jaysosa-BRI-178-initial-loading-design.md) | n/a |
| index | archived | none | [bri-178](knowledge/features/bri-178/index.md) | n/a |
| feature-shared-spec-and-branching-governance-implementation | archived | none | [Feature Shared Spec And Branching Governance Implementation](knowledge/features/bri-179/feature-shared-spec-and-branching-governance-implementation.md) | n/a |
| feature-shared-spec-and-branching-governance | archived | none | [Feature Shared Spec And Branching Governance](knowledge/features/bri-179/feature-shared-spec-and-branching-governance.md) | n/a |
| index | archived | none | [bri-179](knowledge/features/bri-179/index.md) | n/a |
| feature-czambrano-bri-180-app-ui-improvements-implementation | archived | none | [Feature Czambrano BRI- 180 App Ui Improvements Implementation](knowledge/features/bri-180/feature-czambrano-bri-180-app-ui-improvements-implementation.md) | n/a |
| feature-czambrano-bri-180-app-ui-improvements | archived | none | [Feature Czambrano BRI- 180 App Ui Improvements](knowledge/features/bri-180/feature-czambrano-bri-180-app-ui-improvements.md) | n/a |
| index | archived | none | [bri-180](knowledge/features/bri-180/index.md) | n/a |
| feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks-implementation | archived | none | [Harness System Enhancement & 4-Layer Architecture Implementation (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks-implementation.md) | n/a |
| feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks | archived | none | [Harness System Enhancement, 4-Layer Architecture, Idempotent Lifecycle & Single-Trigger PR Guard (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md) | n/a |
| feature-jeisonsosa-BRI-181-canonical-templates-implementation | archived | none | [Plantillas Canónicas para OKF y Linear Implementation (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-canonical-templates-implementation.md) | n/a |
| feature-jeisonsosa-BRI-181-canonical-templates | archived | none | [Plantillas Canónicas para OKF y Linear (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-canonical-templates.md) | n/a |
| feature-jeisonsosa-BRI-181-graphify-agent-enforcement-implementation | archived | none | [Graphify Agent Enforcement & Task-Init Auto-Sync Implementation (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-graphify-agent-enforcement-implementation.md) | n/a |
| feature-jeisonsosa-BRI-181-graphify-agent-enforcement | archived | none | [Graphify Agent Enforcement & Task-Init Auto-Sync (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-graphify-agent-enforcement.md) | n/a |
| feature-jeisonsosa-BRI-181-solution-template-redesign-implementation | archived | none | [Rediseño del Solution Spec Template Implementation (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-solution-template-redesign-implementation.md) | n/a |
| feature-jeisonsosa-BRI-181-solution-template-redesign | archived | none | [Rediseño del Solution Spec Template (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-solution-template-redesign.md) | n/a |
| feature-jeisonsosa-BRI-181-task-init-reinforcement-implementation | archived | none | [task-init.sh reinforcement workflow Implementation (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-task-init-reinforcement-implementation.md) | n/a |
| feature-jeisonsosa-BRI-181-task-init-reinforcement | archived | none | [task-init.sh reinforcement workflow (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-task-init-reinforcement.md) | n/a |
| feature-jeisonsosa-BRI-181-tdd-and-clean-specs-rule-implementation | archived | none | [Regla Obligatoria de Slices: TDD Primero y Refactor Clean Último Implementation (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-tdd-and-clean-specs-rule-implementation.md) | n/a |
| feature-jeisonsosa-BRI-181-tdd-and-clean-specs-rule | archived | none | [Regla Obligatoria de Slices: TDD Primero y Refactor Clean Último (BRI-181)](knowledge/features/bri-181/feature-jeisonsosa-BRI-181-tdd-and-clean-specs-rule.md) | n/a |
| feature-shared-agents-drifting-bri-181-implementation | archived | none | [Feature Shared Agents Drifting BRI- 181 Implementation](knowledge/features/bri-181/feature-shared-agents-drifting-bri-181-implementation.md) | n/a |
| feature-shared-agents-drifting-bri-181 | archived | none | [Feature Shared Agents Drifting BRI- 181](knowledge/features/bri-181/feature-shared-agents-drifting-bri-181.md) | n/a |
| index | archived | none | [bri-181](knowledge/features/bri-181/index.md) | n/a |
| feature-jeisonsosa-BRI-182-alineacion-politicas-architect-implementation | archived | none | [feature-jeisonsosa-BRI-182-alineacion-politicas-architect-implementation](knowledge/features/bri-182/feature-jeisonsosa-BRI-182-alineacion-politicas-architect-implementation.md) | n/a |
| feature-jeisonsosa-BRI-182-alineacion-politicas-architect | archived | none | [feature-jeisonsosa-BRI-182-alineacion-politicas-architect](knowledge/features/bri-182/feature-jeisonsosa-BRI-182-alineacion-politicas-architect.md) | n/a |
| feature-jeisonsosa-BRI-182-spec01-tdd-baseline-implementation | archived | none | [feature-jeisonsosa-BRI-182-spec01-tdd-baseline-implementation](knowledge/features/bri-182/feature-jeisonsosa-BRI-182-spec01-tdd-baseline-implementation.md) | n/a |
| feature-jeisonsosa-BRI-182-spec02-root-hygiene-implementation | archived | none | [feature-jeisonsosa-BRI-182-spec02-root-hygiene-implementation](knowledge/features/bri-182/feature-jeisonsosa-BRI-182-spec02-root-hygiene-implementation.md) | n/a |
| feature-jeisonsosa-BRI-182-spec03-lib-4layer-restructure-implementation | archived | none | [feature-jeisonsosa-BRI-182-spec03-lib-4layer-restructure-implementation](knowledge/features/bri-182/feature-jeisonsosa-BRI-182-spec03-lib-4layer-restructure-implementation.md) | n/a |
| feature-jeisonsosa-BRI-182-spec04-clean-code-audit-implementation | archived | none | [feature-jeisonsosa-BRI-182-spec04-clean-code-audit-implementation](knowledge/features/bri-182/feature-jeisonsosa-BRI-182-spec04-clean-code-audit-implementation.md) | n/a |
| feature-jeisonsosa-BRI-182-spec05-architecture-ci-governance-implementation | archived | none | [feature-jeisonsosa-BRI-182-spec05-architecture-ci-governance-implementation](knowledge/features/bri-182/feature-jeisonsosa-BRI-182-spec05-architecture-ci-governance-implementation.md) | n/a |
| index | archived | none | [bri-182](knowledge/features/bri-182/index.md) | n/a |
| feature-jaymusicmachine-BRI-183-license-compliance-implementation | archived | none | [feature-jaymusicmachine-BRI-183-license-compliance-implementation](knowledge/features/bri-183/feature-jaymusicmachine-BRI-183-license-compliance-implementation.md) | n/a |
| feature-jaymusicmachine-BRI-183-license-compliance | archived | none | [feature-jaymusicmachine-BRI-183-license-compliance](knowledge/features/bri-183/feature-jaymusicmachine-BRI-183-license-compliance.md) | n/a |
| index | archived | none | [bri-183](knowledge/features/bri-183/index.md) | n/a |
| feature-app-home-copy-bri-39 | archived | none | [Feature App Home Copy BRI- 39](knowledge/features/bri-39/feature-app-home-copy-bri-39.md) | n/a |
| index | archived | none | [bri-39](knowledge/features/bri-39/index.md) | n/a |
| feature-discovery-brief-anchor-notary-and-freeze-control-bri-5-implementation | archived | none | [Feature Discovery BRI-ef Anchor Notary And Freeze Control BRI- 5 Implementation](knowledge/features/bri-5/feature-discovery-brief-anchor-notary-and-freeze-control-bri-5-implementation.md) | n/a |
| feature-discovery-brief-anchor-notary-and-freeze-control-bri-5 | archived | none | [Feature Discovery BRI-ef Anchor Notary And Freeze Control BRI- 5](knowledge/features/bri-5/feature-discovery-brief-anchor-notary-and-freeze-control-bri-5.md) | n/a |
| index | archived | none | [bri-5](knowledge/features/bri-5/index.md) | n/a |
| feature-stake-event-reconciliation-distribution-preparation-bri-6-implementation | archived | none | [Feature Stake Event Reconciliation Distribution Preparation BRI- 6 Implementation](knowledge/features/bri-6-stake-reconciliation/feature-stake-event-reconciliation-distribution-preparation-bri-6-implementation.md) | n/a |
| feature-stake-event-reconciliation-distribution-preparation-bri-6 | archived | none | [Feature Stake Event Reconciliation Distribution Preparation BRI- 6](knowledge/features/bri-6-stake-reconciliation/feature-stake-event-reconciliation-distribution-preparation-bri-6.md) | n/a |
| index | archived | none | [bri-6-stake-reconciliation](knowledge/features/bri-6-stake-reconciliation/index.md) | n/a |
| feature-flujo-gitflow-pr-structure-bri-61 | archived | none | [Feature Flujo Gitflow Pr Structure BRI- 61](knowledge/features/bri-61/feature-flujo-gitflow-pr-structure-bri-61.md) | n/a |
| index | archived | none | [bri-61](knowledge/features/bri-61/index.md) | n/a |
| feature-flujo-gitflow-pr-structure-improvement-01-bri-62 | archived | none | [Feature Flujo Gitflow Pr Structure Improvement 01 BRI- 62](knowledge/features/bri-62/feature-flujo-gitflow-pr-structure-improvement-01-bri-62.md) | n/a |
| index | archived | none | [bri-62](knowledge/features/bri-62/index.md) | n/a |
| fix-app-favicon-bri-67 | archived | none | [Fix App Favicon BRI- 67](knowledge/features/bri-63/fix-app-favicon-bri-67.md) | n/a |
| fix-app-home-title-bri-68 | archived | none | [Fix App Home Title BRI- 68](knowledge/features/bri-63/fix-app-home-title-bri-68.md) | n/a |
| fix-app-remove-ui-states-bri-63 | archived | none | [Fix App Remove Ui States BRI- 63](knowledge/features/bri-63/fix-app-remove-ui-states-bri-63.md) | n/a |
| fix-landing-featured-properties-db-source-bri-65 | archived | none | [Fix Landing Featured Properties Db Source BRI- 65](knowledge/features/bri-63/fix-landing-featured-properties-db-source-bri-65.md) | n/a |
| fix-landing-featured-properties-source-bri-65 | archived | none | [Fix Landing Featured Properties Source BRI- 65](knowledge/features/bri-63/fix-landing-featured-properties-source-bri-65.md) | n/a |
| fix-marketplace-remove-hardcoded-fallback-bri-64 | archived | none | [Fix Marketplace Remove Hardcoded Fallback BRI- 64](knowledge/features/bri-63/fix-marketplace-remove-hardcoded-fallback-bri-64.md) | n/a |
| fix-siws-session-nonce-stateless-bri-66 | archived | none | [Fix Siws Session Nonce Stateless BRI- 66](knowledge/features/bri-63/fix-siws-session-nonce-stateless-bri-66.md) | n/a |
| index | archived | none | [bri-63](knowledge/features/bri-63/index.md) | n/a |
| feature-stake-distribution-traceability-epic-014-implementation | archived | none | [Feature Stake Distribution Traceability EPIC- 014 Implementation](knowledge/features/bri-7/feature-stake-distribution-traceability-epic-014-implementation.md) | n/a |
| feature-stake-distribution-traceability-epic-014 | archived | none | [Feature Stake Distribution Traceability EPIC- 014](knowledge/features/bri-7/feature-stake-distribution-traceability-epic-014.md) | n/a |
| index | archived | none | [bri-7](knowledge/features/bri-7/index.md) | n/a |
| rfc-epic-014 | archived | none | [Rfc EPIC- 014](knowledge/features/bri-7/rfc-epic-014.md) | n/a |
| index | archived | none | [Epic 003 - NFT Store Purchase Flow](knowledge/features/epic-003/index.md) | n/a |
| feature-epic-010-story-01-foundation-layered-architecture | archived | none | [Feature EPIC- 010 STORY- 01 Foundation Layered Architecture](knowledge/features/epic-010/feature-epic-010-story-01-foundation-layered-architecture.md) | n/a |
| feature-epic-010-story-02-content-as-code-editorial-contracts | archived | none | [Feature EPIC- 010 STORY- 02 Content As Code Editorial Contracts](knowledge/features/epic-010/feature-epic-010-story-02-content-as-code-editorial-contracts.md) | n/a |
| feature-epic-010-story-03-route-architecture-templates | archived | none | [Feature EPIC- 010 STORY- 03 Route Architecture Templates](knowledge/features/epic-010/feature-epic-010-story-03-route-architecture-templates.md) | n/a |
| feature-epic-010-story-04-technical-seo-infrastructure | archived | none | [Feature EPIC- 010 STORY- 04 Technical Seo Infrastructure](knowledge/features/epic-010/feature-epic-010-story-04-technical-seo-infrastructure.md) | n/a |
| feature-epic-010-story-05-structured-data-json-ld-layer | archived | none | [Feature EPIC- 010 STORY- 05 Structured Data Json Ld Layer](knowledge/features/epic-010/feature-epic-010-story-05-structured-data-json-ld-layer.md) | n/a |
| feature-epic-010-story-06-ai-readable-machine-endpoints | archived | none | [Feature EPIC- 010 STORY- 06 Ai Readable Machine Endpoints](knowledge/features/epic-010/feature-epic-010-story-06-ai-readable-machine-endpoints.md) | n/a |
| feature-epic-010-story-07-content-pipeline-serialization | archived | none | [Feature EPIC- 010 STORY- 07 Content Pipeline Serialization](knowledge/features/epic-010/feature-epic-010-story-07-content-pipeline-serialization.md) | n/a |
| feature-epic-010-story-08-semantic-layer-for-entities-and-relations | archived | none | [Feature EPIC- 010 STORY- 08 Semantic Layer For Entities And Relations](knowledge/features/epic-010/feature-epic-010-story-08-semantic-layer-for-entities-and-relations.md) | n/a |
| feature-epic-010-story-09-feeds-exports-internal-search-readiness | archived | none | [Feature EPIC- 010 STORY- 09 Feeds Exports Internal Search Readiness](knowledge/features/epic-010/feature-epic-010-story-09-feeds-exports-internal-search-readiness.md) | n/a |
| feature-epic-010-story-10-observability-security-performance-deploy-docs | archived | none | [Feature EPIC- 010 STORY- 10 Observability Security Performance Deploy Docs](knowledge/features/epic-010/feature-epic-010-story-10-observability-security-performance-deploy-docs.md) | n/a |
| index | archived | none | [epic-010](knowledge/features/epic-010/index.md) | n/a |
| feature-epic-011-story-02-admin-collections-read-model | archived | none | [Feature EPIC- 011 STORY- 02 Admin Collections Read Model](knowledge/features/epic-011/feature-epic-011-story-02-admin-collections-read-model.md) | n/a |
| feature-epic-011-story-03-collection-content-persistence | archived | none | [Feature EPIC- 011 STORY- 03 Collection Content Persistence](knowledge/features/epic-011/feature-epic-011-story-03-collection-content-persistence.md) | n/a |
| feature-epic-011-story-04-collections-api-ownership | archived | none | [Feature EPIC- 011 STORY- 04 Collections Api Ownership](knowledge/features/epic-011/feature-epic-011-story-04-collections-api-ownership.md) | n/a |
| feature-epic-011-story-05-collection-cards-ui-bri-93 | archived | none | [Feature EPIC- 011 STORY- 05 Collection Cards Ui BRI- 93](knowledge/features/epic-011/feature-epic-011-story-05-collection-cards-ui-bri-93.md) | n/a |
| feature-epic-011-story-05-empty-loading-error-states-bri-92 | archived | none | [Feature EPIC- 011 STORY- 05 Empty Loading Error States BRI- 92](knowledge/features/epic-011/feature-epic-011-story-05-empty-loading-error-states-bri-92.md) | n/a |
| feature-epic-011-story-05-navigation-to-detail-view-bri-94 | archived | none | [Feature EPIC- 011 STORY- 05 Navigation To Detail View BRI- 94](knowledge/features/epic-011/feature-epic-011-story-05-navigation-to-detail-view-bri-94.md) | n/a |
| feature-epic-011-story-06-read-only-detail-shell-bri-95 | archived | none | [Feature EPIC- 011 STORY- 06 Read Only Detail Shell BRI- 95](knowledge/features/epic-011/feature-epic-011-story-06-read-only-detail-shell-bri-95.md) | n/a |
| index | archived | none | [epic-011](knowledge/features/epic-011/index.md) | n/a |
| story-011-06-documents-editor-bri-99 | archived | none | [STORY- 011 06 Documents Editor BRI- 99](knowledge/features/epic-011/story-011-06-documents-editor-bri-99.md) | n/a |
| story-011-06-gallery-tabs-shell-bri-98 | archived | none | [STORY- 011 06 Gallery Tabs Shell BRI- 98](knowledge/features/epic-011/story-011-06-gallery-tabs-shell-bri-98.md) | n/a |
| story-011-06-property-information-editor-bri-97 | archived | none | [STORY- 011 06 Property Information Editor BRI- 97](knowledge/features/epic-011/story-011-06-property-information-editor-bri-97.md) | n/a |
| story-011-06-summary-editor-bri-96 | archived | none | [STORY- 011 06 Summary Editor BRI- 96](knowledge/features/epic-011/story-011-06-summary-editor-bri-96.md) | n/a |
| story-011-07-api-integration-regression-bri-100 | archived | none | [STORY- 011 07 Api Integration Regression BRI- 100](knowledge/features/epic-011/story-011-07-api-integration-regression-bri-100.md) | n/a |
| story-011-07-docs-sync-and-rfc-traceability-bri-102 | archived | none | [STORY- 011 07 Docs Sync And Rfc Traceability BRI- 102](knowledge/features/epic-011/story-011-07-docs-sync-and-rfc-traceability-bri-102.md) | n/a |
| story-011-07-playwright-admin-collections-flow-bri-101 | archived | none | [STORY- 011 07 Playwright Admin Collections Flow BRI- 101](knowledge/features/epic-011/story-011-07-playwright-admin-collections-flow-bri-101.md) | n/a |
| story-011-07-responsive-qa-evidence-pack-bri-103 | archived | none | [STORY- 011 07 Responsive Qa Evidence Pack BRI- 103](knowledge/features/epic-011/story-011-07-responsive-qa-evidence-pack-bri-103.md) | n/a |
| story-011-08-appdata-plugin-fields-aggregation-bri-107 | archived | none | [STORY- 011 08 Appdata Plugin Fields Aggregation BRI- 107](knowledge/features/epic-011/story-011-08-appdata-plugin-fields-aggregation-bri-107.md) | n/a |
| story-011-08-authorities-aggregation-bri-105 | archived | none | [STORY- 011 08 Authorities Aggregation BRI- 105](knowledge/features/epic-011/story-011-08-authorities-aggregation-bri-105.md) | n/a |
| story-011-08-base-blockchain-addresses-aggregation-bri-104 | archived | none | [STORY- 011 08 Base Blockchain Addresses Aggregation BRI- 104](knowledge/features/epic-011/story-011-08-base-blockchain-addresses-aggregation-bri-104.md) | n/a |
| story-011-08-copy-link-interactions-and-tests-bri-109 | archived | none | [STORY- 011 08 Copy Link Interactions And Tests BRI- 109](knowledge/features/epic-011/story-011-08-copy-link-interactions-and-tests-bri-109.md) | n/a |
| story-011-08-guard-fields-aggregation-bri-106 | archived | none | [STORY- 011 08 Guard Fields Aggregation BRI- 106](knowledge/features/epic-011/story-011-08-guard-fields-aggregation-bri-106.md) | n/a |
| story-011-08-read-only-blockchain-panel-ui-bri-108 | archived | none | [STORY- 011 08 Read Only Blockchain Panel Ui BRI- 108](knowledge/features/epic-011/story-011-08-read-only-blockchain-panel-ui-bri-108.md) | n/a |
| story-011-09-address-autocomplete-bri-112 | archived | none | [STORY- 011 09 Address Autocomplete BRI- 112](knowledge/features/epic-011/story-011-09-address-autocomplete-bri-112.md) | n/a |
| story-011-09-backend-location-maps-contract-bri-111 | archived | none | [STORY- 011 09 Backend Location Maps Contract BRI- 111](knowledge/features/epic-011/story-011-09-backend-location-maps-contract-bri-111.md) | n/a |
| story-011-09-current-address-and-outbound-maps-cta-bri-110 | archived | none | [STORY- 011 09 Current Address And Outbound Maps Cta BRI- 110](knowledge/features/epic-011/story-011-09-current-address-and-outbound-maps-cta-bri-110.md) | n/a |
| story-011-09-manual-save-cancel-integration-and-qa-bri-114 | archived | none | [STORY- 011 09 Manual Save Cancel Integration And Qa BRI- 114](knowledge/features/epic-011/story-011-09-manual-save-cancel-integration-and-qa-bri-114.md) | n/a |
| story-011-09-persist-google-maps-place-json-bri-113 | archived | none | [STORY- 011 09 Persist Google Maps Place Json BRI- 113](knowledge/features/epic-011/story-011-09-persist-google-maps-place-json-bri-113.md) | n/a |
| story-011-10-collections-health-and-manual-review-queue-bri-79 | archived | none | [STORY- 011 10 Collections Health And Manual Review Queue BRI- 79](knowledge/features/epic-011/story-011-10-collections-health-and-manual-review-queue-bri-79.md) | n/a |
| story-011-11-location-form-contract-and-persistence-parity-bri-124 | archived | none | [STORY- 011 11 Location Form Contract And Persistence Parity BRI- 124](knowledge/features/epic-011/story-011-11-location-form-contract-and-persistence-parity-bri-124.md) | n/a |
| feature-jaymusicmachine-BRI-184-test-suite-for-harnessing-implementation | archived | none | [feature-jaymusicmachine-BRI-184-test-suite-for-harnessing-implementation](knowledge/features/feature-jaymusicmachine-BRI-184-test-suite-for-harnessing-implementation.md) | n/a |
| feature-jaymusicmachine-BRI-184-test-suite-for-harnessing | archived | none | [feature-jaymusicmachine-BRI-184-test-suite-for-harnessing](knowledge/features/feature-jaymusicmachine-BRI-184-test-suite-for-harnessing.md) | n/a |
| feature-jaymusicmachine-BRI-185-lightpanda-integration-implementation | archived | none | [feature-jaymusicmachine-BRI-185-lightpanda-integration-implementation](knowledge/features/feature-jaymusicmachine-BRI-185-lightpanda-integration-implementation.md) | n/a |
| feature-jaymusicmachine-BRI-185-lightpanda-integration | archived | none | [feature-jaymusicmachine-BRI-185-lightpanda-integration](knowledge/features/feature-jaymusicmachine-BRI-185-lightpanda-integration.md) | n/a |
| feature-jeisonsosa-BRI-12-solanakit-wallet-connection-implementation | archived | none | [feature-jeisonsosa-BRI-12-solanakit-wallet-connection-implementation](knowledge/features/feature-jeisonsosa-BRI-12-solanakit-wallet-connection-implementation.md) | n/a |
| feature-jeisonsosa-BRI-12-solanakit-wallet-connection | archived | none | [feature-jeisonsosa-BRI-12-solanakit-wallet-connection](knowledge/features/feature-jeisonsosa-BRI-12-solanakit-wallet-connection.md) | n/a |
| feature-jeisonsosa-BRI-186-monorepo-fdd-architecture-implementation | archived | none | [feature-jeisonsosa-BRI-186-monorepo-fdd-architecture-implementation](knowledge/features/feature-jeisonsosa-BRI-186-monorepo-fdd-architecture-implementation.md) | n/a |
| feature-jeisonsosa-BRI-186-monorepo-fdd-architecture | archived | none | [feature-jeisonsosa-BRI-186-monorepo-fdd-architecture](knowledge/features/feature-jeisonsosa-BRI-186-monorepo-fdd-architecture.md) | n/a |
| feature-admin-collection-documents-ui-remake-implementation | archived | none | [Feature Admin Collection Documents Ui Remake Implementation](knowledge/features/other/feature-admin-collection-documents-ui-remake-implementation.md) | n/a |
| feature-admin-collection-documents-ui-remake | archived | none | [Feature Admin Collection Documents Ui Remake](knowledge/features/other/feature-admin-collection-documents-ui-remake.md) | n/a |
| feature-app-checkout-dual-crypto-airwallex | archived | none | [Feature App Checkout Dual Crypto Airwallex](knowledge/features/other/feature-app-checkout-dual-crypto-airwallex.md) | n/a |
| feature-app-image-storage-blob-pinata | archived | none | [Feature App Image Storage Blob Pinata](knowledge/features/other/feature-app-image-storage-blob-pinata.md) | n/a |
| feature-app-mobile-pill-phantom | archived | none | [Feature App Mobile Pill Phantom](knowledge/features/other/feature-app-mobile-pill-phantom.md) | n/a |
| feature-app-quick-tour | archived | none | [Feature App Quick Tour](knowledge/features/other/feature-app-quick-tour.md) | n/a |
| feature-app-transparency | archived | none | [Feature App Transparency](knowledge/features/other/feature-app-transparency.md) | n/a |
| feature-gemini-antigravity-workflows-implementation | archived | none | [Feature Gemini Antigravity Workflows Implementation](knowledge/features/other/feature-gemini-antigravity-workflows-implementation.md) | n/a |
| feature-gemini-antigravity-workflows | archived | none | [Feature Gemini Antigravity Workflows](knowledge/features/other/feature-gemini-antigravity-workflows.md) | n/a |
| feature-nft-authority-lifecycle-rotation-revocation | archived | none | [Feature Nft Authority Lifecycle Rotation Revocation](knowledge/features/other/feature-nft-authority-lifecycle-rotation-revocation.md) | n/a |
| feature-nft-economic-appdata-plugin | archived | none | [Feature Nft Economic Appdata Plugin](knowledge/features/other/feature-nft-economic-appdata-plugin.md) | n/a |
| feature-nft-permanent-transfer-delegate | archived | none | [Feature Nft Permanent Transfer Delegate](knowledge/features/other/feature-nft-permanent-transfer-delegate.md) | n/a |
| feature-redirect-first-connection | archived | none | [Feature Redirect First Connection](knowledge/features/other/feature-redirect-first-connection.md) | n/a |
| feature-shared-agent-system-knowledge-root-implementation | archived | none | [Shared Agent System Knowledge Root Implementation](knowledge/features/other/feature-shared-agent-system-knowledge-root-implementation.md) | n/a |
| feature-shared-agent-system-knowledge-root | archived | none | [Shared Agent System Knowledge Root](knowledge/features/other/feature-shared-agent-system-knowledge-root.md) | n/a |
| feature-shared-cleanup-marketplace-3d-visual-docs-implementation | archived | none | [Feature Shared Cleanup Marketplace 3d Visual Docs Implementation](knowledge/features/other/feature-shared-cleanup-marketplace-3d-visual-docs-implementation.md) | n/a |
| feature-shared-cleanup-marketplace-3d-visual-docs | archived | none | [Feature Shared Cleanup Marketplace 3d Visual Docs](knowledge/features/other/feature-shared-cleanup-marketplace-3d-visual-docs.md) | n/a |
| feature-shared-cleanup-monorepo-structure-implementation | archived | none | [Feature Shared Cleanup Monorepo Structure Implementation](knowledge/features/other/feature-shared-cleanup-monorepo-structure-implementation.md) | n/a |
| feature-shared-cleanup-monorepo-structure | archived | none | [Feature Shared Cleanup Monorepo Structure](knowledge/features/other/feature-shared-cleanup-monorepo-structure.md) | n/a |
| feature-shared-nix-toolchain-policy | archived | none | [Feature Shared Nix Toolchain Policy](knowledge/features/other/feature-shared-nix-toolchain-policy.md) | n/a |
| feature-shared-pr-governance-flow-flexibility | archived | none | [Feature Shared Pr Governance Flow Flexibility](knowledge/features/other/feature-shared-pr-governance-flow-flexibility.md) | n/a |
| feature-shared-pr-governance-metadata-race-fix | archived | none | [Feature Shared Pr Governance Metadata Race Fix](knowledge/features/other/feature-shared-pr-governance-metadata-race-fix.md) | n/a |
| feature-solana-dev-skill-implementation | archived | none | [Implementation plan for solana-dev skill in-repo installation](knowledge/features/other/feature-solana-dev-skill-implementation.md) | n/a |
| feature-solana-dev-skill | archived | none | [Add solana-dev skill to .agents/skills for canonical in-repo access](knowledge/features/other/feature-solana-dev-skill.md) | n/a |
| fix-app-feature-icons-and-copy | archived | none | [Fix App Feature Icons And Copy](knowledge/features/other/fix-app-feature-icons-and-copy.md) | n/a |
| fix-app-suspend-airwallex-checkout | archived | none | [Fix App Suspend Airwallex Checkout](knowledge/features/other/fix-app-suspend-airwallex-checkout.md) | n/a |
| fix-dev-origin-and-pg-ssl-warnings | archived | none | [Fix Dev Origin And Pg Ssl Warnings](knowledge/features/other/fix-dev-origin-and-pg-ssl-warnings.md) | n/a |
| fix-google-maps-embed-preview | archived | none | [Fix Google Maps Embed Preview](knowledge/features/other/fix-google-maps-embed-preview.md) | n/a |
| fix-shared-github-actions-node24 | archived | none | [Fix Shared Github Actions Node24](knowledge/features/other/fix-shared-github-actions-node24.md) | n/a |
| fix-shared-npm-deprecation-cleanup-initial-wallet-bundle-prune | archived | none | [Fix Shared Npm Deprecation Cleanup Initial Wallet Bundle Prune](knowledge/features/other/fix-shared-npm-deprecation-cleanup-initial-wallet-bundle-prune.md) | n/a |
| fix-shared-pr-policy-lite-and-log-noise | archived | none | [Fix Shared Pr Policy Lite And Log Noise](knowledge/features/other/fix-shared-pr-policy-lite-and-log-noise.md) | n/a |
| fix-shared-pr-workflow-noise-reduction | archived | none | [Fix Shared Pr Workflow Noise Reduction](knowledge/features/other/fix-shared-pr-workflow-noise-reduction.md) | n/a |
| index | archived | none | [other](knowledge/features/other/index.md) | n/a |
| refactor-shared-brids-technical-rename | archived | none | [Refactor Shared BRI-ds Technical Rename](knowledge/features/other/refactor-shared-brids-technical-rename.md) | n/a |
| refactor-shared-codex-orchestration-architecture | archived | none | [Refactor Shared Codex Orchestration Architecture](knowledge/features/other/refactor-shared-codex-orchestration-architecture.md) | n/a |
| refactor-terminology | archived | none | [Refactor Terminology](knowledge/features/other/refactor-terminology.md) | n/a |
| fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation-implementation | archived | none | [Fix HyBRI-d Auth Bidirectional Linking And Safe Account Consolidation Implementation](knowledge/fixes/bri-154/fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation-implementation.md) | n/a |
| fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation | archived | none | [Fix HyBRI-d Auth Bidirectional Linking And Safe Account Consolidation](knowledge/fixes/bri-154/fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation.md) | n/a |
| index | archived | none | [bri-154](knowledge/fixes/bri-154/index.md) | n/a |
| fix-agents-orchestation-implementation | archived | none | [Fix Agents Orchestation Implementation](knowledge/fixes/bri-157/fix-agents-orchestation-implementation.md) | n/a |
| fix-agents-orchestation | archived | none | [Fix Agents Orchestation](knowledge/fixes/bri-157/fix-agents-orchestation.md) | n/a |
| index | archived | none | [bri-157](knowledge/fixes/bri-157/index.md) | n/a |
| fix-public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158-implementation | archived | none | [Fix Public Seo Core Web Vitals And Vercel Performance Hardening BRI- 158 Implementation](knowledge/fixes/bri-158/fix-public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158-implementation.md) | n/a |
| fix-public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158 | archived | none | [Fix Public Seo Core Web Vitals And Vercel Performance Hardening BRI- 158](knowledge/fixes/bri-158/fix-public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158.md) | n/a |
| index | archived | none | [bri-158](knowledge/fixes/bri-158/index.md) | n/a |
| fix-app-admin-asset-form-investment-model-alignment-bri-161-implementation | archived | none | [Fix App Admin Asset Form Investment Model Alignment BRI- 161 Implementation](knowledge/fixes/bri-161/fix-app-admin-asset-form-investment-model-alignment-bri-161-implementation.md) | n/a |
| fix-app-admin-asset-form-investment-model-alignment-bri-161 | archived | none | [Fix App Admin Asset Form Investment Model Alignment BRI- 161](knowledge/fixes/bri-161/fix-app-admin-asset-form-investment-model-alignment-bri-161.md) | n/a |
| index | archived | none | [bri-161](knowledge/fixes/bri-161/index.md) | n/a |
| fix-single-project-vercel-alias-flow-bri-162-implementation | archived | none | [Fix Single Project Vercel Alias Flow BRI- 162 Implementation](knowledge/fixes/bri-162/fix-single-project-vercel-alias-flow-bri-162-implementation.md) | n/a |
| fix-single-project-vercel-alias-flow-bri-162 | archived | none | [Fix Single Project Vercel Alias Flow BRI- 162](knowledge/fixes/bri-162/fix-single-project-vercel-alias-flow-bri-162.md) | n/a |
| index | archived | none | [bri-162](knowledge/fixes/bri-162/index.md) | n/a |
| fix-app-marketplace-detail-google-maps-bri-164-implementation | archived | none | [Fix App Marketplace Detail Google Maps BRI- 164 Implementation](knowledge/fixes/bri-164/fix-app-marketplace-detail-google-maps-bri-164-implementation.md) | n/a |
| fix-app-marketplace-detail-google-maps-bri-164 | archived | none | [Fix App Marketplace Detail Google Maps BRI- 164](knowledge/fixes/bri-164/fix-app-marketplace-detail-google-maps-bri-164.md) | n/a |
| fix-app-marketplace-detail-modal-scroll-bri-164-implementation | archived | none | [Fix App Marketplace Detail Modal Scroll BRI- 164 Implementation](knowledge/fixes/bri-164/fix-app-marketplace-detail-modal-scroll-bri-164-implementation.md) | n/a |
| fix-app-marketplace-detail-modal-scroll-bri-164 | archived | none | [Fix App Marketplace Detail Modal Scroll BRI- 164](knowledge/fixes/bri-164/fix-app-marketplace-detail-modal-scroll-bri-164.md) | n/a |
| fix-app-marketplace-disable-auto-camera-orbit-bri-164-implementation | archived | none | [Fix App Marketplace Disable Auto Camera Orbit BRI- 164 Implementation](knowledge/fixes/bri-164/fix-app-marketplace-disable-auto-camera-orbit-bri-164-implementation.md) | n/a |
| fix-app-marketplace-disable-auto-camera-orbit-bri-164 | archived | none | [Fix App Marketplace Disable Auto Camera Orbit BRI- 164](knowledge/fixes/bri-164/fix-app-marketplace-disable-auto-camera-orbit-bri-164.md) | n/a |
| fix-app-marketplace-map-pin-contrast-bri-164-implementation | archived | none | [Fix App Marketplace Map Pin Contrast BRI- 164 Implementation](knowledge/fixes/bri-164/fix-app-marketplace-map-pin-contrast-bri-164-implementation.md) | n/a |
| fix-app-marketplace-map-pin-contrast-bri-164 | archived | none | [Fix App Marketplace Map Pin Contrast BRI- 164](knowledge/fixes/bri-164/fix-app-marketplace-map-pin-contrast-bri-164.md) | n/a |
| fix-app-marketplace-map-pin-leader-stacking-bri-164-implementation | archived | none | [Fix App Marketplace Map Pin Leader Stacking BRI- 164 Implementation](knowledge/fixes/bri-164/fix-app-marketplace-map-pin-leader-stacking-bri-164-implementation.md) | n/a |
| fix-app-marketplace-map-pin-leader-stacking-bri-164 | archived | none | [Fix App Marketplace Map Pin Leader Stacking BRI- 164](knowledge/fixes/bri-164/fix-app-marketplace-map-pin-leader-stacking-bri-164.md) | n/a |
| fix-app-marketplace-map-update-depth-bri-164-implementation | archived | none | [Fix App Marketplace Map Update Depth BRI- 164 Implementation](knowledge/fixes/bri-164/fix-app-marketplace-map-update-depth-bri-164-implementation.md) | n/a |
| fix-app-marketplace-map-update-depth-bri-164 | archived | none | [Fix App Marketplace Map Update Depth BRI- 164](knowledge/fixes/bri-164/fix-app-marketplace-map-update-depth-bri-164.md) | n/a |
| fix-app-marketplace-side-pin-compact-bri-164-implementation | archived | none | [Fix App Marketplace Side Pin Compact BRI- 164 Implementation](knowledge/fixes/bri-164/fix-app-marketplace-side-pin-compact-bri-164-implementation.md) | n/a |
| fix-app-marketplace-side-pin-compact-bri-164 | archived | none | [Fix App Marketplace Side Pin Compact BRI- 164](knowledge/fixes/bri-164/fix-app-marketplace-side-pin-compact-bri-164.md) | n/a |
| index | archived | none | [bri-164](knowledge/fixes/bri-164/index.md) | n/a |
| fix-adminassetsnew-bri-165-implementation | archived | none | [Fix Adminassetsnew BRI- 165 Implementation](knowledge/fixes/bri-165/fix-adminassetsnew-bri-165-implementation.md) | n/a |
| fix-adminassetsnew-bri-165 | archived | none | [Fix Adminassetsnew BRI- 165](knowledge/fixes/bri-165/fix-adminassetsnew-bri-165.md) | n/a |
| index | archived | none | [bri-165](knowledge/fixes/bri-165/index.md) | n/a |
| fix-may-2026-ui-errors-implementation | archived | none | [Fix May 2026 Ui Errors Implementation](knowledge/fixes/bri-166/fix-may-2026-ui-errors-implementation.md) | n/a |
| fix-may-2026-ui-errors | archived | none | [Fix May 2026 Ui Errors](knowledge/fixes/bri-166/fix-may-2026-ui-errors.md) | n/a |
| index | archived | none | [bri-166](knowledge/fixes/bri-166/index.md) | n/a |
| fix-bri-167-phantom-autoconnect-scope-implementation | archived | none | [Fix BRI- 167 Phantom Autoconnect Scope Implementation](knowledge/fixes/bri-167/fix-bri-167-phantom-autoconnect-scope-implementation.md) | n/a |
| fix-bri-167-phantom-autoconnect-scope | archived | none | [Fix BRI- 167 Phantom Autoconnect Scope](knowledge/fixes/bri-167/fix-bri-167-phantom-autoconnect-scope.md) | n/a |
| fix-login-modal-issue-implementation | archived | none | [Fix Login Modal Issue Implementation](knowledge/fixes/bri-167/fix-login-modal-issue-implementation.md) | n/a |
| fix-login-modal-issue | archived | none | [Fix Login Modal Issue](knowledge/fixes/bri-167/fix-login-modal-issue.md) | n/a |
| index | archived | none | [bri-167](knowledge/fixes/bri-167/index.md) | n/a |
| fix-admin-collections-ui-reorganization-bri-169-implementation | archived | none | [Fix Admin Collections Ui Reorganization BRI- 169 Implementation](knowledge/fixes/bri-169/fix-admin-collections-ui-reorganization-bri-169-implementation.md) | n/a |
| fix-admin-collections-ui-reorganization-bri-169 | archived | none | [Fix Admin Collections Ui Reorganization BRI- 169](knowledge/fixes/bri-169/fix-admin-collections-ui-reorganization-bri-169.md) | n/a |
| index | archived | none | [bri-169](knowledge/fixes/bri-169/index.md) | n/a |
| fix-admin-assets-owner-freeze-mint-flow-implementation | archived | none | [Fix Admin Assets Owner Freeze Mint Flow Implementation](knowledge/fixes/bri-170/fix-admin-assets-owner-freeze-mint-flow-implementation.md) | n/a |
| fix-admin-assets-owner-freeze-mint-flow | archived | none | [Fix Admin Assets Owner Freeze Mint Flow](knowledge/fixes/bri-170/fix-admin-assets-owner-freeze-mint-flow.md) | n/a |
| fix-bri-170-stake-blockhash-expiry-retry-implementation | archived | none | [Fix BRI- 170 Stake Blockhash Expiry Retry Implementation](knowledge/fixes/bri-170/fix-bri-170-stake-blockhash-expiry-retry-implementation.md) | n/a |
| fix-bri-170-stake-blockhash-expiry-retry | archived | none | [Fix BRI- 170 Stake Blockhash Expiry Retry](knowledge/fixes/bri-170/fix-bri-170-stake-blockhash-expiry-retry.md) | n/a |
| fix-bri-170-stake-mobile-card-overflow-implementation | archived | none | [Fix BRI- 170 Stake Mobile Card Overflow Implementation](knowledge/fixes/bri-170/fix-bri-170-stake-mobile-card-overflow-implementation.md) | n/a |
| fix-bri-170-stake-mobile-card-overflow | archived | none | [Fix BRI- 170 Stake Mobile Card Overflow](knowledge/fixes/bri-170/fix-bri-170-stake-mobile-card-overflow.md) | n/a |
| fix-bri-170-stake-sync-feedback-implementation | archived | none | [Fix BRI- 170 Stake Sync Feedback Implementation](knowledge/fixes/bri-170/fix-bri-170-stake-sync-feedback-implementation.md) | n/a |
| fix-bri-170-stake-sync-feedback | archived | none | [Fix BRI- 170 Stake Sync Feedback](knowledge/fixes/bri-170/fix-bri-170-stake-sync-feedback.md) | n/a |
| index | archived | none | [bri-170](knowledge/fixes/bri-170/index.md) | n/a |
| fix-bri-171-investor-overview-placeholder-states-implementation | archived | none | [Fix BRI- 171 Investor Overview Placeholder States Implementation](knowledge/fixes/bri-171/fix-bri-171-investor-overview-placeholder-states-implementation.md) | n/a |
| fix-bri-171-investor-overview-placeholder-states | archived | none | [Fix BRI- 171 Investor Overview Placeholder States](knowledge/fixes/bri-171/fix-bri-171-investor-overview-placeholder-states.md) | n/a |
| index | archived | none | [bri-171](knowledge/fixes/bri-171/index.md) | n/a |
| fix-admin-cm-deploy-current-system-implementation | archived | none | [Fix Admin Cm Deploy Current System Implementation](knowledge/fixes/bri-176/fix-admin-cm-deploy-current-system-implementation.md) | n/a |
| fix-admin-cm-deploy-current-system | archived | none | [Fix Admin Cm Deploy Current System](knowledge/fixes/bri-176/fix-admin-cm-deploy-current-system.md) | n/a |
| index | archived | none | [bri-176](knowledge/fixes/bri-176/index.md) | n/a |
| fix-bri-178-splash-performance-implementation | archived | none | [Fix BRI- 178 Splash Performance Implementation](knowledge/fixes/bri-178/fix-bri-178-splash-performance-implementation.md) | n/a |
| fix-bri-178-splash-performance | archived | none | [Fix BRI- 178 Splash Performance](knowledge/fixes/bri-178/fix-bri-178-splash-performance.md) | n/a |
| index | archived | none | [bri-178](knowledge/fixes/bri-178/index.md) | n/a |
| fix-bri-6-admin-distributions-production-visibility-implementation | archived | none | [Fix BRI- 6 Admin Distributions Production Visibility Implementation](knowledge/fixes/bri-6/fix-bri-6-admin-distributions-production-visibility-implementation.md) | n/a |
| fix-bri-6-admin-distributions-production-visibility | archived | none | [Fix BRI- 6 Admin Distributions Production Visibility](knowledge/fixes/bri-6/fix-bri-6-admin-distributions-production-visibility.md) | n/a |
| index | archived | none | [bri-6](knowledge/fixes/bri-6/index.md) | n/a |
| index | archived | none | [Fixes](knowledge/fixes/index.md) | n/a |
| fix-admin-asset-project-duration-derived-dates-implementation | archived | none | [Fix Admin Asset Project Duration Derived Dates Implementation](knowledge/fixes/other/fix-admin-asset-project-duration-derived-dates-implementation.md) | n/a |
| fix-admin-asset-project-duration-derived-dates | archived | none | [Fix Admin Asset Project Duration Derived Dates](knowledge/fixes/other/fix-admin-asset-project-duration-derived-dates.md) | n/a |
| fix-admin-cm-deploy-detailed-logs-implementation | archived | none | [Fix Admin Cm Deploy Detailed Logs Implementation](knowledge/fixes/other/fix-admin-cm-deploy-detailed-logs-implementation.md) | n/a |
| fix-admin-cm-deploy-detailed-logs | archived | none | [Fix Admin Cm Deploy Detailed Logs](knowledge/fixes/other/fix-admin-cm-deploy-detailed-logs.md) | n/a |
| fix-admin-collections-document-upload-implementation | archived | none | [Fix Admin Collections Document Upload Implementation](knowledge/fixes/other/fix-admin-collections-document-upload-implementation.md) | n/a |
| fix-admin-collections-document-upload | archived | none | [Fix Admin Collections Document Upload](knowledge/fixes/other/fix-admin-collections-document-upload.md) | n/a |
| fix-linear-initiative-branch-workflow-implementation | archived | none | [Fix Linear Initiative Branch Workflow Implementation](knowledge/fixes/other/fix-linear-initiative-branch-workflow-implementation.md) | n/a |
| fix-linear-initiative-branch-workflow | archived | none | [Fix Linear Initiative Branch Workflow](knowledge/fixes/other/fix-linear-initiative-branch-workflow.md) | n/a |
| fix-stake-submit-signed-message-blockhash-tolerance-implementation | archived | none | [Fix Stake Submit Signed Message Blockhash Tolerance Implementation](knowledge/fixes/other/fix-stake-submit-signed-message-blockhash-tolerance-implementation.md) | n/a |
| fix-stake-submit-signed-message-blockhash-tolerance | archived | none | [Fix Stake Submit Signed Message Blockhash Tolerance](knowledge/fixes/other/fix-stake-submit-signed-message-blockhash-tolerance.md) | n/a |
| fix-stake-unstake-release-visibility-implementation | archived | none | [Fix Stake Unstake Release Visibility Implementation](knowledge/fixes/other/fix-stake-unstake-release-visibility-implementation.md) | n/a |
| fix-stake-unstake-release-visibility | archived | none | [Fix Stake Unstake Release Visibility](knowledge/fixes/other/fix-stake-unstake-release-visibility.md) | n/a |
| fix-test-suite-drift-marketplace-i18n-and-pr-governance-implementation | archived | none | [Fix Test Suite Drift Marketplace I18n And Pr Governance Implementation](knowledge/fixes/other/fix-test-suite-drift-marketplace-i18n-and-pr-governance-implementation.md) | n/a |
| fix-test-suite-drift-marketplace-i18n-and-pr-governance | archived | none | [Fix Test Suite Drift Marketplace I18n And Pr Governance](knowledge/fixes/other/fix-test-suite-drift-marketplace-i18n-and-pr-governance.md) | n/a |
| index | archived | none | [other](knowledge/fixes/other/index.md) | n/a |
| clean-code-folder-structure | archived | none | [clean-code-folder-structure](knowledge/governance/clean-code-folder-structure.md) | n/a |
| documentation-policy | archived | none | [Documentation Policy](knowledge/governance/documentation-policy.md) | n/a |
| frontend-ui-policy | archived | none | [Frontend Ui Policy](knowledge/governance/frontend-ui-policy.md) | n/a |
| git-monorepo-policy | archived | none | [Git Monorepo Policy](knowledge/governance/git-monorepo-policy.md) | n/a |
| iconography-rules | archived | none | [Iconography Rules](knowledge/governance/iconography-rules.md) | n/a |
| index | archived | none | [Index](knowledge/governance/index.md) | n/a |
| licenses-report | archived | none | [licenses-report](knowledge/governance/licenses-report.md) | n/a |
| monorepo-symlink-deprecation-guide | archived | none | [monorepo-symlink-deprecation-guide](knowledge/governance/monorepo-symlink-deprecation-guide.md) | n/a |
| nft-policy | archived | none | [Nft Policy](knowledge/governance/nft-policy.md) | n/a |
| pr-policy-source-of-truth | archived | none | [PR Policy Source of Truth](knowledge/governance/pr-policy-source-of-truth.md) | n/a |
| security-quality-policy | archived | none | [Security Quality Policy](knowledge/governance/security-quality-policy.md) | n/a |
| toolchain-policy | archived | none | [Toolchain & Headless Browser Policy](knowledge/governance/toolchain-policy.md) | n/a |
| ai-readable-endpoints-contracts | archived | none | [Ai Readable Endpoints Contracts](knowledge/guides/ai-readable-endpoints-contracts.md) | n/a |
| codex-orchestration-architecture | archived | none | [Codex Orchestration Architecture](knowledge/guides/codex-orchestration-architecture.md) | n/a |
| content-authoring-code-only | archived | none | [Content Authoring Code Only](knowledge/guides/content-authoring-code-only.md) | n/a |
| content-pipeline-and-serializers | archived | none | [Content Pipeline And Serializers](knowledge/guides/content-pipeline-and-serializers.md) | n/a |
| EPIC-014-distribution-system-sop | archived | none | [EPIC-014-distribution-system-sop](knowledge/guides/EPIC-014-distribution-system-sop.md) | n/a |
| gitflow-pr-structure | archived | none | [Gitflow Pr Structure](knowledge/guides/gitflow-pr-structure.md) | n/a |
| index | archived | none | [Index](knowledge/guides/index.md) | n/a |
| json-ld-contracts | archived | none | [Json Ld Contracts](knowledge/guides/json-ld-contracts.md) | n/a |
| knowledge-promotion-gitflow | archived | none | [Knowledge Promotion Gitflow](knowledge/guides/knowledge-promotion-gitflow.md) | n/a |
| linear-developer-identity-and-documentation-protocol | archived | none | [Linear Developer Identity And Documentation Protocol](knowledge/guides/linear-developer-identity-and-documentation-protocol.md) | n/a |
| linear-mcp-bridge | archived | none | [Linear Mcp BRI-dge](knowledge/guides/linear-mcp-bridge.md) | n/a |
| linear-single-issue-slice-planning | archived | none | [Linear Single Issue Slice Planning](knowledge/guides/linear-single-issue-slice-planning.md) | n/a |
| operability-observability-security-deploy | archived | none | [Operability Observability Security Deploy](knowledge/guides/operability-observability-security-deploy.md) | n/a |
| route-architecture-and-templates | archived | none | [Route Architecture And Templates](knowledge/guides/route-architecture-and-templates.md) | n/a |
| solana-kit-migration-recipes | archived | none | [Solana Kit Migration Recipes](knowledge/guides/solana-kit-migration-recipes.md) | n/a |
| index | archived | none | [BRIDS Knowledge Catalog](knowledge/index.md) | n/a |
| log | archived | none | [Log](knowledge/log.md) | n/a |
| index | archived | none | [Index](knowledge/mapbox/index.md) | n/a |
| index | archived | none | [Index](knowledge/operations/index.md) | n/a |
| admin-asset-creation | archived | none | [Admin Asset Creation Workflow](knowledge/operations/playbooks/admin-asset-creation.md) | n/a |
| asset-minting-deployment | archived | none | [Asset Minting and Deployment](knowledge/operations/playbooks/asset-minting-deployment.md) | n/a |
| collection-creation-minting | archived | none | [Collection Creation and Minting](knowledge/operations/playbooks/collection-creation-minting.md) | n/a |
| index | archived | none | [playbooks](knowledge/operations/playbooks/index.md) | n/a |
| marketplace-listing-management | archived | none | [Marketplace Listing Management](knowledge/operations/playbooks/marketplace-listing-management.md) | n/a |
| stake-event-reconciliation | archived | none | [Stake Event Reconciliation](knowledge/operations/playbooks/stake-event-reconciliation.md) | n/a |
| backup-restore | archived | none | [Backup and Restore](knowledge/operations/procedures/backup-restore.md) | n/a |
| candy-machine-deploy-validation | archived | none | [Candy Machine Deploy Validation](knowledge/operations/procedures/candy-machine-deploy-validation.md) | n/a |
| devnet-authority-lifecycle | archived | none | [DevNet Authority Lifecycle Proof](knowledge/operations/procedures/devnet-authority-lifecycle.md) | n/a |
| health-checks-monitoring | archived | none | [Health Checks and Monitoring](knowledge/operations/procedures/health-checks-monitoring.md) | n/a |
| index | archived | none | [procedures](knowledge/operations/procedures/index.md) | n/a |
| purchase-trace-verification | archived | none | [Purchase Trace Verification](knowledge/operations/procedures/purchase-trace-verification.md) | n/a |
| db-migration-rollback | archived | none | [Database Migration Rollback](knowledge/operations/runbooks/db-migration-rollback.md) | n/a |
| incident-data-freshness-alert | archived | none | [Incident Response - Data Freshness Alert](knowledge/operations/runbooks/incident-data-freshness-alert.md) | n/a |
| incident-solana-deployment | archived | none | [Incident Response - Solana Program Deployment](knowledge/operations/runbooks/incident-solana-deployment.md) | n/a |
| incident-wallet-connection | archived | none | [Incident Response - Wallet Connection Issues](knowledge/operations/runbooks/incident-wallet-connection.md) | n/a |
| index | archived | none | [runbooks](knowledge/operations/runbooks/index.md) | n/a |
| vercel-deployment-rollback | archived | none | [Vercel Deployment Rollback](knowledge/operations/runbooks/vercel-deployment-rollback.md) | n/a |
| 000-manifest | archived | none | [000 Manifest](knowledge/rfcs/000-manifest.md) | n/a |
| index | archived | none | [artifacts](knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/index.md) | n/a |
| STORY-001-04-phase1-inventory | archived | none | [STORY- 001 04 Phase1 Inventory](knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/STORY-001-04-phase1-inventory.md) | n/a |
| STORY-001-04-phase2-state-hook | archived | none | [STORY- 001 04 Phase2 State Hook](knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/STORY-001-04-phase2-state-hook.md) | n/a |
| VALIDATION-2026-03-16 | archived | none | [VALIDATION 2026 03 16](knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-16.md) | n/a |
| VALIDATION-2026-03-26 | archived | none | [VALIDATION 2026 03 26](knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-26.md) | n/a |
| VALIDATION-2026-03-27 | archived | none | [VALIDATION 2026 03 27](knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-27.md) | n/a |
| index | archived | none | [EPIC-001-admin-asset-create-form](knowledge/rfcs/EPIC-001-admin-asset-create-form/index.md) | n/a |
| STORY-001-01-kickoff | archived | none | [STORY- 001 01 Kickoff](knowledge/rfcs/EPIC-001-admin-asset-create-form/STORY-001-01-kickoff.md) | n/a |
| STORY-001-02-signed-url-contract | archived | none | [STORY- 001 02 Signed Url Contract](knowledge/rfcs/EPIC-001-admin-asset-create-form/STORY-001-02-signed-url-contract.md) | n/a |
| STORY-001-03-csv-async-pipeline | archived | none | [STORY- 001 03 Csv Async Pipeline](knowledge/rfcs/EPIC-001-admin-asset-create-form/STORY-001-03-csv-async-pipeline.md) | n/a |
| STORY-001-04-asset-creation-form-structural-refactor | archived | none | [STORY- 001 04 Asset Creation Form Structural Refactor](knowledge/rfcs/EPIC-001-admin-asset-create-form/STORY-001-04-asset-creation-form-structural-refactor.md) | n/a |
| index | archived | none | [EPIC-002-core-candy-machine-mint-module](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/index.md) | n/a |
| STORY-002-01-kickoff | archived | none | [STORY- 002 01 Kickoff](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-01-kickoff.md) | n/a |
| STORY-002-01-technical-decision | archived | none | [STORY- 002 01 Technical Decision](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-01-technical-decision.md) | n/a |
| STORY-002-02-create-asset-to-mint-flow | archived | none | [STORY- 002 02 Create Asset To Mint Flow](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-02-create-asset-to-mint-flow.md) | n/a |
| STORY-002-03-deploy-core-candy-machine | archived | none | [STORY- 002 03 Deploy Core Candy Machine](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-03-deploy-core-candy-machine.md) | n/a |
| STORY-002-04-mint-execution-and-progress | archived | none | [STORY- 002 04 Mint Execution And Progress](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-04-mint-execution-and-progress.md) | n/a |
| STORY-002-05-onchain-reconciliation-and-job-persistence | archived | none | [STORY- 002 05 Onchain Reconciliation And Job Persistence](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-05-onchain-reconciliation-and-job-persistence.md) | n/a |
| STORY-002-06-mint-snapshot-persistence-and-create-asset-gate | archived | none | [STORY- 002 06 Mint Snapshot Persistence And Create Asset Gate](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-06-mint-snapshot-persistence-and-create-asset-gate.md) | n/a |
| STORY-002-07-usdc-token-payment-and-temporary-recipient | archived | none | [STORY- 002 07 Usdc Token Payment And Temporary Recipient](knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-07-usdc-token-payment-and-temporary-recipient.md) | n/a |
| index | archived | none | [EPIC-003-nft-store-purchase-flow](knowledge/rfcs/EPIC-003-nft-store-purchase-flow/index.md) | n/a |
| STORY-003-01-basic-nft-purchase | archived | none | [STORY- 003 01 Basic Nft Purchase](knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-01-basic-nft-purchase.md) | n/a |
| STORY-003-02-anti-bot-without-wallet-cap | archived | none | [STORY- 003 02 Anti Bot Without Wallet Cap](knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-02-anti-bot-without-wallet-cap.md) | n/a |
| STORY-003-03-transaction-integrity-and-idempotency | archived | none | [STORY- 003 03 Transaction Integrity And Idempotency](knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-03-transaction-integrity-and-idempotency.md) | n/a |
| STORY-003-04-quantity-foundation-and-multi-quantity-rollout | archived | none | [STORY- 003 04 Quantity Foundation And Multi Quantity Rollout](knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-04-quantity-foundation-and-multi-quantity-rollout.md) | n/a |
| STORY-003-05-purchase-traceability-and-metrics-backend | archived | none | [STORY- 003 05 Purchase Traceability And Metrics Backend](knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-05-purchase-traceability-and-metrics-backend.md) | n/a |
| STORY-003-06-admin-dashboard-metrics-binding | archived | none | [STORY- 003 06 Admin Dashboard Metrics Binding](knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-06-admin-dashboard-metrics-binding.md) | n/a |
| index | archived | none | [EPIC-004-user-profile-kyc-aml](knowledge/rfcs/EPIC-004-user-profile-kyc-aml/index.md) | n/a |
| STORY-004-01-profile-data-model-and-wallet-binding | archived | none | [STORY- 004 01 Profile Data Model And Wallet Binding](knowledge/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-01-profile-data-model-and-wallet-binding.md) | n/a |
| STORY-004-02-stripe-identity-integration-kickoff | archived | none | [STORY- 004 02 Stripe Identity Integration Kickoff](knowledge/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-02-stripe-identity-integration-kickoff.md) | n/a |
| STORY-004-03-stripe-webhook-handler | archived | none | [STORY- 004 03 Stripe Webhook Handler](knowledge/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-03-stripe-webhook-handler.md) | n/a |
| STORY-004-04-helius-aml-wallet-screening | archived | none | [STORY- 004 04 Helius Aml Wallet Screening](knowledge/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-04-helius-aml-wallet-screening.md) | n/a |
| STORY-004-05-compliance-dashboard-and-audit | archived | none | [STORY- 004 05 Compliance Dashboard And Audit](knowledge/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-05-compliance-dashboard-and-audit.md) | n/a |
| STORY-004-06-staff-review-and-verdict | archived | none | [STORY- 004 06 Staff Review And Verdict](knowledge/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-06-staff-review-and-verdict.md) | n/a |
| index | archived | none | [EPIC-005-full-migration-from-solana-web3-js-to-solana-kit](knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/index.md) | n/a |
| STORY-005-01-kickoff-and-inventory | archived | none | [STORY- 005 01 Kickoff And Inventory](knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/STORY-005-01-kickoff-and-inventory.md) | n/a |
| STORY-005-02-foundation-rpc-address-and-compat-adapters | archived | none | [STORY- 005 02 Foundation Rpc Address And Compat Adapters](knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/STORY-005-02-foundation-rpc-address-and-compat-adapters.md) | n/a |
| STORY-005-03-auth-signature-and-anti-bot-migration | archived | none | [STORY- 005 03 Auth Signature And Anti Bot Migration](knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/STORY-005-03-auth-signature-and-anti-bot-migration.md) | n/a |
| STORY-005-04-transaction-pipelines-purchase-and-admin-migration | archived | none | [STORY- 005 04 Transaction Pipelines Purchase And Admin Migration](knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/STORY-005-04-transaction-pipelines-purchase-and-admin-migration.md) | n/a |
| STORY-005-05-cleanup-dependency-removal-and-final-regression | archived | none | [STORY- 005 05 Cleanup Dependency Removal And Final Regression](knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/STORY-005-05-cleanup-dependency-removal-and-final-regression.md) | n/a |
| FINAL-REVIEW-2026-04-02 | archived | none | [FINAL REVIEW 2026 04 02](knowledge/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/FINAL-REVIEW-2026-04-02.md) | n/a |
| index | archived | none | [EPIC-006-deploy-freeze-delegate-inheritance](knowledge/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/index.md) | n/a |
| STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin | archived | none | [STORY- 006 01 Deploy And Mint Permanent Freeze Delegate Plugin](knowledge/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin.md) | n/a |
| STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin | archived | none | [STORY- 006 02 Deploy And Mint Permanent Transfer Delegate Plugin](knowledge/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin.md) | n/a |
| STORY-006-03-nft-economic-data-appdata-plugin | archived | none | [STORY- 006 03 Nft Economic Data Appdata Plugin](knowledge/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/STORY-006-03-nft-economic-data-appdata-plugin.md) | n/a |
| STORY-006-04-onchain-delegate-rotation-revocation | archived | none | [STORY- 006 04 Onchain Delegate Rotation Revocation](knowledge/rfcs/EPIC-006-deploy-freeze-delegate-inheritance/STORY-006-04-onchain-delegate-rotation-revocation.md) | n/a |
| index | archived | none | [EPIC-007-offline-recovery-protocol](knowledge/rfcs/EPIC-007-offline-recovery-protocol/index.md) | n/a |
| STORY-007-01-recovery-workflow-specification | archived | none | [STORY- 007 01 Recovery Workflow Specification](knowledge/rfcs/EPIC-007-offline-recovery-protocol/STORY-007-01-recovery-workflow-specification.md) | n/a |
| index | archived | none | [EPIC-008-recarga-recurrente-co-littio-sphere-solana](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/index.md) | n/a |
| STORY-008-01-product-ux-blueprint-and-sidebar-logic | archived | none | [STORY- 008 01 Product Ux Blueprint And Sidebar Logic](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-01-product-ux-blueprint-and-sidebar-logic.md) | n/a |
| STORY-008-02-customer-onboarding-and-compliance-kyc-kyb-tos | archived | none | [STORY- 008 02 Customer Onboarding And Compliance Kyc Kyb Tos](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-02-customer-onboarding-and-compliance-kyc-kyb-tos.md) | n/a |
| STORY-008-03-solana-wallet-destination-and-usdc-ata-validation | archived | none | [STORY- 008 03 Solana Wallet Destination And Usdc Ata Validation](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-03-solana-wallet-destination-and-usdc-ata-validation.md) | n/a |
| STORY-008-04-dedicated-onramper-account-provisioning | archived | none | [STORY- 008 04 Dedicated Onramper Account Provisioning](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-04-dedicated-onramper-account-provisioning.md) | n/a |
| STORY-008-05-colombia-flow-littio-and-guided-tutorial | archived | none | [STORY- 008 05 Colombia Flow Littio And Guided Tutorial](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-05-colombia-flow-littio-and-guided-tutorial.md) | n/a |
| STORY-008-06-state-orchestration-and-transfer-polling | archived | none | [STORY- 008 06 State Orchestration And Transfer Polling](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-06-state-orchestration-and-transfer-polling.md) | n/a |
| STORY-008-07-limits-risk-and-compliance-controls | archived | none | [STORY- 008 07 Limits Risk And Compliance Controls](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-07-limits-risk-and-compliance-controls.md) | n/a |
| STORY-008-08-transactional-fallback-with-transfers-api | archived | none | [STORY- 008 08 Transactional Fallback With Transfers Api](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-08-transactional-fallback-with-transfers-api.md) | n/a |
| STORY-008-09-full-qa-observability-and-controlled-rollout | archived | none | [STORY- 008 09 Full Qa Observability And Controlled Rollout](knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-09-full-qa-observability-and-controlled-rollout.md) | n/a |
| index | archived | none | [EPIC-009-integracion-pasarela-de-pagos-web-2](knowledge/rfcs/EPIC-009-integracion-pasarela-de-pagos-web-2/index.md) | n/a |
| STORY-009-41-integracion-airwallex-carrito | archived | none | [STORY- 009 41 Integracion Airwallex Carrito](knowledge/rfcs/EPIC-009-integracion-pasarela-de-pagos-web-2/STORY-009-41-integracion-airwallex-carrito.md) | n/a |
| index | archived | none | [EPIC-010-ai-discovery-infrastructure-and-seo-for-brids](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/index.md) | n/a |
| STORY-010-01-foundation-and-layered-architecture | archived | none | [STORY- 010 01 Foundation And Layered Architecture](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-01-foundation-and-layered-architecture.md) | n/a |
| STORY-010-02-content-as-code-and-editorial-contracts | archived | none | [STORY- 010 02 Content As Code And Editorial Contracts](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-02-content-as-code-and-editorial-contracts.md) | n/a |
| STORY-010-03-route-architecture-and-reusable-templates | archived | none | [STORY- 010 03 Route Architecture And Reusable Templates](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-03-route-architecture-and-reusable-templates.md) | n/a |
| STORY-010-04-technical-seo-infrastructure | archived | none | [STORY- 010 04 Technical Seo Infrastructure](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-04-technical-seo-infrastructure.md) | n/a |
| STORY-010-05-structured-data-json-ld-layer | archived | none | [STORY- 010 05 Structured Data Json Ld Layer](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-05-structured-data-json-ld-layer.md) | n/a |
| STORY-010-06-ai-readable-and-machine-endpoints | archived | none | [STORY- 010 06 Ai Readable And Machine Endpoints](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-06-ai-readable-and-machine-endpoints.md) | n/a |
| STORY-010-07-content-pipeline-and-serialization | archived | none | [STORY- 010 07 Content Pipeline And Serialization](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-07-content-pipeline-and-serialization.md) | n/a |
| STORY-010-08-semantic-layer-for-entities-and-relations | archived | none | [STORY- 010 08 Semantic Layer For Entities And Relations](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-08-semantic-layer-for-entities-and-relations.md) | n/a |
| STORY-010-09-feeds-exports-and-internal-search-readiness | archived | none | [STORY- 010 09 Feeds Exports And Internal Search Readiness](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-09-feeds-exports-and-internal-search-readiness.md) | n/a |
| STORY-010-10-observability-security-performance-deploy-docs | archived | none | [STORY- 010 10 Observability Security Performance Deploy Docs](knowledge/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-10-observability-security-performance-deploy-docs.md) | n/a |
| index | archived | none | [EPIC-011-admin-collections-console](knowledge/rfcs/EPIC-011-admin-collections-console/index.md) | n/a |
| STORY-011-01-kickoff | archived | none | [STORY- 011 01 Kickoff](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-01-kickoff.md) | n/a |
| STORY-011-02-admin-collections-read-model | archived | none | [STORY- 011 02 Admin Collections Read Model](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-02-admin-collections-read-model.md) | n/a |
| STORY-011-03-editable-collection-content-persistence | archived | none | [STORY- 011 03 Editable Collection Content Persistence](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-03-editable-collection-content-persistence.md) | n/a |
| STORY-011-04-collections-api-and-ownership-enforcement | archived | none | [STORY- 011 04 Collections Api And Ownership Enforcement](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-04-collections-api-and-ownership-enforcement.md) | n/a |
| STORY-011-05-collections-index-ui | archived | none | [STORY- 011 05 Collections Index Ui](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-05-collections-index-ui.md) | n/a |
| STORY-011-06-collection-detail-editor-ui | archived | none | [STORY- 011 06 Collection Detail Editor Ui](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-06-collection-detail-editor-ui.md) | n/a |
| STORY-011-07-qa-responsive-evidence-and-docs-sync | archived | none | [STORY- 011 07 Qa Responsive Evidence And Docs Sync](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-07-qa-responsive-evidence-and-docs-sync.md) | n/a |
| STORY-011-08-blockchain-readonly-panel | archived | none | [STORY- 011 08 Blockchain Readonly Panel](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-08-blockchain-readonly-panel.md) | n/a |
| STORY-011-09-google-maps-location-integration | archived | none | [STORY- 011 09 Google Maps Location Integration](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-09-google-maps-location-integration.md) | n/a |
| STORY-011-10-collections-health-and-manual-review-queue | archived | none | [STORY- 011 10 Collections Health And Manual Review Queue](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-10-collections-health-and-manual-review-queue.md) | n/a |
| STORY-011-11-location-form-contract-and-persistence-parity | archived | none | [STORY- 011 11 Location Form Contract And Persistence Parity](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-11-location-form-contract-and-persistence-parity.md) | n/a |
| STORY-011-12-location-form-editor-and-maps-assisted-ux | archived | none | [STORY- 011 12 Location Form Editor And Maps Assisted Ux](knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-12-location-form-editor-and-maps-assisted-ux.md) | n/a |
| index | archived | none | [EPIC-012-referral-marketing-system-in-user-dashboard](knowledge/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/index.md) | n/a |
| STORY-012-01-access-to-rewards-and-sharing | archived | none | [STORY- 012 01 Access To Rewards And Sharing](knowledge/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-01-access-to-rewards-and-sharing.md) | n/a |
| STORY-012-02-tracking-dashboard-and-retention | archived | none | [STORY- 012 02 Tracking Dashboard And Retention](knowledge/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-02-tracking-dashboard-and-retention.md) | n/a |
| STORY-012-03-invitee-arrival-and-conversion | archived | none | [STORY- 012 03 Invitee Arrival And Conversion](knowledge/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-03-invitee-arrival-and-conversion.md) | n/a |
| STORY-012-04-attribution-validation-and-reward-execution | archived | none | [STORY- 012 04 Attribution Validation And Reward Execution](knowledge/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-04-attribution-validation-and-reward-execution.md) | n/a |
| index | archived | none | [EPIC-013-pwa-installability-and-web-push-notifications](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/index.md) | n/a |
| STORY-013-01-kickoff-threat-model-and-scope-correction | archived | none | [STORY- 013 01 Kickoff Threat Model And Scope Correction](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-01-kickoff-threat-model-and-scope-correction.md) | n/a |
| STORY-013-02-installability-shell-and-capability-aware-opt-in-ux | archived | none | [STORY- 013 02 Installability Shell And Capability Aware Opt In Ux](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-02-installability-shell-and-capability-aware-opt-in-ux.md) | n/a |
| STORY-013-03-secure-subscription-contract-and-persistence-model | archived | none | [STORY- 013 03 Secure Subscription Contract And Persistence Model](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-03-secure-subscription-contract-and-persistence-model.md) | n/a |
| STORY-013-04-delivery-pipeline-pruning-and-transactional-sends | archived | none | [STORY- 013 04 Delivery Pipeline Pruning And Transactional Sends](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-04-delivery-pipeline-pruning-and-transactional-sends.md) | n/a |
| STORY-013-05-admin-campaigns-segmentation-and-abuse-controls | archived | none | [STORY- 013 05 Admin Campaigns Segmentation And Abuse Controls](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-05-admin-campaigns-segmentation-and-abuse-controls.md) | n/a |
| STORY-013-06-qa-rollout-observability-and-kill-switch | archived | none | [STORY- 013 06 Qa Rollout Observability And Kill Switch](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-06-qa-rollout-observability-and-kill-switch.md) | n/a |
| STORY-013-07-clean-code-refactor-slices | archived | none | [STORY- 013 07 Clean Code Refactor Slices](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-07-clean-code-refactor-slices.md) | n/a |
| STORY-013-08-user-push-opt-in-enrollment | archived | none | [STORY- 013 08 User Push Opt In Enrollment](knowledge/rfcs/EPIC-013-pwa-installability-and-web-push-notifications/STORY-013-08-user-push-opt-in-enrollment.md) | n/a |
| CRITIQUE-S01 | archived | none | [CRITIQUE S01](knowledge/rfcs/EPIC-014-stake-distribution-traceability/CRITIQUE-S01.md) | n/a |
| STORY-014-01-draft | archived | none | [STORY- 014 01 Draft](knowledge/rfcs/EPIC-014-stake-distribution-traceability/STORY-014-01-draft.md) | n/a |
| STORY-014-02-core-infrastructure | archived | none | [STORY- 014 02 Core Infrastructure](knowledge/rfcs/EPIC-014-stake-distribution-traceability/STORY-014-02-core-infrastructure.md) | n/a |
| STORY-014-03-distribution-engine | archived | none | [STORY- 014 03 Distribution Engine](knowledge/rfcs/EPIC-014-stake-distribution-traceability/STORY-014-03-distribution-engine.md) | n/a |
| STORY-014-04-treasury-claims | archived | none | [STORY- 014 04 Treasury Claims](knowledge/rfcs/EPIC-014-stake-distribution-traceability/STORY-014-04-treasury-claims.md) | n/a |
| index | archived | none | [Index](knowledge/rfcs/index.md) | n/a |
| bri-164-marketplace-security-audit-plan | archived | none | [BRI-164 Marketplace Security Audit Plan](knowledge/security/audits/bri-164-marketplace-security-audit-plan.md) | n/a |
| index | archived | none | [Security Audits](knowledge/security/audits/index.md) | n/a |
| data-handling-privacy | archived | none | [Data Handling and Privacy](knowledge/security/compliance/data-handling-privacy.md) | n/a |
| index | archived | none | [Compliance Documentation](knowledge/security/compliance/index.md) | n/a |
| pci-compliance | archived | none | [PCI Compliance Notes](knowledge/security/compliance/pci-compliance.md) | n/a |
| smart-contract-security | archived | none | [Smart Contract Security Best Practices](knowledge/security/compliance/smart-contract-security.md) | n/a |
| index | archived | none | [Security](knowledge/security/index.md) | n/a |
| index | archived | none | [Threat Models](knowledge/security/threat-models/index.md) | n/a |
| marketplace | archived | none | [Marketplace Threat Model](knowledge/security/threat-models/marketplace.md) | n/a |
| mint-orchestrator | archived | none | [Mint Orchestrator Threat Model](knowledge/security/threat-models/mint-orchestrator.md) | n/a |
| index | archived | none | [Vulnerability Reports](knowledge/security/vulnerabilities/index.md) | n/a |
| marketplace-placeholder-graphs | archived | none | [Marketplace Release Placeholder Graphs (BRI-153)](knowledge/security/vulnerabilities/marketplace-placeholder-graphs.md) | n/a |
| shared-pr-policy-noise | archived | none | [Shared PR Policy Noise Reduction (BRI-153 related)](knowledge/security/vulnerabilities/shared-pr-policy-noise.md) | n/a |
| siws-login-inconsistency | archived | none | [SIWS Login Inconsistency — SignMessage Race / Nonce/Session (BRI-66)](knowledge/security/vulnerabilities/siws-login-inconsistency.md) | n/a |
| stake-unstake-release-visibility | archived | none | [Stake/Unstake Release Visibility (BRI-170)](knowledge/security/vulnerabilities/stake-unstake-release-visibility.md) | n/a |
