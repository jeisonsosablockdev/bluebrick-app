export interface UserProfileEntity {
  id: string;
  email: string;
  fullName: string;
  primaryWalletAddress: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  registeredAt: string;
}
