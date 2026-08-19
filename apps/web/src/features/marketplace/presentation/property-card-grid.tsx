'use client';

import React from 'react';
import { PropertyEntity } from '../domain';
import { Card, Button } from '../../shared/ui';

export interface PropertyCardGridProps {
  properties: PropertyEntity[];
  onSelectProperty?: (property: PropertyEntity) => void;
}

export function PropertyCardGrid({ properties, onSelectProperty }: PropertyCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
      {properties.map((prop) => (
        <Card key={prop.id} title={prop.title} className="hover:border-indigo-500/50 transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{prop.location}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {prop.projectedApyPercentage}% APY
              </span>
            </div>
            <div className="space-y-1 text-sm text-slate-300 pt-2 border-t border-slate-800">
              <p className="flex justify-between">
                <span className="text-slate-400">Precio por Token:</span>
                <strong>${prop.tokenPriceUsd} USD</strong>
              </p>
              <p className="flex justify-between">
                <span className="text-slate-400">Tokens Disponibles:</span>
                <span>{prop.availableTokens.toLocaleString()} / {prop.totalTokens.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <Button variant="primary" className="w-full text-xs py-2 mt-4" onClick={() => onSelectProperty?.(prop)}>
            Ver Inmueble & Modelo 3D
          </Button>
        </Card>
      ))}
    </div>
  );
}
