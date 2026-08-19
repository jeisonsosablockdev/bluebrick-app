/**
 * Hybrid Identity Reconciler (Wallet Address <-> Email Session)
 */

export interface HybridAuthSession {
  sessionId: string;
  walletAddress?: string;
  email?: string;
  role: 'admin' | 'operator' | 'investor';
}

export function reconcileHybridSession(walletAddress?: string, email?: string): HybridAuthSession {
  return {
    sessionId: `session_${Date.now()}`,
    walletAddress,
    email,
    role: email?.endsWith('@brids.io') ? 'admin' : 'investor',
  };
}
