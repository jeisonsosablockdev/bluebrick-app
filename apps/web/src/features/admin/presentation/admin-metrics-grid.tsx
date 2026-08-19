'use client';

import React from 'react';
import { SystemHealthMetrics } from '../domain';

export interface AdminMetricsGridProps {
  metrics: SystemHealthMetrics;
}

export function AdminMetricsGrid({ metrics }: AdminMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Inmuebles Activos</span>
        <div className="text-2xl font-bold text-slate-100 mt-1">{metrics.activePropertiesCount} Propiedades</div>
      </div>
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Capitalización Total</span>
        <div className="text-2xl font-bold text-emerald-400 mt-1">${metrics.totalMarketCapUsd.toLocaleString()} USD</div>
      </div>
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Usuarios Registrados</span>
        <div className="text-2xl font-bold text-slate-100 mt-1">{metrics.totalRegisteredUsers} Inversionistas</div>
      </div>
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Usuarios KYC Aprobados</span>
        <div className="text-2xl font-bold text-cyan-400 mt-1">{metrics.kycVerifiedUsersCount} Aprobados</div>
      </div>
    </div>
  );
}
