import { UserProfileEntity } from '../domain';

export class UserProfileDrizzleRepository {
  async getProfileByWallet(walletAddress: string): Promise<UserProfileEntity> {
    return {
      id: 'usr_01',
      email: 'investor@brids.io',
      fullName: 'Inversionista BRIDS Web3',
      primaryWalletAddress: walletAddress,
      kycStatus: 'VERIFIED',
      registeredAt: new Date().toISOString(),
    };
  }
}
