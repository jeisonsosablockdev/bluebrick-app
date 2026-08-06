'use client';

import React from 'react';
import { ReferralSummaryEntity, InviteeEntity } from '../domain';
import { ReferralCodeCard } from './referral-code-card';
import { ReferralsInviteesTable } from './referrals-invitees-table';

export interface ReferralPageClientProps {
  summary: ReferralSummaryEntity;
  invitees: InviteeEntity[];
}

export function ReferralPageClient({ summary, invitees }: ReferralPageClientProps) {
  return (
    <section className="space-y-6">
      <ReferralCodeCard summary={summary} />
      <ReferralsInviteesTable invitees={invitees} />
    </section>
  );
}
