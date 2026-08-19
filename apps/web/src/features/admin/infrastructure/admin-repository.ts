import { SystemHealthMetrics, AuditLogEntry } from '../domain';

export class AdminDrizzleRepository {
  async getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
    return {
      activePropertiesCount: 6,
      totalMarketCapUsd: 1250000,
      totalRegisteredUsers: 1420,
      kycVerifiedUsersCount: 890,
      solanaDevnetStatus: 'HEALTHY',
    };
  }

  async getRecentAuditLogs(): Promise<AuditLogEntry[]> {
    return [
      {
        id: 'log_01',
        actorWallet: 'SQDS426q...WYW45',
        action: 'MINT_TOKEN_COLLECTION',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
      },
    ];
  }
}
