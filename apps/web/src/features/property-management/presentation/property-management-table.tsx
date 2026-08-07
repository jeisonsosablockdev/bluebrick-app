'use client';

import React from 'react';
import { ManagedPropertyEntity } from '../domain';
import { Card, Button } from '../../shared/ui';

export interface PropertyManagementTableProps {
  properties: ManagedPropertyEntity[];
}

export function PropertyManagementTable({ properties }: PropertyManagementTableProps) {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Catálogo de Activos Administrados</h3>
          <p className="text-xs text-slate-400">Gestiona los inventarios, precios de fracción y documentos descargables.</p>
        </div>
        <Button variant="primary" className="text-xs py-2 px-4 self-start sm:self-auto">
          + Nueva Propiedad
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Inmueble</th>
              <th className="p-3">Ubicación</th>
              <th className="p-3">Suministro Tokens</th>
              <th className="p-3">Precio / Token</th>
              <th className="p-3">APY Proyectado</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {properties.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-slate-100">{item.title}</td>
                <td className="p-3 text-slate-400">{item.location}</td>
                <td className="p-3">{item.availableTokens} / {item.totalTokensSupply} disponibles</td>
                <td className="p-3 font-semibold text-emerald-400">${item.tokenPriceUsd} USD</td>
                <td className="p-3 text-cyan-300 font-bold">{item.expectedApyPercent}%</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Button variant="outline" className="text-[10px] py-1 px-2.5">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
