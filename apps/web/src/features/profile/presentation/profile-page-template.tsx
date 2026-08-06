'use client';

import React from 'react';
import { UserProfileEntity } from '../domain';
import { UserProfileHeader } from './user-profile-header';
import { ProfileKycModule } from '@/components/dashboard/profile-kyc-module';

export interface ProfilePageTemplateProps {
  profile: UserProfileEntity;
}

export function ProfilePageTemplate({ profile }: ProfilePageTemplateProps) {
  return (
    <section className="max-w-6xl mx-auto py-6 space-y-8">
      <UserProfileHeader profile={profile} />
      <ProfileKycModule />
    </section>
  );
}
