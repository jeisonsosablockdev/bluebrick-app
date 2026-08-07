'use client';

import React from 'react';
import { ManagedPropertyEntity } from '../domain';
import { PropertyManagementTable } from './property-management-table';

export interface PropertyManagementPageClientProps {
  properties: ManagedPropertyEntity[];
}

export function PropertyManagementPageClient({ properties }: PropertyManagementPageClientProps) {
  return (
    <section className="space-y-6">
      <PropertyManagementTable properties={properties} />
    </section>
  );
}
