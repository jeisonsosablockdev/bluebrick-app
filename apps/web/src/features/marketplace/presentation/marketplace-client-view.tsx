'use client';

import React, { useState } from 'react';
import { PropertyEntity } from '../domain';
import { PropertyCardGrid } from './property-card-grid';
import { Property3DViewer } from './property-3d-viewer';

export interface MarketplaceClientViewProps {
  initialProperties: PropertyEntity[];
}

export function MarketplaceClientView({ initialProperties }: MarketplaceClientViewProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyEntity | null>(initialProperties[0] || null);

  return (
    <section className="space-y-8 my-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-100">Marketplace de Inmuebles Fraccionados</h1>
        <p className="text-slate-400">
          Explora proyectos inmobiliarios tokenizados con rendimientos en Solana Devnet y visores 3D interactivos.
        </p>
      </div>

      {selectedProperty && (
        <Property3DViewer modelUrl={selectedProperty.model3dUrl} title={selectedProperty.title} />
      )}

      <PropertyCardGrid properties={initialProperties} onSelectProperty={setSelectedProperty} />
    </section>
  );
}
