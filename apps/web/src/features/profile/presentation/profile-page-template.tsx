'use client';

import React from 'react';
import { UserProfileEntity } from '../domain';
import { UserProfileHeader } from './user-profile-header';

export interface ProfilePageTemplateProps {
  profile: UserProfileEntity;
}

export function ProfilePageTemplate({ profile }: ProfilePageTemplateProps) {
  return (
    <section className="max-w-4xl mx-auto py-8 space-y-6">
      <UserProfileHeader profile={profile} />
    </section>
  );
}
