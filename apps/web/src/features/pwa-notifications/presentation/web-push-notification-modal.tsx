'use client';

import React from 'react';
import { Modal, Button } from '../../shared/ui';

export interface WebPushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebPushNotificationModal({ isOpen, onClose }: WebPushNotificationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Activar Notificaciones Web Push">
      <div className="space-y-4 text-sm text-slate-300">
        <p>Recibe alertas instantáneas de pago de dividendos, confirmación de compras y actualizaciones de tus inmuebles.</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onClose}>Permitir Notificaciones</Button>
        </div>
      </div>
    </Modal>
  );
}
