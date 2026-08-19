export interface SystemHealthMetrics {
  activePropertiesCount: number;
  totalMarketCapUsd: number;
  totalRegisteredUsers: number;
  kycVerifiedUsersCount: number;
  solanaDevnetStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
}

export interface AuditLogEntry {
  id: string;
  actorWallet: string;
  action: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}
