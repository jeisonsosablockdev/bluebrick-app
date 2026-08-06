'use client';

import React, { useState } from 'react';
import { Card, Button } from '../../shared/ui';

export interface Property3DViewerProps {
  modelUrl?: string;
  title: string;
}

export function Property3DViewer({ modelUrl, title }: Property3DViewerProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'mesh'>('preview');

  return (
    <Card className="relative overflow-hidden bg-slate-950/80 border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h4 className="text-sm font-semibold text-slate-200">Visualizador 3D Interactivo: {title}</h4>
        <div className="flex gap-2">
          <Button variant={activeTab === 'preview' ? 'primary' : 'outline'} className="text-xs py-1 px-3" onClick={() => setActiveTab('preview')}>
            Vista 3D
          </Button>
          <Button variant={activeTab === 'mesh' ? 'primary' : 'outline'} className="text-xs py-1 px-3" onClick={() => setActiveTab('mesh')}>
            Malla Espacial
          </Button>
        </div>
      </div>

      <div className="h-64 w-full rounded-lg bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col items-center justify-center relative border border-slate-800/80">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/40 border-t-indigo-400 animate-spin mb-3"></div>
        <p className="text-xs text-indigo-300 font-mono">
          {modelUrl ? `Cargando Render 3D (${activeTab})...` : 'Modelo 3D Espacial en Proceso de Digitalización'}
        </p>
      </div>
    </Card>
  );
}
