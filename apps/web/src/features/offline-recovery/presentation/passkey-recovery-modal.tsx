'use client';

import React from 'react';
import { Modal, Button } from '../../shared/ui';

export interface PasskeyRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasskeyRecoveryModal({ isOpen, onClose }: PasskeyRecoveryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recuperación de Autocustodia vía Passkey">
      <div className="space-y-4 text-sm text-slate-300">
        <p>Utiliza tu huella dactilar, FaceID o llave de seguridad FIDO2 para autorizar la recuperación de tu cuenta sin depender de frases semilla exponibles.</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onClose}>Autenticar con Passkey</Button>
        </div>
      </div>
    </Modal>
  );
}
