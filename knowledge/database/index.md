# Database

Database schemas, migrations, and data models.

## Migrations

* [001: Mint Job Idempotency](../db/migrations/001_mint_job_idempotency.sql)
* [002: Asset Upload Contracts](../db/migrations/002_asset_upload_contracts.sql)
* [003: Asset Import Jobs](../db/migrations/003_asset_import_jobs.sql)
* [004: Asset CDN Invalidation Events](../db/migrations/004_asset_cdn_invalidation_events.sql)
* [005: Asset Mint Snapshots](../db/migrations/005_asset_mint_snapshots.sql)
* [006: Marketplace Entries](../db/migrations/006_marketplace_entries.sql)
* [007: Purchase Attempts](../db/migrations/007_purchase_attempts.sql)
* [008: Purchase Anti-Bot](../db/migrations/008_purchase_antibot.sql)
* [009: Purchase Attempts Idempotency](../db/migrations/009_purchase_attempts_idempotency.sql)
* [010: Purchase Flow Events](../db/migrations/010_purchase_flow_events.sql)
* [011: Purchase Webhook Events](../db/migrations/011_purchase_webhook_events.sql)
* [012: Profile KYC Compliance](../db/migrations/012_profile_kyc_compliance.sql)
* [013: AML Screening Enrichment](../db/migrations/013_aml_screening_enrichment.sql)
* [014: Compliance Notes](../db/migrations/014_compliance_notes.sql)
* [015: User Profile Basic Info](../db/migrations/015_user_profile_basic_info.sql)
* [016: User Profile State Province](../db/migrations/016_user_profile_state_province.sql)
* [017: Authority Lifecycle Registry](../db/migrations/017_authority_lifecycle_registry.sql)
* [018: Checkout Dual Payment](../db/migrations/018_checkout_dual_payment.sql)
* [019: Marketplace Entry Collection Editor Fields](../db/migrations/019_marketplace_entry_collection_editor_fields.sql)
* [020: Asset Upload Edit Sessions](../db/migrations/020_asset_upload_edit_sessions.sql)
* [021: Marketplace Entry Location Form Fields](../db/migrations/021_marketplace_entry_location_form_fields.sql)
* [023: Referral Wallet First Schema](../db/migrations/023_referral_wallet_first_schema.sql)
* [024: Onboarding Profile Completion Rewards](../db/migrations/024_onboarding_profile_completion_rewards.sql)
* [025: Hybrid Auth Accounts](../db/migrations/025_hybrid_auth_accounts.sql)
* [026: Account Referral Intents](../db/migrations/026_account_referral_intents.sql)
* [027: Web Push Subscriptions](../db/migrations/027_web_push_subscriptions.sql)
* [028: Web Push Delivery Jobs](../db/migrations/028_web_push_delivery_jobs.sql)
* [029: Admin Push Campaigns](../db/migrations/029_admin_push_campaigns.sql)
* [030: Marketplace Entry Investment Model Fields](../db/migrations/030_marketplace_entry_investment_model_fields.sql)
* [031: Stake Profile Persistence](../db/migrations/031_stake_profile_persistence.sql)
* [032: Marketplace Entry Postal Code](../db/migrations/032_marketplace_entry_postal_code.sql)
* [033: Purchase Attempt Asset Verification](../db/migrations/033_purchase_attempt_asset_verification.sql)
* [034: Distribution Preparation](../db/migrations/034_distribution_preparation.sql)

## Data Models

* [Stake Event Model](models/stake-event.md)
* [Marketplace Entry Model](models/marketplace-entry.md)
* [Asset Mint Snapshot Model](models/asset-mint-snapshot.md)
* [User Profile Model](models/user-profile.md)
* [Purchase Attempt Model](models/purchase-attempt.md)