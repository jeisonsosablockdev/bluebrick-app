import { PropertyManagementDrizzleRepository } from '../infrastructure';
import { ManagedPropertyEntity } from '../domain';

export async function getManagedPropertiesQuery(): Promise<ManagedPropertyEntity[]> {
  const repo = new PropertyManagementDrizzleRepository();
  return repo.getManagedProperties();
}
