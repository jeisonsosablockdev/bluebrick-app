---
type: Data Model
title: User Profile
description: User profile with KYC/compliance, onboarding reward, and stake eligibility
tags: [database, model, user, profile, kyc, compliance, reward, stake]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/auth.ts
---

# User Profile

## Database Tables (Migrations 012, 015, 016, 024, 025)
- `user_profiles`
- `compliance_notes`
- `compliance_audit_events`
- `onboarding_rewards`

## Core Profile Fields
```typescript
type UserProfile = {
  wallet_public_key: string;       // PK, from SIWS
  account_id: string | null;       // FK to WorkOS account (hybrid)
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  country: string | null;
  bio: string | null;
  avatar_url: string | null;
  username: string | null;
  compliance_status: ComplianceStatus;
  compliance_status_updated_at: Date;
  is_suspended: boolean;
  created_at: Date;
  updated_at: Date;
};
```

## Compliance Status
```typescript
type ComplianceStatus = 
  | "unverified" 
  | "pending_kyc" 
  | "pending_review" 
  | "verified" 
  | "restricted_aml" 
  | "suspended";
```

## KYC Fields (Migration 012, 013, 014)
```typescript
type KYCFields = {
  kyc_provider: "stripe" | null;
  kyc_session_id: string | null;
  kyc_report_id: string | null;
  kyc_status: "unverified" | "pending" | "verified" | "rejected";
  kyc_submitted_at: Date | null;
  kyc_verified_at: Date | null;
  aml_screened_at: Date | null;
  aml_status: "clear" | "flagged" | "not_screened";
};
```

## Onboarding Reward (Migration 024)
```typescript
type OnboardingReward = {
  id: string;
  wallet_public_key: string;
  status: RewardStatus;
  amount_usd: number;              // 10 USD (1000 cents)
  amount_usdc_atomic: number;      // USDC atomic units
  initial_registration_at: Date;
  qualification_deadline_at: Date; // +7 days
  kyc_submitted_at: Date | null;
  kyc_review_grace_deadline_at: Date | null; // +72h after KYC verified
  kyc_verified_at: Date | null;
  earned_at: Date | null;
  reserved_at: Date | null;
  consumed_at: Date | null;
  expired_at: Date | null;
};

type RewardStatus = 
  | "pending_profile" 
  | "pending_kyc" 
  | "pending_review" 
  | "earned" 
  | "reserved" 
  | "consumed" 
  | "expired";
```

## Reward Lifecycle
```
pending_profile → pending_kyc → pending_review → earned → reserved → consumed
                            ↘ expired (deadline missed)
                            ↘ pending_review → rejected → expired
```

## Qualification Rules
1. Complete profile (`first_name`, `country`, `email`) within 7 days
2. Submit KYC via Stripe Identity
3. KYC verified → 72h grace for admin review
4. Admin KYC decision → `earned` or `rejected`
5. At checkout: `reserved` → order confirmed → `consumed`

## Hybrid Auth (Migration 025)
- `account_id` links to WorkOS `workos_user_id`
- Federated-only sessions: `wallet_public_key` = null
- Wallet-linked: both `account_id` and `wallet_public_key` present
- Conflicting accounts → fail closed on introspection

## Related
- [Auth API](../api/endpoints/auth.md)
- [Auth Flow](../architecture/auth-flow.md)
- [Onboarding Reward Service](../lib/onboarding-reward-service.ts)