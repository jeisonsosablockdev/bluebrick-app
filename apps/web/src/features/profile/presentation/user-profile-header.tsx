'use client';

import React from 'react';
import { UserProfileEntity } from '../domain';
import { Card } from '../../shared/ui';

export interface UserProfileHeaderProps {
  profile: UserProfileEntity;
}

export function UserProfileHeader({ profile }: UserProfileHeaderProps) {
  return (
    <Card title="Perfil del Inversionista" className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">{profile.fullName}</h3>
          <p className="text-xs text-slate-400">{profile.email}</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold self-start md:self-auto">
          Estado KYC: {profile.kycStatus}
        </div>
      </div>
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono break-all">
        Wallet Principal: {profile.primaryWalletAddress}
      </div>
    </Card>
  );
}
