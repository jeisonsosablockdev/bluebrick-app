'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../shared/ui';

export function PwaInstallBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-4 right-4 z-40 p-4 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md text-slate-100 shadow-2xl max-w-sm"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h4 className="font-semibold text-sm text-slate-100">Instala BRIDS App</h4>
            <p className="text-xs text-slate-400">Accede rápidamente desde tu pantalla de inicio y recibe notificaciones.</p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
        </div>
        <Button variant="primary" className="w-full text-xs py-1.5 mt-2" onClick={() => setDismissed(true)}>
          Instalar PWA
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
