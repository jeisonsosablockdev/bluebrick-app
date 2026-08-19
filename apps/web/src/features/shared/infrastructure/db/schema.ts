/**
 * Database Schemas & Persistence Contracts
 */

export interface SystemAuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UserAccountRecord {
  id: string;
  walletAddress?: string;
  email?: string;
  role: 'admin' | 'operator' | 'investor';
  createdAt: string;
}
