'use client';

import React, { useState } from 'react';
import { Button } from '../../shared/ui';

export function OfflineSyncBanner() {
  const [pendingCount, setPendingCount] = useState(2);
  const [isSyncing, setIsSyncing] = useState(false);

  if (pendingCount === 0) return null;

  async function handleSync() {
    setIsSyncing(true);
    setTimeout(() => {
      setPendingCount(0);
      setIsSyncing(false);
    }, 1200);
  }

  return (
    <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 text-slate-100 flex items-center justify-between my-4">
      <div>
        <h5 className="font-semibold text-sm text-amber-300">Modo Offline Activo</h5>
        <p className="text-xs text-slate-400">Tienes <strong>{pendingCount} acciones en cola</strong> pendientes de sincronizar con Solana Devnet.</p>
      </div>
      <Button variant="primary" className="text-xs py-1.5 px-4" disabled={isSyncing} onClick={handleSync}>
        {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
      </Button>
    </div>
  );
}
