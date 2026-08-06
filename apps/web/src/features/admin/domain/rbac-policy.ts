export type AdminRole = 'SUPER_ADMIN' | 'ASSET_MANAGER' | 'COMPLIANCE_OFFICER';

export interface RbacPolicy {
  role: AdminRole;
  canMintTokens: boolean;
  canApproveKyc: boolean;
  canTriggerPayouts: boolean;
  canFreezeAssets: boolean;
}

export function evaluateRbacPolicy(role: AdminRole): RbacPolicy {
  switch (role) {
    case 'SUPER_ADMIN':
      return { role, canMintTokens: true, canApproveKyc: true, canTriggerPayouts: true, canFreezeAssets: true };
    case 'ASSET_MANAGER':
      return { role, canMintTokens: true, canApproveKyc: false, canTriggerPayouts: true, canFreezeAssets: false };
    case 'COMPLIANCE_OFFICER':
      return { role, canMintTokens: false, canApproveKyc: true, canTriggerPayouts: false, canFreezeAssets: true };
  }
}
