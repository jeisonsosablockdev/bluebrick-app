import { UserProfileDrizzleRepository } from '../infrastructure';
import { UserProfileEntity } from '../domain';

export async function getUserProfileQuery(walletAddress: string): Promise<UserProfileEntity> {
  const repo = new UserProfileDrizzleRepository();
  return repo.getProfileByWallet(walletAddress);
}
