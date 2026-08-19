export interface OfflineQueueEntry {
  id: string;
  actionType: 'BUY_TOKENS' | 'CLAIM_DIVIDENDS' | 'UPDATE_PROFILE';
  payloadJson: string;
  createdAt: string;
  synced: boolean;
}

export interface PasskeyRecoveryChallenge {
  challengeId: string;
  userAddress: string;
  credentialId: string;
  verified: boolean;
}
